import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
//
// NOTA SOBRE PRE-RENDERING (Fase 3):
// vite-plugin-prerender requiere CommonJS y es incompatible con este proyecto
// que usa "type": "module". Las alternativas recomendadas son:
//   1. Migrar a Next.js (SSG/SSR nativo) — mayor impacto SEO
//   2. Usar `vite-ssg` + `vue-router` (para Vue)
//   3. Implementar una Cloud Function / Edge Function que sirva HTML pre-renderizado
//
// Por ahora, la configuración incluye code splitting optimizado y las
// meta tags dinámicas via react-helmet-async (cubriendo ~80% del SEO necesario).

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    // Code splitting optimizado para mejor carga y caché del browser
    rollupOptions: {
      output: {
        // Vite 8 (rolldown) requiere manualChunks como función
        manualChunks(id) {
          if (id.includes('react-helmet-async')) return 'seo';
          if (id.includes('firebase')) return 'firebase';
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-router-dom/')
          ) return 'vendor';
        },
      },
    },
    // Minificación con oxc (por defecto en Vite 8, más rápido que esbuild)
    // minify: true es el valor por defecto
    cssMinify: true,
    // Sin sourcemaps en producción (reduce tamaño del deploy)
    sourcemap: false,
    // Alerta si un chunk supera 600KB
    chunkSizeWarningLimit: 600,
  },
})
