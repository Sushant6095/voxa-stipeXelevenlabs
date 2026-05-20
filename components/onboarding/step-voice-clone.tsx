'use client';

import { Loader2, Mic, Square } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { NumberTicker } from '@/components/ui/number-ticker';
import { cn } from '@/lib/utils';

/**
 * Step 3 — Voice clone.
 *
 * - MediaRecorder captures up to 60 seconds of mic input.
 * - A `<canvas>` driven by AnalyserNode FFT renders a live amplitude bar
 *   waveform so the user has tactile feedback while recording.
 * - On stop (manual or 60s timeout) we hand the resulting Blob to
 *   `onComplete` and switch into a non-recordable "submitting" state.
 * - `onSkip` is the escape hatch — the EL agent will use the template's
 *   default voice and the user can re-record from settings later.
 *
 * No wavesurfer.js import here. Wavesurfer is excellent for playback but
 * heavier than this Web Audio canvas for a live mic preview, and adding it
 * would pull more bytes than needed for the onboarding step.
 */
interface StepVoiceCloneProps {
  readonly onComplete: (blob: Blob) => Promise<void>;
  readonly onSkip: () => void;
}

const MAX_RECORDING_MS = 60_000;
const RECOMMENDED_MIN_MS = 30_000;

type RecorderState = 'idle' | 'recording' | 'submitting' | 'error';

