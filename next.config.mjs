import os from 'os';

function getLocalDevOrigins() {
  const origins = new Set([
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '*.local',
  ]);

  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] || []) {
        if (iface.family === 'IPv4' || iface.family === 4) {
          origins.add(iface.address);
        }
      }
    }
  } catch {
    // Abaikan error pembacaan network interfaces
  }

  return Array.from(origins);
}

const localOrigins = getLocalDevOrigins();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Izinkan akses dev server dan Fast Refresh HMR dari perangkat lain di LAN/Wi-Fi
  allowedDevOrigins: localOrigins,

  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
      allowedOrigins: localOrigins,
    },
  },
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


