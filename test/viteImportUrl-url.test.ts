import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { build, ViteDevServer, createServer } from "vite";
import { resolve } from "path";
import fs from "fs/promises";
import viteImportUrl from "../src";

describe("viteImportUrl plugin", () => {
  let server: ViteDevServer;
  const root = resolve(__dirname, "../test/vite-project1");
  const distDir = resolve(root, "dist");

  beforeAll(async () => {
    server = await createServer({
      root,
      plugins: [viteImportUrl()],
    });
    await server.listen();
  });

  afterAll(async () => {
    if (server) {
      await server.close();
    }
  });

  it("should build and generate correct output", async () => {
    await fs.rm(distDir, { recursive: true, force: true });
    await build({
      root,
      plugins: [viteImportUrl()],
      build: {
        outDir: distDir,
        target: "ESNext",
        minify: false,
        rollupOptions: {
          output: {
            entryFileNames: "[name].js",
            chunkFileNames: "[name].js",
          },
        },
      },
    });
    // Unit testing, as a separate build process was started, there is no need to wait in actual use
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Check the contents of the dist directory
    const files = await fs.readdir(distDir);
    // Verify if there are any additional packaging files in the packaging folder
    expect(files.includes("test.js")).toBeTruthy();
    const indexJsContent = await fs.readFile(
      resolve(distDir, "index.js"),
      "utf-8"
    );
    // Verify if there is a path
    expect(indexJsContent.includes("/test.js")).toBeTruthy();
  });
});
