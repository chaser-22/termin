import { redirect } from "next/navigation";
import { consumeLoginToken } from "@/lib/server/auth";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const ok = token ? await consumeLoginToken(token) : false;
  redirect(ok ? "/dashboard" : "/login?error=1");
}
