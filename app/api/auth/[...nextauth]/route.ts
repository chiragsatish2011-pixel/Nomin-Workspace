import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * The NextAuth handler. One instance serves both verbs: GET for the
 * session, CSRF and provider endpoints, POST for sign-in and sign-out.
 */
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
