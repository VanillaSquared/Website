import Button from "@/components/Button";
import Card from "@/components/Card";

import { resendEmailCode, verifyEmailCode } from "../actions";

export default async function LoginCodePage({ searchParams }) {
  const params = await searchParams;
  const email = params?.email ?? "your email";
  const error = params?.error;
  const message = params?.message;

  return (
    <main className="flex flex-1 items-center justify-center bg-background px-6 py-20">
      <Card
        preset="auth"
        title="Check your email"
        description={`Enter the login code sent to ${email}. In development, type admin to skip the code.`}
        error={error}
      >
        {message ? <p className="rounded-lg border border-input-border bg-input px-3 py-2 text-sm text-soft">{message}</p> : null}
        <form action={verifyEmailCode} className="flex flex-col gap-4" data-1p-ignore="true">
          <label className="flex flex-col gap-2 text-sm font-semibold text-soft">
            Login code
            <input
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              data-1p-ignore="true"
              required
              autoFocus
              className="rounded-lg border border-input-border bg-input px-3 py-2 text-heading outline-none transition-colors placeholder:text-input-sample placeholder:italic hover:border-input-border-hover hover:bg-input-hover focus:border-input-border-focus focus:bg-input-focus"
              placeholder="123456"
            />
          </label>
          <Button type="submit" className="mt-2 w-full">Verify code</Button>
        </form>
        <form action={resendEmailCode} className="mt-4 text-center" data-1p-ignore="true">
          <button
            type="submit"
            className="bg-transparent p-0 text-sm font-semibold text-accent underline-offset-4 transition-colors hover:text-soft hover:underline"
          >
            Resend code
          </button>
        </form>
      </Card>
    </main>
  );
}
