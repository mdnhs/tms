import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';
export { runtime, preferredRegion } from '@/lib/vercel-runtime';

export const { GET, POST } = toNextJsHandler(auth);
