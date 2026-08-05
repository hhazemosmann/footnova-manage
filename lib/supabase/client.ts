'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/database.types';

/* Browser Supabase client. Both values are public by design — the anon key is
 * sent to every visitor and is protected by Row Level Security, not secrecy.
 * The service_role key must never appear here. */

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function supabase() {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error(
        'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
          'Copy .env.local.example to .env.local and fill in the anon key.'
      );
    }
    client = createBrowserClient<Database>(url, key);
  }
  return client;
}

export const CV_BUCKET = 'candidate-cvs';
