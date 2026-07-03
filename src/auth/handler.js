import { authIssuer } from "./issuer";

export const runtime = "nodejs";

export async function handleOpenAuth(request) {
  try {
    return await authIssuer.fetch(request);
  } catch (error) {
    if (error?.message?.includes("browser was in an unknown state")) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("error", "Your login session expired. Please try again.");
      return Response.redirect(loginUrl, 302);
    }

    throw error;
  }
}
