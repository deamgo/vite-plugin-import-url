import { rollup, type RollupBuild } from "rollup";
import { type Plugin, type ResolvedConfig } from "vite";

let configResolved: ResolvedConfig | undefined;
const entryFiles = new Set<{ code: string; id: string }>();

export default function importUrl(): Plugin {
  return {
    name: "vite-plugin-import-url",
    apply: "build",

    configResolved(config: ResolvedConfig) {
      configResolved = config;
    },

    async transform(code: string, id: string) {
      if (id.endsWith("?url") && configResolved?.command === "build") {
        const regex = /\/([^\/]+)\.tsx?(?=\?|$)/;
        const match = id.match(regex);
        if (match && match[1]) {
          const url = `${configResolved?.base || "/"}${match[1]}.js`;
          const newCode = `const url = '${url}'; export default url;`;
          entryFiles.add({ code, id });
          return {
            code: newCode,
          };
        }
      }
      return null;
    },

    async generateBundle() {
      if (configResolved?.command === "build") {
        const plugins = configResolved?.worker?.plugins;
        entryFiles.forEach(async (file) => {
          const actualPath = file.id.slice(0, -4);
          const bundle: RollupBuild = await rollup({
            input: actualPath,
            plugins: plugins ? await plugins([actualPath]) : [],
            preserveEntrySignatures: "strict",
          });
          await bundle.write({
            dir: "dist",
            format: "esm",
            assetFileNames: "[name].css",
          });
          await bundle.close();
        });
      }
    },
  };
}
