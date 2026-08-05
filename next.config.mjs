import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    cpus: 2,
  },
  outputFileTracingIncludes: {
    "/media/*": ["./cdn/**/*"],
  },
  async redirects() {
    return [
      {
        source: "/modlicence",
        destination: "/license/mod",
        permanent: true,
      },
      {
        source: "/licence",
        destination: "/license/website",
        permanent: true,
      },
    ];
  },
  turbopack: {
    root: __dirname,
  },
  webpack: (config) => {
    config.resolve.alias["@cdn"] = path.join(__dirname, "cdn");

    return config;
  },
};

export default nextConfig;
