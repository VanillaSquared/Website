import { issuer } from "@openauthjs/openauth";
import { CodeProvider } from "@openauthjs/openauth/provider/code";
import { MemoryStorage } from "@openauthjs/openauth/storage/memory";

import { saveAdminEmailCode } from "./adminCodeBypass";
import { PendingEmailCodeUI } from "./codeUI";
import { InternalEmailProvider } from "./internalEmailProvider";
import {
  normalizeEmail,
  normalizeUsername,
  subjectFromUser,
  validateEmail,
  validateUsername,
  verifyEmailCodeClaim,
} from "./openAuth";
import { createUser, getUserByEmail, getUserByUsername } from "./openSQL";
import { subjects } from "./subjects";

export const PENDING_LOGIN_EMAIL_COOKIE = "pending_login_email";
export const PENDING_SIGNUP_USERNAME_COOKIE = "pending_signup_username";

export const authIssuer = issuer({
  subjects,
  storage: MemoryStorage(),
  providers: {
    internal_email: InternalEmailProvider(),
    code: CodeProvider({
      ...PendingEmailCodeUI({
        cookieName: PENDING_LOGIN_EMAIL_COOKIE,
        usernameCookieName: PENDING_SIGNUP_USERNAME_COOKIE,
      }),
      async sendCode(claims, code) {
        const email = normalizeEmail(claims.email);
        const username = normalizeUsername(claims.username);
        const isSignup = Boolean(username);

        if (!email || !validateEmail(email) || !verifyEmailCodeClaim(email, claims.email_signature, username)) {
          return { type: "invalid_claim", key: "email", value: claims.email ?? "" };
        }

        if (isSignup) {
          if (!validateUsername(username) || await getUserByUsername(username) || await getUserByEmail(email)) {
            return { type: "invalid_claim", key: "email", value: claims.email ?? "" };
          }
        } else if (!await getUserByEmail(email)) {
          return { type: "invalid_claim", key: "email", value: claims.email ?? "" };
        }

        saveAdminEmailCode(email, code);

        // TODO: Wire this to a transactional email provider before production use.
        console.log(`[OpenAuth] Login code for ${email}: ${code}`);
      },
    }),
  },
  async success(ctx, value) {
    if (value.provider === "code" || value.provider === "internal_email") {
      const email = normalizeEmail(value.claims.email);
      const username = normalizeUsername(value.claims.username);
      const isSignup = Boolean(username);
      const user = isSignup
        ? await createUser({ id: crypto.randomUUID(), username, email })
        : await getUserByEmail(email);

      if (!user) {
        throw new Error("No user profile exists for this email address.");
      }

      return ctx.subject("user", subjectFromUser(user), { subject: user.id });
    }

    throw new Error("Invalid auth provider");
  },
});
