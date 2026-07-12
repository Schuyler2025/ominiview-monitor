import React, { useState, useEffect } from 'react';
import { StreamSource } from '../types';
import { TrashIcon, Volume2Icon, VolumeXIcon, RefreshCwIcon } from './Icons';
import { useFlvPlayer } from '../hooks/useFlvPlayer';

interface StreamTileProps {
  stream: StreamSource;
  onRemove: (id: string) => void;
  onToggleMute: (id: string) => void;
}

const StreamTile: React.FC<StreamTileProps> = ({ stream, onRemove, onToggleMute }) => {
  const [currentTime, setCurrentTime] = useState('');
  const { videoRef, isLoading, hasError, handleLoadedData, handleError, retry } = useFlvPlayer(stream.url);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toISOString().replace('T', ' ').split('.')[0]);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative group w-full h-full bg-black border border-zinc-800 overflow-hidden flex flex-col shadow-lg">
      <div className="flex-grow relative bg-zinc-900 w-full h-full">
        {hasError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 space-y-2 z-30">
            <span className="font-mono text-sm tracking-widest">SIGNAL LOST</span>
            <button
              onClick={retry}
              className="flex items-center gap-2 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs transition-colors z-40"
            >
              <RefreshCwIcon size={14} /> Retry Connection
            </button>
          </div>
        ) : (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted={stream.isMuted}
            onLoadedData={handleLoadedData}
            onError={handleError}
          />
        )}

        {isLoading && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        )}

        <div className="absolute top-2 left-2 text-[10px] font-mono text-green-500 bg-black/60 px-1 rounded opacity-80 pointer-events-none">
          REC • {stream.id.slice(0, 6).toUpperCase()}
        </div>

        <div className="absolute top-2 right-2 text-[10px] font-mono text-zinc-300 bg-black/60 px-1 rounded opacity-80 pointer-events-none">
          {currentTime}
        </div>

        <div className="absolute bottom-2 left-2 text-xs font-bold font-mono text-white drop-shadow-md pointer-events-none">
          {stream.location} <span className="font-normal text-zinc-400">| {stream.title}</span>
        </div>
      </div>

      <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors duration-200 flex items-start justify-end p-2 opacity-0 group-hover:opacity-100 z-20">
        <div className="flex gap-2 bg-zinc-900/80 backdrop-blur p-1 rounded-lg border border-zinc-700/50">
          <button
            onClick={() => onToggleMute(stream.id)}
            className="p-1.5 hover:bg-zinc-700 rounded text-zinc-200 hover:text-white transition-colors"
            title={stream.isMuted ? "Unmute" : "Mute"}
          >
            {stream.isMuted ? <VolumeXIcon size={16} /> : <Volume2Icon size={16} />}
          </button>
          <button
            onClick={() => onRemove(stream.id)}
            className="p-1.5 hover:bg-red-900/50 rounded text-red-400 hover:text-red-200 transition-colors"
            title="Remove Stream"
          >
            <TrashIcon size={16} />
          </button>
        </div>
      </div>

      <div className="absolute inset-0 border-2 border-transparent group-hover:border-zinc-600 pointer-events-none transition-colors"></div>
    </div>
  );
};

export default StreamTile;
