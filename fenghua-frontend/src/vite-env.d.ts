/// <reference types="vite/client" />

/**
 * Vite Environment Variables Type Definitions
 * All custom code is proprietary and not open source.
 */

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_BACKEND_URL?: string;
  readonly VITE_BACKEND_API_URL?: string;
  readonly MODE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly SSR: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
