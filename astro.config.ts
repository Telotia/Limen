import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://telotia.com',
  output: 'static',
  // The multi-page site/ bundle's internal cross-links are written as bare
  // relative filenames (href="process.html"), matching a flat file layout --
  // not Astro's default directory-per-route output (dist/process/index.html).
  build: { format: 'file' },
});
