"use client";

import { SessionProvider } from "next-auth/react";

/**
 * Client-side context mounted once at the root. Today that is only
 * NextAuth's SessionProvider, which lets client components read the session
 * without a round trip; upload tracking and unread counters will hang off
 * the same place as those sections land.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
