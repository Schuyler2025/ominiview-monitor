import express from 'express';
import cors from 'cors';
import { Huya } from './models/huya';
import { Bilibili } from './models/bilibili';
import { DouyuApi } from './models/douyu/douyu';

const app = express();

app.use(cors());
app.use(express.json());

app.post('/api/parse-url', async (req, res) => {
  try {
    const {url} = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    try {
      new URL(url);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid URL' });
    }

    const result = await parser.parse(url);

    if (result) {
      return res.json({
        success: true,
        data: result,
      });
    } else {
      return res.status(404).json({
        success: false,
        error: 'Can not parse this url',
      });
    }
  } catch (error) {
    console.error('Error parsing stream URL:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }

});

class StreamUrlParser {
  private async parseDouyu(url: string) {
    try {
      const roomIdMatch = url.match(/douyu\.com\/(\d+)/);
      if (!roomIdMatch) return null;

      const roomId = roomIdMatch[1];
      // TODO: 解析斗鱼直播间
      const douyu = new DouyuApi();
      const links = await douyu.getStreamUrl(roomId);

      return {
        title: `斗鱼直播间 ${roomId}`,
        streamUrl: url,
        platform: 'Douyu',
        links: links
      };

    } catch (error) {
      console.error('Error parsing Douyu URL:', error);
    }
    return null;
  }

  private async parseHuya(url: string) {
    try {
      const roomIdMatch = url.match(/huya\.com\/(\d+)/);
      if (!roomIdMatch) return null;

      const roomId = roomIdMatch[1];
      // TODO: 解析虎牙直播间
      const huya = new Huya(Number(roomId), url);
      const links = await huya.getLiveLinks();
      return {
        title: `虎牙直播间 ${roomId}`,
        streamUrl: url,
        platform: 'Huya',
        links: links
      };
    } catch (error) {
      console.error('Error parsing Huya URL:', error);
    }
    return null;
  }



  private async parseBilibili(url: string) {
    try {
      // 匹配Bilibili URL格式：live.bilibili.com/roomId 或 bilibili.com/live/roomId
      const roomIdMatch = url.match(/(?:live\.bilibili\.com|bilibili\.com\/live)\/(\d+)/);
      if (!roomIdMatch) return null;

      const roomId = roomIdMatch[1];
      // 使用默认cookie，实际应用中应该从配置或用户输入获取
      const defaultCookie = '';
      const bilibili = new Bilibili(defaultCookie, Number(roomId), url);
      const links = await bilibili.getLiveLinks();

      return {
        title: `Bilibili直播间 ${roomId}`,
        streamUrl: url,
        platform: 'Bilibili',
        links: links
      };

    } catch (error) {
      console.error('Error parsing Bilibili URL:', error);
    }
    return null;
  }

  async parse(url: string) {
    if (url.includes('douyu.com')) {
      return await this.parseDouyu(url);
    } else if (url.includes('huya.com')) {
      return await this.parseHuya(url);
    } else if (url.includes('bilibili.com')) {
      return await this.parseBilibili(url);
    }
    return null;
  }
}

const parser = new StreamUrlParser();



app.listen(3001, () => {
  console.log('Server is running on port 3001');
});


