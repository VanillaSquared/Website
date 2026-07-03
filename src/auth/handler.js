import { authIssuer } from "./issuer";

export const runtime = "nodejs";

export function handleOpenAuth(request) {
  return authIssuer.fetch(request);
}
