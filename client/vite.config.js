export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'https://pasyaproject-production.up.railway.app',
        changeOrigin: true,
        rewrite: (path) => path, // jangan ubah path-nya
      }
    }
  }
})