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

  if (!await hasPermission(user, PERMISSIONS.DESIGN_TEST)) {
    redirect(user ? "/403" : "/403?signIn=1&returnTo=/components");
  }

  return (
    <DefaultTemplatePage search={{ placeholder: "Search components..." }}>
      <ComponentPreviewContent />
    </DefaultTemplatePage>
  );
}
