import { handleOpenAuth } from "@/auth/handler";

export const runtime = "nodejs";
export const GET = handleOpenAuth;
export const POST = handleOpenAuth;
