export enum GridLayout {
  Single = '1x1',
  Dual = '1x2',
  Quad = '2x2',
  Nine = '3x3',
  Sixteen = '4x4'
}

export interface StreamLinks {
  flv?: Record<string, string> | string[];
  hls?: Record<string, string> | string[];
  url?: string;
  proxy?: string;
  cdnLinks?: {
    m3u8?: string[];
    flv?: string[];
  };
}

export interface StreamSource {
  id: string;
  title: string;
  url: string;
  links?: StreamLinks;
  location: string;
  isMuted: boolean;
  status: 'live' | 'connecting' | 'error';
  platform?: string;
}

export interface IconProps {
  className?: string;
  size?: number;
}
