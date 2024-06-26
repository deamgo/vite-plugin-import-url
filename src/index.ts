import { type Plugin, type ResolvedConfig } from "vite";
import { rollup, type RollupBuild } from "rollup";
import { existsSync } from "fs";
import path, { extname } from "path";
import { readFile } from "node:fs/promises";
import postcss from "rollup-plugin-postcss";

export default function viteImportUrl(): Plugin {
  let configResolved: ResolvedConfig;
  const supportFileType = [".js", ".ts", ".tsx", ".jsx"];
  const entryFiles = new Set<{
    code: string;
    id: string | undefined;
    type: "virtual" | "url";
  }>();

  function urlImportRegex(str: string) {
    return new RegExp(str + `['"] *(?:with) *{ *type: *['"]url['"]`);
  }

  const virtualModules = new Map<string, string>();
  return {
    name: "vite-plugin-import-url",
    enforce: "pre",
    configResolved(config: ResolvedConfig) {
      configResolved = config;
    },
    async resolveId(source, importer, options) {
      if (importer && existsSync(importer)) {
        let modId;
        const ext = extname(importer);
        if (supportFileType.includes(ext)) {
          const resolvedId = (await this.resolve(source, importer, options))
            ?.id;
          if (!resolvedId || !existsSync(resolvedId)) {
            return;
          }
          const importerContent = await readFile(importer!, {
            encoding: "utf8",
          });

          const regexp = urlImportRegex(source);
          if (regexp.test(importerContent)) {
            modId = "\0virtual:" + source + ext;
            virtualModules.set(modId, resolvedId);
          }
        }
        return modId;
      }
    },
    async load(id: string) {
      const resolvedId = Array.from(virtualModules.entries()).find(
        ([key, value]) => value === id
      )?.[0];
      if (virtualModules.has(id) || resolvedId) {
        const realId = virtualModules.get(resolvedId || id)!;
        this.addWatchFile(realId);
        let createCode = "";
        const relativePath = path.relative(configResolved.root, realId);
        createCode = `const url = '${relativePath}'; export default url;`;
        return createCode;
      }
    },
    async transform(code: string, id: string) {
      const ext = extname(id);
      const resolvedId = Array.from(virtualModules.entries()).find(
        ([key, value]) => value === id
      )?.[0];

      if (
        (id.includes("\0virtual:") && supportFileType.includes(ext)) ||
        id.endsWith("?url") ||
        resolvedId
      ) {
        let newId = resolvedId || id;
        let newCode = code;
        if (configResolved?.command === "build") {
          const regex = /\/([^\/]+)\.tsx?(?=\?|$)/;
          const match = newId.match(regex);

          if (match && match[1]) {
            const url = `${configResolved?.base || "/"}${match[1]}.js`;
            if (newId.includes("virtual")) {
              const realId = virtualModules.get(newId);
              newCode = `const url = '${url}'; export default url;`;
              entryFiles.add({ code, id: realId, type: "virtual" });
            } else {
              newCode = `const url = '${url}'; export default url;`;
              entryFiles.add({ code, id, type: "url" });
            }
          }
        }

        if (configResolved.command === "serve") {
          newCode = code;
        }

        return {
          code: newCode,
        };
      }
    },

    async generateBundle() {
      if (configResolved?.command === "build") {
        const plugins = configResolved?.worker?.plugins;
        const outputDir = configResolved.build.outDir || "dist";

        entryFiles.forEach(async (file) => {
          let actualPath;
          switch (file.type) {
            case "url":
              actualPath = file.id?.slice(0, -4);
              break;
            case "virtual":
              actualPath = file.id;
          }
          if (!actualPath) {
            return;
          }
          const noNeedVitePlugins = ["vite:css", "vite:css-post"];
          const vitePlugins = (await plugins([])).filter(
            (i) => !noNeedVitePlugins.includes(i.name)
          );
          const bundle: RollupBuild = await rollup({
            input: actualPath,
            plugins: [
              // @ts-ignore
              postcss({
                inject: true,
                extract: false,
              }),
              vitePlugins,
            ],
            preserveEntrySignatures: "strict",
          });
          await bundle.generate({
            format: "esm",
          });

          bundle.write({
            dir: outputDir,
            format: "esm",
          });
          await bundle.close();
        });
      }
    },
  };
}
