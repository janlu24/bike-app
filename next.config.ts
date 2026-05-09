import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
  async redirects() {
    return [
      {
        source: "/garage/templates",
        destination: "/garage/groups",
        permanent: true,
      },
      {
        source: "/garage/templates/new",
        destination: "/garage/groups/new",
        permanent: true,
      },
      {
        source: "/garage/templates/:id/edit",
        destination: "/garage/groups/:id/edit",
        permanent: true,
      },
      {
        source: "/garage/templates/:id/compare",
        destination: "/garage/groups/:id/compare",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;