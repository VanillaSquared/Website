import { issuer } from "@openauthjs/openauth";
import { CodeProvider } from "@openauthjs/openauth/provider/code";
import { MemoryStorage } from "@openauthjs/openauth/storage/memory";
import { CodeUI } from "@openauthjs/openauth/ui/code";

import { subjects } from "./subjects";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function getUserId(email) {
  const normalizedEmail = email.trim().toLowerCase();
  const bytes = new TextEncoder().encode(normalizedEmail);
  const digest = await crypto.subtle.digest("SHA-256", bytes);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 24);
}

export const authIssuer = issuer({
  subjects,
  storage: MemoryStorage(),
  providers: {
    code: CodeProvider(
      CodeUI({
        copy: {
          email_placeholder: "Email address",
          code_info: "We'll send a login code to your email.",
          code_sent: "Login code sent to ",
          code_resent: "Login code resent to ",
        },
        async sendCode(claims, code) {
          const email = claims.email?.trim().toLowerCase();

          if (!email || !isValidEmail(email)) {
            return { type: "invalid_claim", key: "email", value: claims.email ?? "" };
          }

          // TODO: Wire this to a transactional email provider before production use.
          console.log(`[OpenAuth] Login code for ${email}: ${code}`);
        },
      }),
    ),
  },
  async success(ctx, value) {
    if (value.provider === "code") {
      const email = value.claims.email.trim().toLowerCase();

      return ctx.subject("user", {
        id: await getUserId(email),
        email,
      });
    }

    throw new Error("Invalid auth provider");
  },
});
