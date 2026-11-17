// Dual-mode speech & synced word-highlighter engine:
// 1. Tries cached or server-side Gemini TTS (/api/tts) when online for studio-quality pronunciation
// 2. Seamlessly falls back to browser Web Speech API (speechSynthesis) + word-by-word timer for 100% offline TV operation

const ttsCache = new Map<string, string>(); // key -> data URL

export interface SpeakOptions {
  text: string;
  rate?: number;
  preferOnlineTTS?: boolean;
  onWordIndex?: (wordIndex: number) => void;
  onEnd?: () => void;
  onError?: (msg: string) => void;
}

let activeAudioEl: HTMLAudioElement | null = null;
let activeTimerIds: number[] = [];

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  if (activeAudioEl) {
    activeAudioEl.pause();
    activeAudioEl.currentTime = 0;
    activeAudioEl = null;
  }
  activeTimerIds.forEach((id) => window.clearTimeout(id));
  activeTimerIds = [];
}

function scheduleFallbackWordHighlight(
  words: string[],
  rate: number,
  totalDurationMs: number | null,
  onWordIndex?: (idx: number) => void,
  onEnd?: () => void
): void {
  if (!words.length) {
    onEnd?.();
    return;
  }
  const avgMsPerWord = totalDurationMs
    ? Math.max(180, totalDurationMs / words.length)
    : Math.round(410 / Math.max(0.5, rate));

  words.forEach((word, idx) => {
    const t = window.setTimeout(() => {
      onWordIndex?.(idx);
    }, idx * avgMsPerWord);
    activeTimerIds.push(t);
    // Slightly stretch pause after punctuation
    void word;
  });

  if (!totalDurationMs) {
    const endTimer = window.setTimeout(() => {
      onWordIndex?.(-1);
      onEnd?.();
    }, words.length * avgMsPerWord + 250);
    activeTimerIds.push(endTimer);
  }
}

export async function speakEnglish({
  text,
  rate = 0.9,
  preferOnlineTTS = true,
  onWordIndex,
  onEnd,
}: SpeakOptions): Promise<'gemini-tts' | 'webspeech' | 'visual-sync'> {
  stopSpeaking();
  const cleanText = text.trim();
  if (!cleanText) {
    onEnd?.();
    return 'visual-sync';
  }

  const words = cleanText.split(/\s+/);
  const cacheKey = `${cleanText}::${rate}`;

  // 1. Check in-memory TTS cache or online Gemini TTS when online
  if (preferOnlineTTS && typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      let dataUrl = ttsCache.get(cacheKey);
      if (!dataUrl) {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: cleanText,
            style:
              rate < 0.85
                ? 'Clear, slow, articulated English teacher for 8th-grade students'
                : 'Warm, natural English teacher speaking clearly for 8th-grade students',
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.audioBase64) {
            dataUrl = `data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`;
            ttsCache.set(cacheKey, dataUrl);
          }
        }
      }

      if (dataUrl) {
        const audio = new Audio(dataUrl);
        audio.playbackRate = rate < 0.85 ? 0.88 : 1.0;
        activeAudioEl = audio;

        await new Promise<void>((resolve, reject) => {
          audio.onloadedmetadata = () => {
            const durMs = Number.isFinite(audio.duration) ? (audio.duration * 1000) / audio.playbackRate : null;
            scheduleFallbackWordHighlight(words, rate, durMs, onWordIndex);
          };
          audio.onended = () => {
            onWordIndex?.(-1);
            onEnd?.();
            resolve();
          };
          audio.onerror = () => reject(new Error('Audio playback error'));
          audio.play().catch(reject);
        });
        return 'gemini-tts';
      }
    } catch {
      // Fall through seamlessly to offline Web Speech API
    }
  }

  // 2. Offline Web Speech API fallback
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'en-US';
    utterance.rate = rate;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const enVoice =
      voices.find((v) => v.lang.startsWith('en-US')) ||
      voices.find((v) => v.lang.startsWith('en-GB')) ||
      voices.find((v) => v.lang.startsWith('en'));
    if (enVoice) utterance.voice = enVoice;

    let boundaryFired = false;
    utterance.onboundary = (event) => {
      if (event.name === 'word' || typeof event.charIndex === 'number') {
        boundaryFired = true;
        const prefix = cleanText.slice(0, event.charIndex);
        const wordIdx = prefix.trim() ? prefix.trim().split(/\s+/).length : 0;
        onWordIndex?.(Math.min(words.length - 1, wordIdx));
      }
    };

    // Start fallback timer in case WebView / Android TV TTS doesn't emit onboundary
    const boundaryCheckTimer = window.setTimeout(() => {
      if (!boundaryFired) {
        scheduleFallbackWordHighlight(words, rate, null, onWordIndex);
      }
    }, 180);
    activeTimerIds.push(boundaryCheckTimer);

    utterance.onend = () => {
      stopSpeaking();
      onWordIndex?.(-1);
      onEnd?.();
    };
    utterance.onerror = () => {
      stopSpeaking();
      onWordIndex?.(-1);
      onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
    return 'webspeech';
  }

  // 3. Visual-only timed karaoke fallback if TTS is completely unavailable
  scheduleFallbackWordHighlight(words, rate, null, onWordIndex, onEnd);
  return 'visual-sync';
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
