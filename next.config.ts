import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig = {
  port: process.env.PORT || 3001,
}

module.exports = nextConfig

export default nextConfig;
