import React, { useState, useEffect, useRef } from 'react';
import { StreamSource } from '../types';
import { TrashIcon, Volume2Icon, VolumeXIcon, RefreshCwIcon } from './Icons';
import flvjs from 'flv.js';

interface StreamTileProps {
  stream: StreamSource;
  onRemove: (id: string) => void;
  onToggleMute: (id: string) => void;
}

const StreamTile: React.FC<StreamTileProps> = ({ stream, onRemove, onToggleMute }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const flvPlayerRef = useRef<flvjs.Player | null>(null);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Format time for the overlay (CCTV style)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toISOString().replace('T', ' ').split('.')[0]);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Initialize FLV player
  useEffect(() => {
    if (!videoRef.current) return;

    // Check if URL is FLV format
    const isFlvUrl = stream.url.includes('.flv') ||
                     stream.url.includes('flv') ||
                     stream.url.includes('flvjs');

    if (isFlvUrl && flvjs.isSupported()) {
      if (flvPlayerRef.current) {
        flvPlayerRef.current.destroy();
      }

      try {
        const flvPlayer = flvjs.createPlayer({
          type: 'flv',
          url: stream.url,
          isLive: true
        }, {
          enableWorker: false,
          lazyLoad: true,
          lazyLoadMaxDuration: 3 * 60,
          seekType: 'range',
        });

        flvPlayer.attachMediaElement(videoRef.current);
        flvPlayer.load();
        flvPlayer.play();

        flvPlayer.on(flvjs.Events.LOADING_COMPLETE, () => {
          setIsLoading(false);
          setHasError(false);
        });

        flvPlayer.on(flvjs.Events.ERROR, (error) => {
          console.error('FLV player error:', error);
          setIsLoading(false);
          setHasError(true);
        });

        flvPlayer.on(flvjs.Events.METADATA_ARRIVED, () => {
          setIsLoading(false);
          setHasError(false);
        });

        flvPlayerRef.current = flvPlayer;

      } catch (error) {
        console.error('Failed to create FLV player:', error);
        setIsLoading(false);
        setHasError(true);
      }
    } else {
      // Fallback to native video for non-FLV URLs
      videoRef.current.src = stream.url;
      videoRef.current.load();
    }

    return () => {
      if (flvPlayerRef.current) {
        flvPlayerRef.current.destroy();
        flvPlayerRef.current = null;
      }
    };
  }, [stream.url]);

  // Handle mute state changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = stream.isMuted;
    }
  }, [stream.isMuted]);

  const handleLoadedData = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleRetry = () => {
    setIsLoading(true);
    setHasError(false);

    if (flvPlayerRef.current) {
      flvPlayerRef.current.destroy();
      flvPlayerRef.current = null;
    }

    // Re-initialize the player
    if (videoRef.current) {
      const isFlvUrl = stream.url.includes('.flv') ||
                       stream.url.includes('flv') ||
                       stream.url.includes('flvjs');

      if (isFlvUrl && flvjs.isSupported()) {
        try {
          const flvPlayer = flvjs.createPlayer({
            type: 'flv',
            url: stream.url,
            isLive: true
          }, {
            enableWorker: false,
            lazyLoad: true,
            lazyLoadMaxDuration: 3 * 60,
            seekType: 'range',
          });

          flvPlayer.attachMediaElement(videoRef.current);
          flvPlayer.load();
          flvPlayer.play();

          flvPlayer.on(flvjs.Events.LOADING_COMPLETE, () => {
            setIsLoading(false);
            setHasError(false);
          });

          flvPlayerRef.current = flvPlayer;
        } catch (error) {
          console.error('Failed to recreate FLV player:', error);
          setIsLoading(false);
          setHasError(true);
        }
      } else {
        videoRef.current.load();
      }
    }
  };

  return (
    <div className="relative group w-full h-full bg-black border border-zinc-800 overflow-hidden flex flex-col shadow-lg">
      {/* Video Element */}
      <div className="flex-grow relative bg-zinc-900 w-full h-full">
        {hasError ? (
           <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 space-y-2 z-30">
              <span className="font-mono text-sm tracking-widest">SIGNAL LOST</span>
              <button
                onClick={handleRetry}
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

        {/* Loading State */}
        {isLoading && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10">
             <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        )}

        {/* CCTV Overlay Info */}
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

      {/* Hover Controls */}
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

      {/* Active Border on Focus (optional simulation) */}
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-zinc-600 pointer-events-none transition-colors"></div>
    </div>
  );
};

export default StreamTile;