
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// تعريف متغيرات البيئة للاتصال بـ Supabase
const SUPABASE_URL = "https://rydsmftbvymncpndqctg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5ZHNtZnRidnltbmNwbmRxY3RnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwOTg0NjYsImV4cCI6MjA1NzY3NDQ2Nn0.4_hIH5I6k3mgNn_KtlrvQhXi0yFhzhbbwV4j6rX43R0";

// التحقق من وجود كائن window للتأكد من أننا في بيئة المتصفح
const isBrowser = typeof window !== 'undefined';

// إنشاء عميل Supabase وتصديره
export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      // تخزين الجلسة في التخزين المحلي لتحسين الأداء إذا كنا في المتصفح
      storage: isBrowser ? window.localStorage : undefined
    },
    // تمكين التخزين المؤقت للاستعلامات المتكررة
    global: {
      fetch: (url: string, options: RequestInit) => fetch(url, options)
    }
  }
);
