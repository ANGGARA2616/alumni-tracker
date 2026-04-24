import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { alumni } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limitParam = parseInt(searchParams.get("limit") || "250", 10);
    const limit = isNaN(limitParam) ? 250 : limitParam;

    // Ambil ID alumni yang status pelacakannya "Belum Dilacak"
    const untrackedAlumni = await db
      .select({ id: alumni.id })
      .from(alumni)
      .where(eq(alumni.status_pelacakan, "Belum Dilacak"))
      .limit(limit);

    const ids = untrackedAlumni.map((a) => a.id);

    return NextResponse.json({ success: true, count: ids.length, ids });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
