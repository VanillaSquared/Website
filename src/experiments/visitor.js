import "server-only";

import { cookies, headers } from "next/headers";

import { VISITOR_ID_COOKIE, VISITOR_ID_HEADER, isValidVisitorId } from "@/experiments/visitorIdentity";

export async function getVisitorId() {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(VISITOR_ID_COOKIE)?.value;
  if (isValidVisitorId(cookieValue)) return cookieValue;

  const headerValue = (await headers()).get(VISITOR_ID_HEADER);
  return isValidVisitorId(headerValue) ? headerValue : null;
}
