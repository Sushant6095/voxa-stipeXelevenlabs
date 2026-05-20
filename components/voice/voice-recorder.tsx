'use client';

import { Mic, RotateCcw, Square } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { NumberTicker } from '@/components/ui/number-ticker';
import { PulsatingButton } from '@/components/ui/pulsating-button';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { cloneVoiceAction } from '@/app/(app)/voice/actions';
import { cn } from '@/lib/utils';

const MAX_DURATION_SECONDS = 60;
const BAR_COUNT = 32;

interface VoiceRecorderProps {
  onCloneComplete?: (voiceId: string) => void;
}

type Phase = 'idle' | 'recording' | 'review' | 'uploading';

/**
 * Live mic-amplitude bars driven by the WebAudio AnalyserNode.
 * Lighter and more reliable than wavesurfer's record plugin while still
 * giving the "alive" visual that sells the demo.
 */
function useAnalyserBars(
  stream: MediaStream | null,
  active: boolean,
): number[] {
  const [bars, setBars] = useState<number[]>(() => Array(BAR_COUNT).fill(0));
  useEffect(() => {
    if (!active || !stream) {
      setBars(Array(BAR_COUNT).fill(0));
      return;
    }
    const audioCtx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 64;
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);

    let rafId = 0;
    const tick = () => {
      analyser.getByteFrequencyData(data);
      const next: number[] = Array(BAR_COUNT).fill(0);
      const step = Math.max(1, Math.floor(data.length / BAR_COUNT));
      for (let i = 0; i < BAR_COUNT; i++) {
        next[i] = (data[i * step] ?? 0) / 255;
      }
      setBars(next);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      source.disconnect();
      audioCtx.close().catch(() => undefined);
    };
  }, [stream, active]);
  return bars;
}

export function VoiceRecorder({ onCloneComplete }: VoiceRecorderProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isUploading, startUpload] = useTransition();

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  const bars = useAnalyserBars(stream, phase === 'recording');

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
  }, [stream]);

  const tickElapsed = useCallback(() => {
    setElapsed((prev) => {
      const next = prev + 1;
      if (next >= MAX_DURATION_SECONDS) {
        stopRecording();
        return MAX_DURATION_SECONDS;
      }
      return next;
    });
  }, [stopRecording]);

  const startRecording = useCallback(async () => {
    setBlob(null);
    setPreviewUrl(null);
    setElapsed(0);
    chunksRef.current = [];
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStream(s);
      const mr = new MediaRecorder(s);
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const out = new Blob(chunksRef.current, { type: 'audio/webm' });
        setBlob(out);
        setPreviewUrl(URL.createObjectURL(out));
        setPhase('review');
      };
      recorderRef.current = mr;
      mr.start();
      setPhase('recording');
      timerRef.current = window.setInterval(tickElapsed, 1000);
    } catch (err) {
      console.error(err);
      toast.error('Microphone access denied', {
        description: 'Allow mic permissions and try again.',
      });
    }
  }, [tickElapsed]);

  const onReRecord = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setBlob(null);
    setPreviewUrl(null);
    setElapsed(0);
    setPhase('idle');
  };

  const onSubmit = () => {
    if (!blob) return;
    setPhase('uploading');
    startUpload(async () => {
      const form = new FormData();
      form.append('audio', blob, 'voxa-clone.webm');
      const result = await cloneVoiceAction(form);
      if (result.ok && result.voiceId) {
        toast.success('Voice cloned', { description: result.voiceId });
        onCloneComplete?.(result.voiceId);
        onReRecord();
      } else {
        toast.error(result.error ?? 'Voice clone failed');
        setPhase('review');
      }
    });
  };

  return (
    <div className="flex flex-col items-center gap-6 rounded-2xl border border-border/60 bg-card p-8">
      {/* Bars */}
      <div className="flex h-14 w-full max-w-md items-end gap-1 rounded-lg bg-muted/30 px-3 py-2">
        {bars.map((v, i) => (
          <span
            key={i}
            className={cn(
              'flex-1 rounded-full bg-gradient-to-t from-primary to-accent-voxa transition-[height] duration-75',
            )}
            style={{
              height: `${Math.max(4, v * 100)}%`,
              opacity: phase === 'recording' ? 1 : 0.3,
            }}
          />
        ))}
      </div>

      {phase !== 'review' && phase !== 'uploading' && (
        <>
          {phase === 'idle' ? (
            <PulsatingButton
              onClick={startRecording}
              pulseColor="#EC4899"
              className="bg-pink-600 text-white"
            >
              <span className="flex items-center gap-2">
                <Mic aria-hidden className="size-4" />
                Tap to record
              </span>
            </PulsatingButton>
          ) : (
            <Button
              onClick={stopRecording}
              size="lg"
              variant="destructive"
              className="rounded-full"
            >
              <Square aria-hidden className="mr-2 size-4" /> Stop
            </Button>
          )}
          <p className="font-mono text-3xl tabular-nums">
            <NumberTicker value={MAX_DURATION_SECONDS - elapsed} />
            <span className="text-base text-muted-foreground"> s</span>
          </p>
        </>
      )}

      {phase === 'review' && previewUrl && (
        <>
          <audio src={previewUrl} controls className="w-full max-w-md" />
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button variant="outline" onClick={onReRecord} disabled={isUploading}>
              <RotateCcw aria-hidden className="mr-2 size-4" /> Re-record
            </Button>
            <ShimmerButton
              onClick={onSubmit}
              disabled={isUploading}
              background="#10B981"
              shimmerColor="#ffffff"
            >
              <span className="text-sm font-medium text-white">Sounds good</span>
            </ShimmerButton>
          </div>
        </>
      )}

      {phase === 'uploading' && (
        <p className="text-sm text-muted-foreground">
          Uploading and cloning your voice…
        </p>
      )}
    </div>
  );
}
