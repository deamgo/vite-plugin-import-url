import { defineConfig } from "vite";
import importChunkUrl from "vite-plugin-import-url";

/**
 * Vite Config
 */
export default defineConfig(() => {
  return {
    plugins: [importChunkUrl()],
    build: {
      minify: false,
    },
  };
});
