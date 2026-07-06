import { getInternalAuthSecret } from "@/auth/internalAuthGuard";

export function InternalEmailProvider() {
  return {
    type: "internal_email",
    init() {},
    async client({ clientSecret, params }) {
      const expectedSecret = getInternalAuthSecret();

      if (clientSecret !== expectedSecret) {
        throw new Error("Invalid internal auth secret.");
      }

      return {
        claims: {
          email: params.email,
          username: params.username ?? "",
        },
      };
    },
  };
}
