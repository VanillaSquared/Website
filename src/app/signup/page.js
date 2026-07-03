import { headers } from "next/headers";

import { sanitizeReturnTo } from "@/app/auth";
import Button from "@/components/Button";
import Card from "@/components/Card";
import TextInput from "@/components/TextInput";

import { signupWithEmailCode } from "../login/actions";

export default async function SignupPage({ searchParams }) {
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
        title="Sign up"
        description="Create an account with a username and email. We’ll verify your email with a login code next."
        error={error}
        footer={(
          <>
            Already have an account? <a href={`/login?returnTo=${encodeURIComponent(returnTo)}`} className="font-semibold text-accent">Login</a>
          </>
        )}
      >
        <form action={signupWithEmailCode} className="flex flex-col gap-4">
          <input type="hidden" name="returnTo" value={returnTo} />
          <TextInput
            label="Username"
            name="username"
            autoComplete="username"
            allowBrowserExtensions
            required
            minLength={3}
            maxLength={32}
            sampleText="Choose a username"
          />
          <TextInput
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            allowBrowserExtensions
            required
            sampleText="you@example.com"
          />
          <Button type="submit" className="mt-2 w-full">Create account</Button>
        </form>
      </Card>
    </main>
  );
}
