import { headers } from "next/headers";

import { sanitizeReturnTo } from "@/app/auth";
import Button from "@/components/Button";
import Card from "@/components/Card";
import TextInput from "@/components/TextInput";

import { loginWithEmailCode } from "./actions";

export default async function LoginPage({ searchParams }) {
  const params = await searchParams;
  const headerStore = await headers();
  const error = params?.error;
  const referer = headerStore.get("referer");
  const refererPath = referer ? new URL(referer).pathname + new URL(referer).search : "/";
  const returnTo = sanitizeReturnTo(params?.returnTo ?? refererPath);

  return (
    <main className="flex flex-1 items-center justify-center bg-background px-6 py-20">
      <Card
        preset="auth"
        title="Login"
        description="Enter the username and email for the same account. We’ll send you a login code next."
        error={error}
        footer={(
          <>
            Need an account? <a href={`/signup?returnTo=${encodeURIComponent(returnTo)}`} className="font-semibold text-accent">Sign up</a>
          </>
        )}
      >
        <form action={loginWithEmailCode} className="flex flex-col gap-4">
          <input type="hidden" name="returnTo" value={returnTo} />
          <TextInput
            label="Username"
            name="username"
            autoComplete="username"
            required
            minLength={3}
            maxLength={32}
            sampleText="Your username"
          />
          <TextInput
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            required
            sampleText="you@example.com"
          />
          <Button type="submit" className="mt-2 w-full">Login</Button>
        </form>
      </Card>
    </main>
  );
}
