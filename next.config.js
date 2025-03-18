const { withPlugins } = require('next-compose-plugins');
const withOffline = require('next-offline');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  poweredByHeader: false,
  httpAgentOptions: {
    keepAlive: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
  webpack: (config, { dev, isServer }) => {
    // 仅在生产环境中优化构建
    if (!dev && !isServer) {
      // 分割代码块以获得更好的缓存
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          commons: {
            name: 'commons',
            chunks: 'all',
            minChunks: 2,
          },
          react: {
            name: 'commons',
            chunks: 'all',
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          },
        },
      };
      
      // 启用模块连接，以减少模块包装器的数量
      config.optimization.concatenateModules = true;
    }
    
    return config;
  },
  // 禁用PWA功能的实验特性
  experimental: {
    scrollRestoration: true,
    esmExternals: 'loose',
  },
  eslint: {
    // 在生产构建中忽略ESLint错误
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 在生产构建中忽略TypeScript错误
    ignoreBuildErrors: true,
  },
};

// Service Worker配置
const offlineConfig = {
  workboxOpts: {
    swDest: 'static/sw.js',
    runtimeCaching: [
      {
        urlPattern: /^https?.*/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'offlineCache',
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30天
          },
        },
      },
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'images',
          expiration: {
            maxEntries: 60,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30天
          },
        },
      },
      {
        urlPattern: /\.(?:js|css)$/,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'static-resources',
          expiration: {
            maxEntries: 60,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7天
          },
        },
      },
    ],
  },
  // 禁用Vercel相关功能
  dontAutoRegisterSw: true,
  // 在响应状态代码为404或500的响应期间生成离线页面
  generateInDevMode: false,
  // 在没有网络的情况下只使用离线缓存
  generateSw: true,
  // 解析离线页面
  async rewrites() {
    return [
      {
        source: '/vercel/:path*',
        destination: '/404.html',
      },
    ];
  },
};

module.exports = withPlugins([
  [withOffline, offlineConfig],
], nextConfig); 