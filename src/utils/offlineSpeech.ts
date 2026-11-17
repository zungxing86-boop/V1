let worker: Worker | undefined;
let nextId = 0;
const requests = new Map<number, { resolve: (data: Uint8Array) => void; reject: (error: Error) => void }>();

export function synthesizeOffline(text: string, rate: number): Promise<Uint8Array> {
  if (!worker) {
    worker = new Worker(new URL('../workers/speech.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = ({ data }) => {
      const request = requests.get(data.id);
      requests.delete(data.id);
      if (data.error) request?.reject(new Error(data.error));
      else request?.resolve(data.wav);
    };
    worker.onerror = () => {
      requests.forEach(request => request.reject(new Error('Offline speech engine failed')));
      requests.clear();
      worker?.terminate();
      worker = undefined;
    };
  }
  return new Promise((resolve, reject) => {
    const id = ++nextId;
    requests.set(id, { resolve, reject });
    worker!.postMessage({ id, text, rate });
  });
}
