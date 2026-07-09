import ErrorTemplatePage from "@/template-pages/ErrorTemplatePage";

export default function NotFoundPage() {
  return (
    <ErrorTemplatePage
      code="404"
      title="Page not found"
      description="The page you are looking for does not exist or has been moved."
    />
  );
}
