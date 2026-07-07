import { redirect } from "next/navigation";

import { getAuthSubject } from "@/app/auth";
import { PERMISSIONS, hasPermission } from "@/auth/permissions";
import ComponentPreviewContent from "@/components/ComponentPreviewContent";
import DefaultTemplatePage from "@/template-pages/DefaultTemplatePage";

export const metadata = {
  title: "Component Preview - Vanilla²",
};

export default async function ComponentPreviewPage() {
  const subject = await getAuthSubject({ updateTokens: false });
  const user = subject ? subject.properties : null;

  if (!user) {
    redirect("/login?returnTo=/components");
  }

  if (!await hasPermission(user, PERMISSIONS.DESIGN_TEST)) {
    redirect("/404");
  }

  return (
    <DefaultTemplatePage search={{ placeholder: "Search components..." }}>
      <ComponentPreviewContent />
    </DefaultTemplatePage>
  );
}
