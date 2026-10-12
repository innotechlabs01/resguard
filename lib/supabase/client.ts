import { createBrowserClient } from '@supabase/ssr';

export const createClient = () => {
  // Placeholder fallbacks keep build-time prerendering from throwing when
  // env vars are absent (e.g. pristine checkout without .env.local).
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
  return createBrowserClient(url, key);
};

// Lazily instantiated so that importing this module at build time
// (page-data collection) does not throw when env vars are absent.
let cached: ReturnType<typeof createBrowserClient> | null = null;

export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient>, {
  get(_target, prop) {
    if (!cached) cached = createClient();
    const value = Reflect.get(cached as object, prop);
    return typeof value === 'function' ? value.bind(cached) : value;
  },
});
