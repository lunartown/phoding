import type { NextConfig } from "next";

// ENV에서 게이트웨이 URL의 호스트를 추출하여 개발 기원(allowed origins)으로 사용
const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || "";
let gatewayHost: string | undefined;
try {
  if (gatewayUrl) {
    const u = new URL(gatewayUrl);
    gatewayHost = u.host;
  }
} catch {}

const nextConfig: NextConfig = {
  reactStrictMode: false,
  devIndicators: {
    buildActivity: false,
    buildActivityPosition: 'bottom-right',
  },
  // 개발 편의를 위한 허용 오리진(Next 자체 설정에 직접 영향은 없으나, 내부 사용 시 ENV 기반으로 유지)
  allowedDevOrigins: gatewayHost ? [gatewayHost, `https://${gatewayHost}`] : [],
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  async rewrites() {
    return [
      {
        source: '/favicon.ico',
        destination: '/favicon.svg',
      },
    ];
  },
};

export default nextConfig;
