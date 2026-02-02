
import { Buffer } from 'buffer';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Browser runtime polyfill for libraries that assume Node's Buffer exists.
// (Solana/web3 + some wallet tooling still use Buffer internally.)
if (!(globalThis as any).Buffer) {
  (globalThis as any).Buffer = Buffer;
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
