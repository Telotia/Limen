/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  readonly LIMEN_ENV?: 'dev' | 'prod';
  readonly PUBLIC_TURNSTILE_SITE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
