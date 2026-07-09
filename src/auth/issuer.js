import { mkdirSync } from "fs";

import { issuer } from "@openauthjs/openauth";
import { MemoryStorage } from "@openauthjs/openauth/storage/memory";

import { createAuditLog } from "@/audit/logs";

import { BypassableCodeProvider } from "./bypassableCodeProvider";
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

mkdirSync(".data", { recursive: true });

export const authIssuer = issuer({
  subjects,
  storage: MemoryStorage({ persist: ".data/openauth-storage.json" }),
  providers: {
    internal_email: InternalEmailProvider(),
    code: BypassableCodeProvider({
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

      await createAuditLog({
        type: "user_action",
        action: isSignup ? "auth.signup" : "auth.login",
        actorUserId: user.id,
        targetUserId: user.id,
        summary: `${user.username} ${isSignup ? "signed up" : "logged in"}.`,
        afterData: { id: user.id, username: user.username, email: user.email },
      });

      return ctx.subject("user", subjectFromUser(user), { subject: user.id });
    }

    throw new Error("Invalid auth provider");
  },
});
