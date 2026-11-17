declare module 'mespeak' {
  const engine: {
    loadConfig(config: unknown): void;
    loadVoice(voice: unknown): void;
    speak(text: string, options: { speed: number; rawdata: string }): number[];
  };
  export default engine;
}
