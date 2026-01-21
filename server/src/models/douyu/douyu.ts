import axios, { AxiosInstance, AxiosResponse } from 'axios';
import * as crypto from 'crypto';
import {
  Quality,
  QualityNames,
  EncryptionKey,
  SignParams,
  RoomInfo,
  StreamData,
  StreamUrlResult,
  RequestConfig
} from './types';

export { Quality, QualityNames };

/**
 * 斗鱼直播 API 类
 * 
 * 使用示例：
 * ```typescript
 * const api = new DouyuApi();
 * const info = await api.getRoomInfo('https://www.douyu.com/3484');
 * const stream = await api.getStreamUrl('3484', Quality.BLUE8M);
 * ```
 */
export class DouyuApi {
  private http: AxiosInstance;
  private did: string;

  constructor(did: string = '10000000000000000000000000003306') {
    this.did = did;
    
    // 创建 Axios 实例
    this.http = axios.create({
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
      }
    });
  }

  /**
   * HTTP 请求封装
   */
  private async request<T>(url: string, config: RequestConfig = {}): Promise<T> {
    const {
      method = 'GET',
      headers = {},
      data,
      timeout = 30000
    } = config;

    try {
      const response: AxiosResponse<T> = await this.http.request({
        url,
        method,
        headers: headers as any,
        data,
        timeout
      });
      return response.data;
    } catch (error: any) {
      console.error(`请求失败: ${url}`, error.message);
      throw new Error(`HTTP 请求失败: ${error.message}`);
    }
  }

  /**
   * ============= 第 1 步：MD5 加密 =============
   */
  private md5(data: string): string {
    return crypto.createHash('md5').update(data, 'utf8').digest('hex');
  }

  /**
   * ============= 第 2 步：从 URL 提取房间号 =============
   */
  public extractRoomId(url: string): string {
    // 方法 1: 从 URL 参数中获取 rid
    const ridMatch = url.match(/[?&]rid=(\d+)/);
    if (ridMatch) {
      return ridMatch[1];
    }

    // 方法 2: 从 URL 路径中获取房间号
    const pathMatch = url.match(/douyu\.com\/(\d+)/);
    if (pathMatch) {
      return pathMatch[1];
    }

    // 方法 3: 取 URL 最后一段
    const parts = url.split('/').filter(Boolean);
    if (parts.length > 0) {
      const lastPart = parts[parts.length - 1];
      const ridMatch2 = lastPart.match(/^(\d+)/);
      if (ridMatch2) {
        return ridMatch2[1];
      }
    }

    throw new Error(`无法从 URL 提取房间号: ${url}`);
  }

  /**
   * ============= 第 3 步：获取加密密钥 =============
   * 
   * 这是获取直播源最关键的步骤！
   * 需要请求斗鱼的加密 API，然后进行 MD5 加密生成签名
   */
  private async getEncryptionParams(rid: string): Promise<SignParams> {
    try {
      // 1. 请求加密 API
      const keyUrl = `https://www.douyu.com/wgapi/livenc/liveweb/websec/getEncryption?did=${this.did}`;
      const response = await this.request<{ error: number; data: EncryptionKey }>(keyUrl, {
        headers: {
          'Referer': `https://www.douyu.com/${rid}`
        }
      });

      if (response.error !== 0 || !response.data) {
        throw new Error(`获取加密密钥失败: error=${response.error}`);
      }

      const encKey = response.data;
      const ts = Math.floor(Date.now() / 1000); // 当前时间戳

      // 2. 构建待签名字符串
      //    普通房间: sign_str = "{rid}{ts}"
      //    特殊房间: sign_str = ""
      const signStr = encKey.is_special === 1 ? '' : `${rid}${ts}`;

      // 3. MD5 加密 - 第 1 轮（多次迭代）
      //    循环 enc_time 次，每次都 MD5 加密
      let auth = encKey.rand_str;
      for (let i = 0; i < encKey.enc_time; i++) {
        auth = this.md5(auth + encKey.key);
      }

      // 4. MD5 加密 - 第 2 轮（最终签名）
      //    MD5(auth + key + sign_str)
      auth = this.md5(auth + encKey.key + signStr);

      // 5. 返回签名参数
      return {
        enc_data: encKey.enc_data,
        did: this.did,
        ts: ts,
        auth: auth
      };
    } catch (error: any) {
      console.error('获取加密参数失败:', error.message);
      throw error;
    }
  }

  /**
   * ============= 第 4 步：获取房间信息 =============
   */
  public async getRoomInfo(url: string): Promise<RoomInfo> {
    try {
      const rid = this.extractRoomId(url);

      // 请求后端 API 获取房间信息
      const apiUrl = `https://www.douyu.com/betard/${rid}`;
      const response = await this.request<{
        room: {
          nickname: string;
          room_name: string;
          videoLoop: number;
          show_status: number;
          room_id: number;
        }
      }>(apiUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0'
        }
      });

      const room = response.room;
      const isLive = room.videoLoop === 0 && room.show_status === 1;

      return {
        anchor_name: room.nickname,
        title: room.room_name.replace(/&nbsp;/g, ' '),
        is_live: isLive,
        room_id: room.room_id
      };
    } catch (error: any) {
      console.error('获取房间信息失败:', error.message);
      throw error;
    }
  }

  /**
   * ============= 第 5 步：获取直播流数据 =============
   */
  private async getStreamData(rid: string, quality: Quality = Quality.AUTO): Promise<StreamData> {
    try {
      // 1. 获取加密签名
      const signParams = await this.getEncryptionParams(rid);

      // 2. 构建 POST 数据
      //    格式：key1=value1&key2=value2...
      const postData = new URLSearchParams({
        enc_data: signParams.enc_data,
        tt: signParams.ts.toString(),
        did: signParams.did,
        auth: signParams.auth,
        cdn: '',                  // CDN 服务器，空=自动选择
        rate: quality,            // 画质
        hevc: '0',                 // HEVC 编码，0=不使用
        fa: '0',                   // 快速适配
        ive: '0'                   // 未知参数
      }).toString();

      // 3. 请求直播流 API
      const apiUrl = `https://www.douyu.com/lapi/live/getH5PlayV1/${rid}`;
      const response = await this.request<StreamData>(apiUrl, {
        method: 'POST',
        headers: {
          'Referer': `https://www.douyu.com/${rid}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: postData
      });

      return response;
    } catch (error: any) {
      console.error('获取直播流数据失败:', error.message);
      throw error;
    }
  }

  /**
   * ============= 第 6 步：获取完整的直播流 URL =============
   */
  public async getStreamUrl(rid: string, quality: Quality = Quality.AUTO): Promise<StreamUrlResult> {
    try {
      // 1. 获取直播流数据
      const streamData = await this.getStreamData(rid, quality);

      // 2. 检查是否成功
      if (streamData.error !== 0) {
        return {
          success: false,
          error: streamData.msg || `获取失败 (error=${streamData.error})`
        };
      }

      // 3. 解析直播流 URL
      const data = streamData.data;
      if (!data || !data.rtmp_url || !data.rtmp_live) {
        return {
          success: false,
          error: '直播流数据不完整'
        };
      }

      // 4. 拼接完整 URL
      //    格式：{rtmp_url}/{rtmp_live}
      const fullUrl = `${data.rtmp_url}/${data.rtmp_live}`;

      return {
        success: true,
        url: fullUrl
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * ============= 辅助方法：获取所有画质的直播流 =============
   */
  public async getAllStreamUrls(rid: string): Promise<Array<{
    quality: Quality;
    qualityName: string;
    url: string;
  }>> {
    const results = [];
    const qualities: Quality[] = [
      Quality.AUTO,
      Quality.SMOOTH,
      Quality.HD,
      Quality.SUPERHD,
      Quality.BLUE4M,
      Quality.BLUE8M
    ];

    for (const quality of qualities) {
      try {
        const result = await this.getStreamUrl(rid, quality);
        if (result.success && result.url) {
          results.push({
            quality,
            qualityName: QualityNames[quality],
            url: result.url
          });
        }
      } catch (error: any) {
        console.error(`获取画质 ${quality} 失败:`, error.message);
      }
    }

    return results;
  }

  /**
   * ============= 辅助方法：便捷获取直播流 =============
   * 
   * @param url - 房间 URL（如 https://www.douyu.com/3484）
   * @param quality - 画质（默认蓝光 8M）
   */
  public async getStreamUrlByUrl(url: string, quality: Quality = Quality.BLUE8M): Promise<StreamUrlResult> {
    try {
      // 1. 获取房间信息（验证是否直播）
      const roomInfo = await this.getRoomInfo(url);
      
      if (!roomInfo.is_live) {
        return {
          success: false,
          error: `主播 "${roomInfo.anchor_name}" 未开播`
        };
      }

      // 2. 获取直播流 URL
      const rid = this.extractRoomId(url);
      return await this.getStreamUrl(rid, quality);
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}
