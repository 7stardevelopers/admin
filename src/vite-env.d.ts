/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// three.js ships without bundled .d.ts in this version — declare as any so
// the Vite/TypeScript build accepts our raw three imports.
declare module 'three';
