/*
 * @Author: Schuyler schuylerhu@gmail.com
 * @Date: 2025-11-23 16:27:00
 * @LastEditors: Schuyler schuylerhu@gmail.com
 * @LastEditTime: 2025-11-24 14:25:56
 * @FilePath: \ominiview-monitor\constants.ts
 * @Description:
 *
 * Copyright (c) 2025 by Schuyler, All Rights Reserved.
 */
import { StreamSource } from './types';

// Using public domain/creative commons stock footage to simulate live feeds
// In a real app, these would be HLS (.m3u8) or WebRTC stream URLs.
export const MOCK_STREAMS: Omit<StreamSource, 'id' | 'isMuted' | 'status'>[] = [
  {
    title: "qitux",
    url: "http://al.hls.huya.com/src/1661091641-1661091641-7134334273753972736-3322306738-10057-A-0-1-imgplus.m3u8?wsSecret=77ebe5e80874e139c70187cdeb8d34ed&wsTime=69254489&ctype=tars_mp&fs=bgct&t=102&ver=1&sv=2110211124&seqid=3234394240829&uid=1470430582776&uuid=3698207500",
    location: ""
  },
  {
    title: "honglian",
    url: "http://al.hls.huya.com/src/1191588902-1191588902-5117835364366548992-2383301260-10057-A-0-1-imgplus.m3u8?wsSecret=345bca0185b0b491926f88dee80d55d5&wsTime=69254904&ctype=tars_mp&fs=bgct&t=102&ver=1&sv=2110211124&seqid=3234381503217&uid=1470416697980&uuid=550424525",
    location: ""
  },
  {
    title: "chuqi",
    url: "http://al.hls.huya.com/src/1558173124-1558173124-6692302609086152704-3116469704-10057-A-0-1-imgplus.m3u8?wsSecret=95ec99c852ad537e563145acc46c7589&wsTime=6925496d&ctype=tars_mp&fs=bgct&t=102&ver=1&sv=2110211124&seqid=3234395494846&uid=1470430584745&uuid=655288126",
    location: ""
  },
  {
    title: "flancy",
    url: "http://hls3a-akm.douyucdn.cn/live/1405051r2M7PGjvc.m3u8",
    location: ""
  }

];

export const MAX_STREAMS = 16;