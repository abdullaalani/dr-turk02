import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: false,
  serverExternalPackages: ["better-sqlite3", "@prisma/client", ".prisma/client"],
};

export default nextConfig;
