import { synthesizeOffline } from './offlineSpeech';

export interface SpeakOptions {
  text: string;
  rate?: number;
  preferOnlineTTS?: boolean;
  onWordIndex?: (index: number) => void;
  onEnd?: () => void;
  onError?: (message: string) => void;
}
let context: AudioContext | undefined;
let source: AudioBufferSourceNode | undefined;
let generation = 0;
let timers: number[] = [];
let finish: (() => void) | undefined;

export function stopSpeaking(): void {
  generation++;
  source?.stop();
  source = undefined;
  timers.forEach(clearTimeout);
  timers = [];
  finish?.();
  finish = undefined;
}

// English voice and synthesis engine ship inside the APK. No network or system TTS.
export async function speakEnglish({ text, rate = 0.9, onWordIndex, onEnd, onError }: SpeakOptions): Promise<'offline'> {
  stopSpeaking();
  const current = generation;
  const clean = text.trim();
  if (!clean) { onEnd?.(); return 'offline'; }
  try {
    context ??= new AudioContext();
    // Unlock audio during the remote-control click, before synthesis completes.
    await context.resume();
    const wav = await synthesizeOffline(clean, Math.max(0.5, Math.min(1.5, rate)));
    if (current !== generation) return 'offline';
    const buffer = await context.decodeAudioData(wav.slice().buffer as ArrayBuffer);
    if (current !== generation) return 'offline';
    source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    const words = clean.split(/\s+/);
    await new Promise<void>((resolve) => {
      finish = resolve;
      source!.onended = () => {
        if (current === generation) {
          timers.forEach(clearTimeout); timers = [];
          onWordIndex?.(-1); onEnd?.(); finish = undefined;
        }
        resolve();
      };
      words.forEach((_, i) => timers.push(window.setTimeout(() => {
        if (current === generation) onWordIndex?.(i);
      }, i * buffer.duration * 1000 / words.length)));
      source!.start();
    });
  } catch (error) {
    if (current === generation) {
      onWordIndex?.(-1);
      onError?.(String(error));
      onEnd?.();
      window.dispatchEvent(new CustomEvent('speech-error'));
    }
  }
  return 'offline';
}

export function playFeedbackTone(type: 'correct' | 'wrong', enabled = true): void {
  if (!enabled || typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'correct') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.26);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(210, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.07, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc.start();
      osc.stop(ctx.currentTime + 0.24);
    }
  } catch {
    // Ignore audio context block
  }
}
