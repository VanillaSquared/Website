import ErrorTemplatePage from "@/template-pages/ErrorTemplatePage";

export const metadata = {
  title: "404 - Vanilla²",
};

export default function Custom404Page() {
  return (
    <ErrorTemplatePage
      code="404"
      title="Page not found"
      description="The page you are looking for does not exist or has been moved."
    />
  );
}
