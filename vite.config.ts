import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default ({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  return defineConfig({
    plugins: [vue()],
    server: {
      port: Number(process.env.VITE_BASE_PORT),
    },
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    },
    esbuild: {
      keepNames: true,
    },
  });
};
