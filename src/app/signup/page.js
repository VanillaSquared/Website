import Button from "@/components/Button";
import Card from "@/components/Card";
import TextInput from "@/components/TextInput";

import { signupWithEmailCode } from "../login/actions";

export default async function SignupPage({ searchParams }) {
  const params = await searchParams;
  const error = params?.error;

  return (
    <main className="flex flex-1 items-center justify-center bg-background px-6 py-20">
      <Card
        preset="auth"
        title="Sign up"
        description="Create an account with a username and email. We’ll verify your email with a login code next."
        error={error}
        footer={(
          <>
            Already have an account? <a href="/login" className="font-semibold text-accent">Login</a>
          </>
        )}
      >
        <form action={signupWithEmailCode} className="flex flex-col gap-4">
          <TextInput
            label="Username"
            name="username"
            autoComplete="username"
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
            required
            sampleText="you@example.com"
          />
          <Button type="submit" className="mt-2 w-full">Create account</Button>
        </form>
      </Card>
    </main>
  );
}
