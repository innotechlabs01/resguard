import { createBrowserClient } from '@supabase/ssr';

// Window-scoped singleton. @supabase/ssr caches its browser client in a
// module-level variable, but Next.js code-splits client modules per route
// bundle, so importing this file from different routes can instantiate
// several GoTrueClient instances. They all share the same storage key and
// therefore the same `lock:sb-<ref>-auth-token` navigator lock, which races
// into "was released because another request stole it". Keeping one instance
// on globalThis guarantees a single GoTrueClient per browser tab.
declare global {
  // eslint-disable-next-line no-var
  var __resguardSupabase: unknown;
}

export const createClient = () => {
  // Placeholder fallbacks keep build-time prerendering from throwing when
  // env vars are absent (e.g. pristine checkout without .env.local).
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  const make = () => createBrowserClient(url, key);

  // Server / prerender: no shared window, plain client is fine.
  if (typeof window === 'undefined') return make();

  if (!globalThis.__resguardSupabase) {
    globalThis.__resguardSupabase = make();
  }
  return globalThis.__resguardSupabase as ReturnType<typeof make>;
};

// Lazily instantiated so that importing this module at build time
// (page-data collection) does not throw when env vars are absent.
let cached: ReturnType<typeof createClient> | null = null;

export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    if (!cached) cached = createClient();
    const value = Reflect.get(cached as object, prop);
    return typeof value === 'function' ? value.bind(cached) : value;
  },
});
