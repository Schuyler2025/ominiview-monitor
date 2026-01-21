// ============= 核心类型定义 =============

/**
 * 直播流质量选项
 */
export enum Quality {
  AUTO = '-1',
  SMOOTH = '0',    // 流畅
  HD = '1',        // 高清
  SUPERHD = '2',   // 超清
  BLUE4M = '3',    // 蓝光 4M
  BLUE8M = '4'     // 蓝光 8M
}

/**
 * 直播流质量名称映射
 */
export const QualityNames: Record<Quality, string> = {
  [Quality.AUTO]: '自动',
  [Quality.SMOOTH]: '流畅',
  [Quality.HD]: '高清',
  [Quality.SUPERHD]: '超清',
  [Quality.BLUE4M]: '蓝光 4M',
  [Quality.BLUE8M]: '蓝光 8M'
};

/**
 * 加密密钥数据
 */
export interface EncryptionKey {
  rand_str: string;      // 随机字符串
  key: string;            // 加密密钥
  enc_time: number;       // 加密迭代次数
  enc_data: string;       // 加密后的数据
  is_special: number;     // 是否是特殊房间
}

/**
 * 签名参数
 */
export interface SignParams {
  enc_data: string;       // 加密数据
  did: string;            // 设备 ID
  ts: number;             // 时间戳
  auth: string;           // 签名
}

/**
 * 房间信息
 */
export interface RoomInfo {
  anchor_name: string;    // 主播昵称
  title?: string;         // 直播标题
  is_live: boolean;       // 是否正在直播
  room_id?: number;       // 房间号
}

/**
 * 直播流数据
 */
export interface StreamData {
  error: number;          // 0=成功, 非0=失败
  msg?: string;           // 错误信息
  data?: {
    rtmp_url: string;     // RTMP URL 基础路径
    rtmp_live: string;    // RTMP 流名称
    rate: Record<string, string>; // 画质选项
    cdn_list: string[];   // CDN 列表
  };
}

/**
 * 直播流 URL 结果
 */
export interface StreamUrlResult {
  success: boolean;       // 是否成功
  url?: string;           // 完整的直播流 URL
  error?: string;         // 错误信息
}

/**
 * HTTP 请求配置
 */
export interface RequestConfig {
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  data?: string;
  timeout?: number;
}

/**
 * API 响应
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
