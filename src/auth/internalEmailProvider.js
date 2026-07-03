export function InternalEmailProvider() {
  return {
    type: "internal_email",
    init() {},
    async client({ clientSecret, params }) {
      const expectedSecret = process.env.INTERNAL_AUTH_SECRET ?? (process.env.NODE_ENV === "production" ? "" : "dev-internal-auth-secret");

      if (!expectedSecret) {
        throw new Error("INTERNAL_AUTH_SECRET is required for internal auth token exchange.");
      }

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
