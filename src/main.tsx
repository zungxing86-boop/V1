import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

if (import.meta.env.VITE_NATIVE_APP !== '1') {
  registerSW({ immediate: true });
}

createRoot(document.getElementById('root')!).render(<App />);
