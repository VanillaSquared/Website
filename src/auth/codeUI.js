import { getAdminEmailCode } from "./adminCodeBypass";
import { signEmailCodeClaim } from "./openAuth";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function scriptString(value) {
  return JSON.stringify(String(value ?? "")).replaceAll("<", "\\u003c");
}

function getCookie(request, name) {
  const cookies = request.headers.get("cookie") ?? "";
  const match = cookies
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.slice(name.length + 1)) : "";
}

function page({ title, body }) {
  return new Response(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    :root { color-scheme: dark; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #171717; color: #ededed; font-family: system-ui, sans-serif; }
    main { width: min(100% - 32px, 420px); padding: 32px; border: 1px solid #262626; border-radius: 16px; background: #1e1e1e; }
    h1 { margin: 0; font-size: 30px; }
    p { color: #9ca3af; line-height: 1.5; }
    form { display: grid; gap: 16px; margin-top: 24px; }
    input { border: 1px solid #343434; border-radius: 8px; background: #202020; color: #fff; padding: 12px; font-size: 16px; }
    button, a { border: 2px solid #c781c7; border-radius: 12px; background: #bd72bd; color: #fff; padding: 10px 16px; font-weight: 700; text-align: center; text-decoration: none; cursor: pointer; }
    .secondary { border-color: #48546a; background: #3b4658; }
    .error { border-radius: 8px; background: #3b1f28; color: #fca5a5; padding: 12px; }
  </style>
</head>
<body><main>${body}</main></body>
</html>`, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export function PendingEmailCodeUI({ cookieName, usernameCookieName }) {
  return {
    async request(request, state, form, error) {
      const email = getCookie(request, cookieName);
      const username = usernameCookieName ? getCookie(request, usernameCookieName) : "";
      const emailSignature = signEmailCodeClaim(email, username);
      const errorHtml = error
        ? `<p class="error">${error.type === "invalid_code" ? "The code is incorrect." : "Could not send a code for this email."}</p>`
        : "";

      if (!email) {
        return page({
          title: "Email verification",
          body: `<h1>Email verification</h1><p class="error">Your login request expired. Please go back and try again.</p><a href="/login">Back to login</a>`,
        });
      }

      if (state.type === "code") {
        const adminCode = getAdminEmailCode(state.claims.email);
        const adminAutoSubmit = adminCode
          ? `<script>const form = document.getElementById("verify-code-form"); form.code.value = ${scriptString(adminCode)}; form.requestSubmit();</script>`
          : "";

        return page({
          title: "Enter login code",
          body: `<h1>Check your email</h1><p>Enter the login code sent to <strong>${escapeHtml(state.claims.email)}</strong>.</p>${errorHtml}<form id="verify-code-form" method="post"><input type="hidden" name="action" value="verify" /><input name="code" inputmode="numeric" autocomplete="one-time-code" required autofocus /><button>Verify code</button></form><form method="post"><input type="hidden" name="action" value="resend" /><input type="hidden" name="email" value="${escapeHtml(state.claims.email)}" /><input type="hidden" name="username" value="${escapeHtml(state.claims.username)}" /><input type="hidden" name="email_signature" value="${escapeHtml(state.claims.email_signature)}" /><button class="secondary">Resend code</button></form>${adminAutoSubmit}`,
        });
      }

      const requestForm = `<form id="send-code-form" method="post"><input type="hidden" name="action" value="request" /><input type="hidden" name="email" value="${escapeHtml(email)}" /><input type="hidden" name="username" value="${escapeHtml(username)}" /><input type="hidden" name="email_signature" value="${escapeHtml(emailSignature)}" /><button autofocus>Send code</button></form>`;

      if (error) {
        return page({
          title: "Send login code",
          body: `<h1>Email verification</h1><p>We couldn't send a login code to <strong>${escapeHtml(email)}</strong>.</p>${errorHtml}${requestForm}`,
        });
      }

      return page({
        title: "Sending login code",
        body: `<h1>Sending login code</h1><p>We're sending a login code to <strong>${escapeHtml(email)}</strong>.</p>${requestForm}<script>document.getElementById("send-code-form").requestSubmit();</script>`,
      });
    },
  };
}
