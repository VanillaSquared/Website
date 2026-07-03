import Button from "@/components/Button";

import { signupWithEmailCode } from "../login/actions";

export default async function SignupPage({ searchParams }) {
  const params = await searchParams;
  const error = params?.error;

  return (
    <main className="flex flex-1 items-center justify-center bg-background px-6 py-20">
      <section className="w-full max-w-md rounded-2xl border border-divider bg-card p-8">
        <h1 className="text-3xl font-bold text-heading">Sign up</h1>
        <p className="mt-2 text-sm text-muted">
          Create an account with a username and email. We’ll verify your email with a login code next.
        </p>

        {error ? <p className="mt-4 rounded-lg bg-error-surface px-4 py-3 text-sm text-error">{error}</p> : null}

        <form action={signupWithEmailCode} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm font-semibold text-soft">
            Username
            <input
              name="username"
              autoComplete="username"
              required
              minLength={3}
              maxLength={32}
              className="rounded-lg border border-input-border bg-input px-3 py-2 text-heading outline-none focus:border-accent"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold text-soft">
            Email
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              className="rounded-lg border border-input-border bg-input px-3 py-2 text-heading outline-none focus:border-accent"
            />
          </label>
          <Button type="submit" className="mt-2 w-full">Create account</Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account? <a href="/login" className="font-semibold text-accent">Login</a>
        </p>
      </section>
    </main>
  );
}
