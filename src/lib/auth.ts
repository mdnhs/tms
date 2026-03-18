import { betterAuth } from 'better-auth';
import { sendEmail } from './mailer';
import { getGlobalSupabase } from './supabase';
import { genId } from './get-shop';

// Singleton pool — reused across requests in the same serverless instance
let _pool: any = null;

function getDatabaseConfig() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }
  if (!_pool) {
    const { Pool } = require('pg');
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return _pool;
}

export const auth = betterAuth({
  database: getDatabaseConfig(),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: 'পাসওয়ার্ড রিসেট করুন / Reset Your Password',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
            <h2 style="color:#333">পাসওয়ার্ড রিসেট / Password Reset</h2>
            <p>নিচের লিংকে ক্লিক করে আপনার পাসওয়ার্ড রিসেট করুন:</p>
            <p>Click the link below to reset your password:</p>
            <a href="${url}" style="display:inline-block;margin:16px 0;padding:12px 24px;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">
              Reset Password
            </a>
            <p style="color:#888;font-size:12px">এই লিংকটি ১ ঘণ্টার জন্য বৈধ। / This link expires in 1 hour.</p>
            <p style="color:#888;font-size:12px">যদি আপনি এই অনুরোধ না করেন, এই ইমেইলটি উপেক্ষা করুন।<br>If you didn't request this, ignore this email.</p>
          </div>
        `,
      });
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          const supabase = getGlobalSupabase();
          if (!supabase) return;
          const shopId = genId();
          await supabase.from('shops').insert({
            id: shopId,
            owner_id: user.id,
            name: 'My Shop',
            created_at: new Date().toISOString(),
          });
        },
      },
    },
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  trustedOrigins: [
    process.env.BETTER_AUTH_URL || 'http://localhost:3000',
    'http://localhost:3001',
  ],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
