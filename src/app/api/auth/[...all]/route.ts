import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: Request, { params }: { params: Promise<{ all: string[] }> }) {
  const all = (await params).all;
  if (all && all.join('/') === 'signout') {
    const c = await cookies();
    c.delete("admin_session");
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function POST(req: Request, { params }: { params: Promise<{ all: string[] }> }) {
  const all = (await params).all;
  
  if (all && all.join('/') === 'signin') {
    try {
      const body = await req.json();
      const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin123@gmail.com";
      const ADMIN_PASS = process.env.ADMIN_PASSWORD || "admin123";

      if (body.email === ADMIN_EMAIL && body.password === ADMIN_PASS) {
        const c = await cookies();
        c.set("admin_session", "authenticated", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 60 * 24 * 7, // 1 week
          path: "/",
        });
        return NextResponse.json({ success: true });
      } else {
        return NextResponse.json({ error: "Email atau password salah." }, { status: 401 });
      }
    } catch(err) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
  }
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
