const { defineConfig } = require("vite");
const path = require("node:path");

module.exports = defineConfig({
  root: __dirname,
  base: "/games/esekus/",
  build: {
    outDir: path.join(__dirname, "dist"),
    emptyOutDir: true,
    assetsDir: "assets",
    sourcemap: false,
    target: "es2020",
    rollupOptions: { output: { manualChunks: { three: ["three"] } } }
  }
});
