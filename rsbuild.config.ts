import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

// Docs: https://rsbuild.rs/config/
export default defineConfig({
  plugins: [pluginReact()],
  source: {
    define: {
      'import.meta.env.VITE_FEISHU_APP_ID': JSON.stringify(
        process.env.VITE_FEISHU_APP_ID || ''
      ),
    },
  },
});
