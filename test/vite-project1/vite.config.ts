import { defineConfig } from "vite";
import vitePluginImportUrl from "vite-plugin-import-url";

export default defineConfig({
  plugins: [vitePluginImportUrl()],
});
