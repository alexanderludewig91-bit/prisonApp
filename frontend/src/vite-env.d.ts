/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  // weitere env vars hier hinzufügen
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
