# vite-plugin-import-url

Small Vite plugin, this plugin can be used during build, right? Package the URL or with the imported file and return the correct path

## Install

#### npm

```
npm i vite-plugin-import-url --save-dev
```

#### pnpm

```
pnpm add -D vite-plugin-import-url
```

## Enable

```typescript
import { defineConfig } from "vite";
import { viteImportUrl } from "vite-plugin-import-url";

export default defineConfig({
  plugins: [viteImportUrl()],
});
```

## Usage

New correct syntax.

```typescript
import url from './test.ts' with { type: 'url' };
```

Also works with the previous assert syntax.

```typescript
import url from "./test.ts?url";
```

<!-- TODO After completing the unit test, supplement the dynamic diagram to confirm whether the product is correct -->

<br><br>
