import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import vercel from "@astrojs/vercel";
import { defineConfig } from "astro/config";
import { transform } from "esbuild";

const rootDirectory = path.dirname(fileURLToPath(import.meta.url));
const cdnDirectory = path.join(rootDirectory, "cdn");
const clientDirectory = path.join(rootDirectory, "dist", "client");

function staticCdnPlugin() {
  return {
    name: "vanillasquared-static-cdn",
    configureServer(server) {
      server.middlewares.use("/cdn", (request, response, next) => {
        const requestPath = decodeURIComponent(request.url?.split("?")[0] ?? "");
        const absolutePath = path.resolve(cdnDirectory, `.${requestPath}`);
        if (!absolutePath.startsWith(`${cdnDirectory}${path.sep}`) || !fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
          next();
          return;
        }

        fs.createReadStream(absolutePath).pipe(response);
      });
    },
    writeBundle() {
      fs.cpSync(cdnDirectory, path.join(clientDirectory, "cdn"), { recursive: true });
    },
  };
}

function jsxJavaScriptPlugin() {
  return {
    name: "vanillasquared-jsx-javascript",
    enforce: "pre",
    async transform(code, id) {
      if (!id.includes(`${path.sep}src${path.sep}`) || !id.endsWith(".js")) return undefined;

      const result = await transform(code, {
        loader: "jsx",
        jsx: "automatic",
        sourcefile: id,
        sourcemap: true,
      });
      return { code: result.code, map: result.map };
    },
  };
}

export default defineConfig({
  output: "server",
  adapter: vercel(),
  integrations: [react()],
  redirects: {
    "/modlicence": "/license/mod",
    "/licence": "/license/website",
  },
  vite: {
    plugins: [jsxJavaScriptPlugin(), tailwindcss(), staticCdnPlugin()],
    optimizeDeps: {
      rolldownOptions: {
        moduleTypes: { ".js": "jsx" },
      },
    },
    resolve: {
      alias: {
        "@": path.join(rootDirectory, "src"),
        "@cdn": path.join(rootDirectory, "cdn"),
      },
    },
  },
});
