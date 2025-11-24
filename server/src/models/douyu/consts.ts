/*
 * @Author: Schuyler schuylerhu@gmail.com
 * @Date: 2025-11-24 07:54:44
 * @LastEditors: Schuyler schuylerhu@gmail.com
 * @LastEditTime: 2025-11-24 07:54:53
 * @FilePath: \ominiview-monitor\server\src\models\douyu\consts.ts
 * @Description:
 *
 * Copyright (c) 2025 by Schuyler, All Rights Reserved.
 */
interface Format {
  readonly flv: boolean;
  readonly m3u8: boolean;
}



type CDN = "douyucdn.cn/live/" | "douyucdn2.cn/dyliveflv1a/";
type Prefix = string;

type Config = Record<Prefix, Format>;

export const CDNS: Record<CDN, Config> = {
  "douyucdn2.cn/dyliveflv1a/": {},
  "douyucdn.cn/live/": {
    "hls3a-akm": { flv: false, m3u8: true },
    "hls3-akm": { flv: false, m3u8: true },
    "hlsa-akm": { flv: false, m3u8: true },
  },
};

export const DOUYU_PROXY = "https://epg.112114.xyz/douyu/";