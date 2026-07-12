import { useEffect, useRef, useState, useCallback } from 'react';
import flvjs from 'flv.js';

function isFlvUrl(url: string): boolean {
  return url.includes('.flv') || url.includes('flvjs');
}

export function useFlvPlayer(url: string) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const flvPlayerRef = useRef<flvjs.Player | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const destroyPlayer = useCallback(() => {
    if (flvPlayerRef.current) {
      flvPlayerRef.current.destroy();
      flvPlayerRef.current = null;
    }
  }, []);

  const initPlayer = useCallback(() => {
    if (!videoRef.current) return;

    destroyPlayer();

    if (isFlvUrl(url) && flvjs.isSupported()) {
      try {
        const player = flvjs.createPlayer(
          { type: 'flv', url, isLive: true },
          { enableWorker: false, lazyLoad: true, lazyLoadMaxDuration: 3 * 60, seekType: 'range' }
        );

        player.attachMediaElement(videoRef.current);
        player.load();
        player.play();

        player.on(flvjs.Events.LOADING_COMPLETE, () => {
          setIsLoading(false);
          setHasError(false);
        });

        player.on(flvjs.Events.ERROR, (error) => {
          console.error('FLV player error:', error);
          setIsLoading(false);
          setHasError(true);
        });

        player.on(flvjs.Events.METADATA_ARRIVED, () => {
          setIsLoading(false);
          setHasError(false);
        });

        flvPlayerRef.current = player;
      } catch (error) {
        console.error('Failed to create FLV player:', error);
        setIsLoading(false);
        setHasError(true);
      }
    } else {
      videoRef.current.src = url;
      videoRef.current.load();
    }
  }, [url, destroyPlayer]);

  useEffect(() => {
    initPlayer();
    return destroyPlayer;
  }, [initPlayer, destroyPlayer]);

  const handleLoadedData = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
  }, []);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  const retry = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
    initPlayer();
  }, [initPlayer]);

  return { videoRef, isLoading, hasError, handleLoadedData, handleError, retry };
}
