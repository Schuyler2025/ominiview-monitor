export enum GridLayout {
  Single = '1x1',
  Dual = '1x2',
  Quad = '2x2',
  Nine = '3x3',
  Sixteen = '4x4'
}

export interface LiveLinks {
  mobile?: string;
  pc?: string;
  cdnLinks: {
    flv: string[];
    m3u8: string[];
  };
  proxy?: string;
}

export interface StreamSource {
  id: string;
  title: string;
  url: string; // 主播放 URL
  links?: LiveLinks; // 所有可用的播放链接
  location: string;
  isMuted: boolean;
  status: 'live' | 'connecting' | 'error';
  platform?: string; // 直播平台（如 Douyu, Huya 等）
}

export interface IconProps {
  className?: string;
  size?: number;
  onClick?: () => void;
}