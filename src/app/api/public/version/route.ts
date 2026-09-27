// Public on purpose (the proxy skips /api/public): the installed app polls this
// while possibly logged out, and it exposes nothing but an opaque deploy id.
export const dynamic = "force-dynamic";

export function GET() {
  const version = process.env.VERCEL_DEPLOYMENT_ID ?? process.env.VERCEL_GIT_COMMIT_SHA ?? null;
  return Response.json({ version }, { headers: { "Cache-Control": "no-store" } });
}
