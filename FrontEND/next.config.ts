import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.230.134", "localhost", "127.0.0.1"],

  output: "export",
};

export default nextConfig;
