import React, { useState, useCallback } from 'react';
import { StreamSource, GridLayout } from './types';
import { MOCK_STREAMS, MAX_STREAMS } from './constants';
import StreamTile from './components/StreamTile';
import { GridIcon, PlusIcon, MonitorPlayIcon, LinkIcon, XIcon } from './components/Icons';

const PLATFORMS = [
  "Douyu (斗鱼)",
  "Huya (虎牙)",
];

function App() {
  const [streams, setStreams] = useState<StreamSource[]>([]);
  const [layout, setLayout] = useState<GridLayout>(GridLayout.Quad);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [currentStreamIndex, setCurrentStreamIndex] = useState(0);

  let bestUrl = "";

  // Add a random stream from the mock list
  const addRandomStream = useCallback(() => {
    if (streams.length >= MAX_STREAMS) return;

    const nextStream = MOCK_STREAMS[currentStreamIndex % MOCK_STREAMS.length];
    const newStream: StreamSource = {
      ...nextStream,
      id: Date.now().toString() + Math.random().toString(36).substring(7),
      isMuted: true, // Default to muted to prevent chaos
      status: 'connecting'
    };

    setStreams(prev => [...prev, newStream]);
    setCurrentStreamIndex(prev => prev + 1);
  }, [streams, currentStreamIndex]);

  const parseStreamUrl = async (url: string): Promise<{success: boolean, data?: any, error?: string}> => {
    try {
      const response = await fetch('http://localhost:3001/api/parse-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        return {success: true, data: result.data};
      } else {
        return {
          success: false,
          error: result.error || 'Fail to parse URL',
        }
      }

    } catch (error) {
      console.error('Error parsing stream URL:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  };

  // Add custom stream
  const handleAddCustomStream = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl) return;

    try {
      // 检查是否是直播流链接（m3u8或flv格式）
      const isDirectStream = customUrl.includes('.m3u8') ||
                           customUrl.includes('.flv') ||
                           customUrl.includes('flvjs');

      let finalUrl = customUrl;
      let finalTitle = customTitle || "Custom Stream";

      // 如果不是直接可播放的链接，尝试解析
      if (!isDirectStream) {
        try {
          const response = await fetch('http://localhost:3001/api/parse-url', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: customUrl }),
          });

          if (response.ok) {
            const result = await response.json();
            console.log('解析结果:', result);

            if (result.success && result.data) {
              const parsedData = result.data;

              // 链接优先级列表（按优先级从高到低）
              const urlCandidates: string[] = [];

              // 虎牙格式优先级
              if (parsedData.links?.flv && typeof parsedData.links.flv === 'object') {
                Object.values(parsedData.links.flv).forEach(url => {
                  if (typeof url === 'string') urlCandidates.push(url);
                });
              }

              if (parsedData.links?.hls && typeof parsedData.links.hls === 'object') {
                Object.values(parsedData.links.hls).forEach(url => {
                  if (typeof url === 'string') urlCandidates.push(url);
                });
              }

              // 斗鱼格式优先级
              if (parsedData.links?.pc && typeof parsedData.links.pc === 'string') {
                urlCandidates.push(parsedData.links.pc);
              }

              if (parsedData.links?.mobile && typeof parsedData.links.mobile === 'string') {
                urlCandidates.push(parsedData.links.mobile);
              }

              // CDN链接
              if (parsedData.links?.cdnLinks?.m3u8 && Array.isArray(parsedData.links.cdnLinks.m3u8)) {
                parsedData.links.cdnLinks.m3u8.forEach(url => {
                  if (typeof url === 'string') urlCandidates.push(url);
                });
              }

              if (parsedData.links?.cdnLinks?.flv && Array.isArray(parsedData.links.cdnLinks.flv)) {
                parsedData.links.cdnLinks.flv.forEach(url => {
                  if (typeof url === 'string') urlCandidates.push(url);
                });
              }

              // 代理链接
              if (parsedData.links?.proxy && typeof parsedData.links.proxy === 'string') {
                urlCandidates.push(parsedData.links.proxy);
              }

              // 原始流URL
              if (parsedData.streamUrl && typeof parsedData.streamUrl === 'string') {
                urlCandidates.push(parsedData.streamUrl);
              }

              // 选择第一个有效的链接
              if (urlCandidates.length > 0) {
                finalUrl = urlCandidates[0];
                console.log(`找到 ${urlCandidates.length} 个候选链接，选择:`, finalUrl);
              }

              finalTitle = parsedData.title || finalTitle;
            }
          }
        } catch (parseError) {
          console.warn('URL解析失败，使用原始URL:', parseError);
        }
      }

      const newStream: StreamSource = {
        id: Date.now().toString() + Math.random().toString(36).substring(7),
        title: finalTitle,
        url: finalUrl,
        location: "External Source",
        isMuted: true,
        status: 'connecting'
      };

      setStreams(prev => [...prev, newStream]);
    } catch (error) {
      console.error('Error adding stream:', error);
      // 出错时仍然添加，但标记为错误状态
      const newStream: StreamSource = {
        id: Date.now().toString() + Math.random().toString(36).substring(7),
        title: customTitle || "Unknown Source",
        url: customUrl,
        location: "External Source",
        isMuted: true,
        status: 'error'
      };
      setStreams(prev => [...prev, newStream]);
    } finally {
      setIsModalOpen(false);
      setCustomUrl('');
      setCustomTitle('');
    }
  };

  const removeStream = useCallback((id: string) => {
    setStreams(prev => {
      const newStreams = prev.filter(s => s.id !== id);

      // 如果移除的是通过顺序添加的流，需要更新索引
      if (prev.length > newStreams.length) {
        // 检查移除的流是否来自MOCK_STREAMS
        const removedStream = prev.find(s => s.id === id);
        if (removedStream && MOCK_STREAMS.some(mock => mock.title === removedStream.title)) {
          // 如果移除的是最后一个流，重置索引到0
          // 否则保持当前索引不变（因为移除的是中间某个流）
          if (newStreams.length === 0) {
            setCurrentStreamIndex(0);
          }
        }
      }

      return newStreams;
    });
  }, []);

  const toggleMute = useCallback((id: string) => {
    setStreams(prev => prev.map(s => {
      if (s.id === id) return { ...s, isMuted: !s.isMuted };
      return s;
    }));
  }, []);

  // Determine Tailwind grid class based on layout state
  const getGridClass = () => {
    switch (layout) {
      case GridLayout.Single: return 'grid-cols-1 grid-rows-1';
      case GridLayout.Dual: return 'grid-cols-1 md:grid-cols-2 grid-rows-2 md:grid-rows-1';
      case GridLayout.Quad: return 'grid-cols-2 grid-rows-2';
      case GridLayout.Nine: return 'grid-cols-3 grid-rows-3';
      case GridLayout.Sixteen: return 'grid-cols-4 grid-rows-4';
      default: return 'grid-cols-2';
    }
  };

  return (
    <div className="flex h-screen w-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans selection:bg-emerald-500/30">

      {/* Sidebar / Control Panel */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-16'} flex-shrink-0 bg-zinc-900 border-r border-zinc-800 transition-all duration-300 flex flex-col z-40 shadow-xl`}>
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            {isSidebarOpen && (
                <div className="flex items-center gap-2 text-emerald-500">
                    <MonitorPlayIcon size={24} />
                    <h1 className="font-bold tracking-wider uppercase text-sm">52偷理解</h1>
                </div>
            )}
            <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white"
            >
                <GridIcon size={20} />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-8">
            {/* Layout Controls */}
            <div className="space-y-3">
                {isSidebarOpen && <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Layout Mode</h2>}
                <div className="grid grid-cols-2 gap-2">
                    {Object.values(GridLayout).map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setLayout(mode)}
                            className={`
                                px-3 py-2 text-xs rounded border transition-all
                                ${layout === mode
                                    ? 'bg-emerald-900/30 border-emerald-500/50 text-emerald-400'
                                    : 'bg-zinc-800 border-transparent text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'}
                                ${!isSidebarOpen ? 'w-full flex justify-center' : ''}
                            `}
                            title={`Set layout to ${mode}`}
                        >
                            {mode}
                        </button>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
                {isSidebarOpen && <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Stream Actions</h2>}

                <button
                    onClick={addRandomStream}
                    disabled={streams.length >= MAX_STREAMS}
                    className={`
                        w-full py-3 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/20
                        ${streams.length >= MAX_STREAMS ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    title="Add Simulated Camera"
                >
                    <PlusIcon size={18} />
                    {isSidebarOpen && "Add Camera Feed"}
                </button>

                 <button
                    onClick={() => setIsModalOpen(true)}
                    disabled={streams.length >= MAX_STREAMS}
                    className={`
                        w-full py-3 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-sm flex items-center justify-center gap-2 transition-all border border-zinc-700
                        ${streams.length >= MAX_STREAMS ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    title="Add Custom URL"
                >
                    <LinkIcon size={18} />
                    {isSidebarOpen && "Add Custom URL"}
                </button>

                {isSidebarOpen && (
                    <p className="text-[10px] text-zinc-600 text-center">
                        {streams.length} / {MAX_STREAMS} Active Channels
                    </p>
                )}
            </div>

            {/* Stats (Decorative) */}
             {isSidebarOpen && (
                <div className="space-y-2 p-3 bg-black/20 rounded border border-zinc-800/50">
                    <div className="flex justify-between text-xs">
                        <span className="text-zinc-500">NGA</span>
                        <span className="text-emerald-500 font-mono">hyfc</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-zinc-500">Github</span>
                        <span className="text-emerald-500 font-mono">Schuyler2025</span>
                    </div>
                     <div className="flex justify-between text-xs">
                        <span className="text-zinc-500">在线求职</span>
                        <span className="text-yellow-500 font-mono">ing...</span>
                    </div>
                </div>
             )}
        </div>

        <div className="p-4 border-t border-zinc-800">
            <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                {isSidebarOpen && <span className="text-xs text-zinc-400 uppercase tracking-widest">System Online</span>}
            </div>
        </div>
      </div>

      {/* Main Grid Area */}
      <div className="flex-1 bg-zinc-900 relative p-2 overflow-hidden">
        {streams.length === 0 ? (
            <div className="h-full w-full flex flex-col items-center justify-center text-zinc-600 space-y-4 border-2 border-dashed border-zinc-800 rounded-xl">
                <MonitorPlayIcon size={64} className="opacity-20" />
                <p className="text-lg font-medium">No active feeds</p>
                <div className="flex gap-4">
                    <button onClick={addRandomStream} className="text-emerald-500 hover:underline text-sm">Add Simulated Cam</button>
                    <span className="text-zinc-700">|</span>
                    <button onClick={() => setIsModalOpen(true)} className="text-emerald-500 hover:underline text-sm">Add URL</button>
                </div>
            </div>
        ) : (
            <div className={`grid gap-2 w-full h-full ${getGridClass()}`}>
                {streams.map((stream) => (
                    <StreamTile
                        key={stream.id}
                        stream={stream}
                        onRemove={removeStream}
                        onToggleMute={toggleMute}
                    />
                ))}
            </div>
        )}
      </div>

      {/* Add Custom Stream Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-lg w-full max-w-md shadow-2xl p-6 relative">
                <button
                    onClick={() => setIsModalOpen(false)}
                    className="absolute top-4 right-4 text-zinc-500 hover:text-white"
                >
                    <XIcon size={20} />
                </button>

                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <LinkIcon size={20} className="text-emerald-500"/> Add Custom Stream
                </h2>

                <form onSubmit={handleAddCustomStream} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">Platform / Room Number</label>
                        <div className="relative">
                            <select
                                value={customTitle}
                                onChange={(e) => setCustomTitle(e.target.value)}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none appearance-none cursor-pointer pointer-events-none"
                            >
                                <option value="" disabled>Only Support HuYa & DouYu</option>
                                {PLATFORMS.map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">Stream URL <span className="text-red-500">*</span></label>
                        <input
                            type="url"
                            required
                            value={customUrl}
                            onChange={(e) => setCustomUrl(e.target.value)}
                            placeholder="https://www.huya.com/153651"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none placeholder-zinc-700"
                        />
                        <p className="text-[10px] text-zinc-500 mt-1">HLS/m3u8 support depends on browser</p>
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 text-sm rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
                        >
                            Add Stream
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}

export default App;