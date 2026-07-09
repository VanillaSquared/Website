import { randomInt, timingSafeEqual } from "crypto";

import { isEmailCodeBypass } from "./emailCodeBypass";

function generateCode(length) {
  return Array.from({ length }, () => randomInt(0, 10)).join("");
}

function safeCompare(value, expected) {
  const valueBuffer = Buffer.from(String(value));
  const expectedBuffer = Buffer.from(String(expected));

  return valueBuffer.length === expectedBuffer.length && timingSafeEqual(valueBuffer, expectedBuffer);
}

export function BypassableCodeProvider(config) {
  const length = config.length || 6;

  return {
    type: "code",
    init(routes, ctx) {
      async function transition(c, next, fd, err) {
        await ctx.set(c, "provider", 60 * 60 * 24, next);
        return ctx.forward(c, await config.request(c.req.raw, next, fd, err));
      }

      routes.get("/authorize", async (c) => transition(c, { type: "start" }));

      routes.post("/authorize", async (c) => {
        const code = generateCode(length);
        const fd = await c.req.formData();
        const state = await ctx.get(c, "provider");
        const action = fd.get("action")?.toString();

        if (action === "request" || action === "resend") {
          const claims = Object.fromEntries(fd);
          delete claims.action;

          const err = await config.sendCode(claims, code);
          if (err) return transition(c, { type: "start" }, fd, err);

          return transition(c, {
            type: "code",
            resend: action === "resend",
            claims,
            code,
          }, fd);
        }

        if (action === "verify" && state?.type === "code") {
          const compare = fd.get("code")?.toString();

          if (!state.code || !compare || (!isEmailCodeBypass(compare) && !safeCompare(state.code, compare))) {
            return transition(c, {
              ...state,
              resend: false,
            }, fd, { type: "invalid_code" });
          }

          await ctx.unset(c, "provider");
          return ctx.forward(c, await ctx.success(c, { claims: state.claims }));
        }
      });
    },
  };
}
