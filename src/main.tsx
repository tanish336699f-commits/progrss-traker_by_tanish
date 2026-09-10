import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const rootEl = document.getElementById('root')!;

try {
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  rootEl.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:system-ui;padding:2rem;">
      <div style="max-width:500px;text-align:center;">
        <h1 style="font-size:1.25rem;margin-bottom:0.5rem;color:#dc2626;">Failed to load</h1>
        <p style="color:#6b7280;font-size:0.875rem;">${msg}</p>
        <button onclick="location.reload()" style="margin-top:1rem;padding:0.5rem 1rem;background:#2563eb;color:white;border:none;border-radius:0.5rem;cursor:pointer;">Reload</button>
      </div>
    </div>
  `;
}
