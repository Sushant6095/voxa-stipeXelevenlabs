'use client';

import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Pause, Play } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { formatDuration } from '@/lib/format';

interface CallAudioPlayerProps {
  url: string;
}

/**
 * Compact wavesurfer-driven audio player for call recordings. Plays /
 * pauses with a single button and shows a draggable waveform timeline.
 */
export default function CallAudioPlayer({ url }: CallAudioPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const waveRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const ws = WaveSurfer.create({
      container: containerRef.current,
      url,
      waveColor: '#94A3B8',
      progressColor: '#6366F1',
      cursorColor: '#EC4899',
      cursorWidth: 2,
      barWidth: 2,
      barGap: 2,
      barRadius: 1,
      height: 44,
      normalize: true,
    });
    waveRef.current = ws;

    const onReady = () => {
      setIsReady(true);
      setDuration(ws.getDuration());
    };
    const onAudioProcess = () => setCurrentTime(ws.getCurrentTime());
    const onFinish = () => setIsPlaying(false);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    ws.on('ready', onReady);
    ws.on('audioprocess', onAudioProcess);
    ws.on('finish', onFinish);
    ws.on('play', onPlay);
    ws.on('pause', onPause);

    return () => {
      ws.destroy();
      waveRef.current = null;
    };
  }, [url]);

  function togglePlay() {
    const ws = waveRef.current;
    if (!ws || !isReady) return;
    ws.playPause();
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="default"
        size="icon"
        onClick={togglePlay}
        disabled={!isReady}
        aria-label={isPlaying ? 'Pause recording' : 'Play recording'}
        className={cn(
          'shrink-0 bg-voxa-primary text-white hover:bg-voxa-primary-dark',
        )}
      >
        {isPlaying ? <Pause /> : <Play />}
      </Button>
      <div className="flex flex-1 flex-col gap-1">
        <div ref={containerRef} className="w-full" />
        <div className="flex items-center justify-between font-mono text-[11px] tabular-nums text-muted-foreground">
          <span>{formatDuration(currentTime)}</span>
          <span>{formatDuration(duration)}</span>
        </div>
      </div>
    </div>
  );
}
