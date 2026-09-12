import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Em produção o app é servido sob https://isabellanunes.dev/focus/ (subpath),
// então os assets precisam de base absoluta "/focus/" (base relativa quebra em
// rotas com mais de um nível). Em dev continua na raiz.
export default defineConfig(({ mode }) => ({
  base: mode === "production" ? "/focus/" : "/",
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api": { target: "http://localhost:3001", changeOrigin: true },
    },
  },
}));
