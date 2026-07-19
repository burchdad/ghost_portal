export async function GET() {
  return Response.json({
    ok: true,
    service: "ghost-portal",
    timestamp: new Date().toISOString()
  });
}
