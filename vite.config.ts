
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// تكوين Vite مع تحسينات الأداء
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react({
      // تمكين تحسينات أداء SWC
      jsxImportSource: undefined,
      plugins: [],
      tsDecorators: false,
    }),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // تحسين الحزمة النهائية
  build: {
    // تمكين تقسيم الحزم للتحميل الأسرع
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // تقسيم المكتبات الكبيرة إلى ملفات منفصلة
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': [
            '@radix-ui/react-avatar',
            '@radix-ui/react-dialog',
            '@radix-ui/react-tabs',
            '@radix-ui/react-label',
          ],
          'supabase-vendor': ['@supabase/supabase-js'],
        },
      },
    },
  },
  // تحسين التطوير
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@supabase/supabase-js'],
  },
}));
