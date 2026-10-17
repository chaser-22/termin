import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The local embedded database ships WASM files; load it from node_modules as-is
  serverExternalPackages: ["@electric-sql/pglite"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