export function StepVoiceClone({ onComplete, onSkip }: StepVoiceCloneProps) {
  const [state, setState] = useState<RecorderState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(60);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const stoppedManuallyRef = useRef(false);
  const recordingStartRef = useRef<number>(0);
  const countdownIdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---------- Visualisation ----------------------------------------------

  const stopVisualLoop = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  const drawAmplitude = useCallback(() => {
    const analyser = analyserRef.current;
    const canvas = canvasRef.current;
    if (!analyser || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * dpr)) canvas.width = Math.round(w * dpr);
    if (canvas.height !== Math.round(h * dpr))
      canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const bufferLength = analyser.frequencyBinCount;
    const data = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(data);

    ctx.clearRect(0, 0, w, h);

    const bars = 48;
    const gap = 3;
    const barWidth = (w - gap * (bars - 1)) / bars;
    const midY = h / 2;

    // Gradient: indigo → pink.
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, '#6366F1');
    grad.addColorStop(1, '#EC4899');
    ctx.fillStyle = grad;

    for (let i = 0; i < bars; i += 1) {
      const sliceStart = Math.floor((i / bars) * bufferLength);
      const sliceEnd = Math.floor(((i + 1) / bars) * bufferLength);
      let sum = 0;
      for (let j = sliceStart; j < sliceEnd; j += 1) sum += data[j] ?? 0;
      const avg = sum / Math.max(1, sliceEnd - sliceStart);
      const norm = avg / 255;
      const barHeight = Math.max(2, norm * (h * 0.85));
      const x = i * (barWidth + gap);
      ctx.fillRect(x, midY - barHeight / 2, barWidth, barHeight);
    }

    rafIdRef.current = requestAnimationFrame(drawAmplitude);
  }, []);

  // ---------- Cleanup ----------------------------------------------------

  const teardownAudio = useCallback(() => {
    stopVisualLoop();
    if (countdownIdRef.current !== null) {
      clearInterval(countdownIdRef.current);
      countdownIdRef.current = null;
    }
    if (autoStopIdRef.current !== null) {
      clearTimeout(autoStopIdRef.current);
      autoStopIdRef.current = null;
    }
    if (audioStreamRef.current) {
      for (const track of audioStreamRef.current.getTracks()) track.stop();
      audioStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current
        .close()
        .catch(() => undefined);
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  }, [stopVisualLoop]);

  useEffect(() => {
    return () => {
      teardownAudio();
    };
  }, [teardownAudio]);

  // ---------- Recording lifecycle ---------------------------------------

  const handleStop = useCallback(async () => {
    if (state !== 'recording') return;
    stoppedManuallyRef.current = true;
    mediaRecorderRef.current?.stop();
  }, [state]);

  const startRecording = useCallback(async () => {
    setErrorMsg(null);
    stoppedManuallyRef.current = false;
    recordedChunksRef.current = [];

    if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
      setErrorMsg('Microphone not available in this browser.');
      setState('error');
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setErrorMsg(
        'We need microphone access to clone your voice. Allow it in your browser and try again.',
      );
      setState('error');
      return;
    }
    audioStreamRef.current = stream;

    // Pick a MIME the browser supports; default to webm/opus.
    const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find(
      (candidate) =>
        typeof MediaRecorder !== 'undefined' &&
        MediaRecorder.isTypeSupported(candidate),
    );

    const recorder = new MediaRecorder(
      stream,
      mime ? { mimeType: mime } : undefined,
    );
    mediaRecorderRef.current = recorder;

    recorder.addEventListener('dataavailable', (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    });

    recorder.addEventListener('stop', () => {
      const blob = new Blob(recordedChunksRef.current, {
        type: mime ?? 'audio/webm',
      });
      teardownAudio();

      const elapsed = Date.now() - recordingStartRef.current;
      if (elapsed < 3_000) {
        // Too short for IVC to be useful.
        setErrorMsg(
          'That was too short — record at least a few seconds, ideally 30+.',
        );
        setState('error');
        return;
      }

      setState('submitting');
      onComplete(blob)
        .catch(() => {
          // Parent toasts. We just reset so the user can retry.
          setState('error');
          setErrorMsg('Voice clone failed. Try again or skip for now.');
        });
    });

    // Wire visualisation graph.
    try {
      const audioCtx = new (window.AudioContext ||
        (
          window as unknown as { webkitAudioContext: typeof AudioContext }
        ).webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.78;
      source.connect(analyser);
      analyserRef.current = analyser;
      rafIdRef.current = requestAnimationFrame(drawAmplitude);
    } catch {
      // Visual fails open — we still record audio.
    }

    recordingStartRef.current = Date.now();
    setSecondsLeft(60);
    countdownIdRef.current = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.ceil((MAX_RECORDING_MS - (Date.now() - recordingStartRef.current)) / 1000),
      );
      setSecondsLeft(remaining);
    }, 250);

    autoStopIdRef.current = setTimeout(() => {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    }, MAX_RECORDING_MS);

    recorder.start();
    setState('recording');
  }, [drawAmplitude, onComplete, teardownAudio]);

  // ---------- Render -----------------------------------------------------

  const isRecording = state === 'recording';
  const isSubmitting = state === 'submitting';
  const isBusy = isRecording || isSubmitting;

  return (
    <section
      aria-labelledby="voice-clone-heading"
      className="flex flex-col items-center text-center"
    >
      <header className="max-w-md">
        <h1
          id="voice-clone-heading"
          className="font-display text-2xl tracking-tight text-slate-950 sm:text-3xl dark:text-slate-50"
        >
          Clone your voice
        </h1>
        <p className="mt-2 text-sm text-slate-600 sm:text-base dark:text-slate-400">
          Read a short paragraph for 30 to 60 seconds. Your AI receptionist
          will sound exactly like you.
        </p>
      </header>

      {/* Suggested script */}
      <div
        className="mt-8 max-w-md rounded-xl border border-slate-200/70 bg-white/70 px-5 py-4 text-left text-sm leading-relaxed text-slate-700 backdrop-blur-sm dark:border-slate-800/60 dark:bg-slate-900/40 dark:text-slate-200"
        aria-label="Suggested script"
      >
        <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
          Read this aloud
        </span>
        <p className="mt-2">
          Hello, this is the receptionist at our business. We&apos;re open six
          days a week and happy to take your call. Please share your name, the
          service you need, and a time that works for you. I&apos;ll confirm
          your booking on WhatsApp within a minute.
        </p>
      </div>

      {/* Live waveform canvas */}
      <div className="mt-8 w-full max-w-md">
        <div
          className={cn(
            'relative h-28 w-full overflow-hidden rounded-2xl border bg-white/60 backdrop-blur-sm dark:bg-slate-950/40',
            isRecording
              ? 'border-[#6366F1]/60 shadow-[0_0_0_3px_rgba(99,102,241,0.12)]'
              : 'border-slate-200/70 dark:border-slate-800/60',
          )}
        >
          <canvas
            ref={canvasRef}
            aria-hidden="true"
            className="block h-full w-full"
          />
          {!isRecording && !isSubmitting ? (
            <p className="pointer-events-none absolute inset-0 flex items-center justify-center font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
              {state === 'error'
                ? 'Try again when ready'
                : 'Hit record to begin'}
            </p>
          ) : null}
        </div>

        {/* Countdown */}
        <div className="mt-3 flex items-center justify-between font-mono text-xs text-slate-500 dark:text-slate-400">
          <span>
            {isRecording ? 'Recording…' : isSubmitting ? 'Cloning…' : 'Ready'}
          </span>
          <span aria-live="polite" aria-atomic="true">
            {isRecording ? (
              <span className="tabular-nums">
                {/* Force remount so NumberTicker doesn't animate stale spring state */}
                <NumberTicker
                  key={`countdown-${recordingStartRef.current}`}
                  startValue={60}
                  value={secondsLeft}
                  direction="down"
                  className="font-mono text-xs text-slate-700 dark:text-slate-200"
                />
                s left
              </span>
            ) : (
              <span>60s max</span>
            )}
          </span>
        </div>
      </div>

      {/* Record / Stop button */}
      <div className="mt-8">
        <motion.button
          type="button"
          onClick={isRecording ? handleStop : startRecording}
          disabled={isSubmitting}
          aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          whileTap={{ scale: 0.95 }}
          className={cn(
            'relative grid size-20 place-items-center rounded-full text-white shadow-xl transition-all',
            'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6366F1]/40',
            isSubmitting && 'opacity-60',
            isRecording
              ? 'bg-[#EF4444]'
              : 'bg-gradient-to-br from-[#6366F1] to-[#EC4899]',
          )}
        >
          {isSubmitting ? (
            <Loader2 className="h-7 w-7 animate-spin" aria-hidden="true" />
          ) : isRecording ? (
            <Square className="h-6 w-6" fill="currentColor" aria-hidden="true" />
          ) : (
            <Mic className="h-7 w-7" aria-hidden="true" />
          )}

          {/* Pulse ring — only while recording */}
          {isRecording ? (
            <motion.span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-full ring-4 ring-[#EF4444]/40"
              animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0, 0.6] }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                ease: 'easeOut',
              }}
            />
          ) : null}
        </motion.button>
      </div>

      <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
        {isRecording
          ? 'Tap to stop'
          : `Aim for at least ${RECOMMENDED_MIN_MS / 1000} seconds`}
      </p>

      {errorMsg ? (
        <p role="alert" className="mt-4 max-w-md text-sm text-destructive">
          {errorMsg}
        </p>
      ) : null}

      <button
        type="button"
        onClick={onSkip}
        disabled={isBusy}
        className={cn(
          'mt-8 text-sm font-medium text-slate-500 underline-offset-4 transition hover:text-slate-700 hover:underline dark:text-slate-400 dark:hover:text-slate-200',
          isBusy && 'pointer-events-none opacity-40',
        )}
      >
        Skip and use default voice
      </button>
    </section>
  );
}
