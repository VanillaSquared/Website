import ErrorTemplatePage from "@/template-pages/ErrorTemplatePage";

export const metadata = {
  title: "Forbidden | Vanilla²",
};

export default async function ForbiddenPage({ searchParams }) {
  const params = await searchParams;
  const signIn = params?.signIn === "1";
  const returnTo = typeof params?.returnTo === "string" ? params.returnTo : "/";

  return (
    <ErrorTemplatePage
      code="403"
      title={signIn ? "Sign in required" : "Permission denied"}
      description={signIn ? "Sign in to continue to this page." : "You do not have permission to use this page."}
      actionHref={signIn ? `/login?returnTo=${encodeURIComponent(returnTo)}` : "/"}
      actionLabel={signIn ? "Sign in" : "Return home"}
    />
  );
}
