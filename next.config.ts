import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Handle Remotion dependencies
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
      crypto: false,
      stream: false,
      util: false,
      buffer: false,
      assert: false,
      http: false,
      https: false,
      url: false,
      zlib: false,
      net: false,
      tty: false,
      child_process: false,
    };

    // Ignore problematic files
    config.module.rules.push({
      test: /\.md$/,
      use: 'ignore-loader',
    });

    return config;
  },
};

export default nextConfig;
