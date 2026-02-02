import { Buffer } from 'buffer';

// Ensure Node globals exist before any other modules execute.
// Some Solana + wallet tooling references Buffer at module init time.
if (!(globalThis as any).Buffer) {
  (globalThis as any).Buffer = Buffer;
}

