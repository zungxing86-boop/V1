import meSpeak from 'mespeak';
import config from 'mespeak/src/mespeak_config.json';
import voice from 'mespeak/voices/en/en-us.json';

meSpeak.loadConfig(config);
meSpeak.loadVoice(voice);
self.onmessage = ({ data }) => {
  try {
    const wav = new Uint8Array(meSpeak.speak(data.text, {
      speed: Math.round(175 * data.rate), rawdata: 'array',
    }));
    self.postMessage({ id: data.id, wav }, { transfer: [wav.buffer] });
  } catch (error) {
    self.postMessage({ id: data.id, error: String(error) });
  }
};
