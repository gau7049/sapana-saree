import { apiSuccess } from "@/lib/api/response";

export async function GET() {
  return apiSuccess("Service is healthy.", {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
}
