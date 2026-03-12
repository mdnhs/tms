/**
 * Database abstraction layer — Supabase only.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { getGlobalSupabase } from './supabase';

/**
 * Returns the global Supabase client.
 * shopId parameter kept for API compatibility but config is always from env vars.
 */
export function getCloudDb(_shopId?: string): SupabaseClient {
  const client = getGlobalSupabase();
  if (!client) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
  }
  return client;
}
