import { defineConfig } from 'astro/config';
export default defineConfig({
  site: 'https://sidharthkris.github.io',
  build: { inlineStylesheets: 'auto' },
  compressHTML: true,
});
