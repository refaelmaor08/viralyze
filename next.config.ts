import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '500mb',
    },
  },
  // Ensure the ffmpeg-static binary is included in the Vercel output bundle
  // for the extract-frames route (Output File Tracing does not auto-detect it).
  outputFileTracingIncludes: {
    '/api/extract-frames': ['./node_modules/ffmpeg-static/**/*'],
  },
};

export default nextConfig;
