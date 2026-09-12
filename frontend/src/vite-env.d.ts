/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Base da API. Em dev usa o default "/api" (proxy do Vite);
  // em produção é injetada como "/focus/api" no build.
  readonly VITE_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
