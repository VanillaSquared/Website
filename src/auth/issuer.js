import { issuer } from "@openauthjs/openauth";
import { CodeProvider } from "@openauthjs/openauth/provider/code";
import { MemoryStorage } from "@openauthjs/openauth/storage/memory";

import { PendingEmailCodeUI } from "./codeUI";
import { normalizeEmail, subjectFromUser, validateEmail, verifyEmailCodeClaim } from "./openAuth";
import { getUserByEmail } from "./openSQL";
import { subjects } from "./subjects";

export const PENDING_LOGIN_EMAIL_COOKIE = "pending_login_email";

export const authIssuer = issuer({
  subjects,
  storage: MemoryStorage(),
  providers: {
    code: CodeProvider({
      ...PendingEmailCodeUI({ cookieName: PENDING_LOGIN_EMAIL_COOKIE }),
      async sendCode(claims, code) {
        const email = normalizeEmail(claims.email);
        const user = email ? await getUserByEmail(email) : null;

        if (!email || !validateEmail(email) || !verifyEmailCodeClaim(email, claims.email_signature) || !user) {
          return { type: "invalid_claim", key: "email", value: claims.email ?? "" };
        }

        // TODO: Wire this to a transactional email provider before production use.
        console.log(`[OpenAuth] Login code for ${email}: ${code}`);
      },
    }),
  },
  async success(ctx, value) {
    if (value.provider === "code") {
      const email = normalizeEmail(value.claims.email);
      const user = await getUserByEmail(email);

      if (!user) {
        throw new Error("No user profile exists for this email address.");
      }

      return ctx.subject("user", subjectFromUser(user), { subject: user.id });
    }

    throw new Error("Invalid auth provider");
  },
});
