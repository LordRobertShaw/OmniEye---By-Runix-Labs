import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Google Maps Demo Key Quota & Auth Failure Defense
declare global {
  interface Window {
    gm_authFailure?: () => void;
  }
}

if (typeof window !== 'undefined') {
  const notifyQuotaExceeded = () => {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  };

  window.gm_authFailure = () => {
    notifyQuotaExceeded();
  };

  const originalConsoleError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    const joined = args.map((a) => (typeof a === 'string' ? a : String(a))).join(' ');
    if (
      joined.includes('OverQuotaMapError') ||
      joined.includes('QuotaExceededError') ||
      joined.includes('RefererNotAllowedMapError')
    ) {
      notifyQuotaExceeded();
    }
    originalConsoleError(...args);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
