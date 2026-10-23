/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  readonly LIMEN_ENV?: 'dev' | 'prod';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
