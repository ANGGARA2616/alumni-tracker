import { cookies } from "next/headers";

export const auth = {
  api: {
    getSession: async ({ headers }: any = { headers: {} }) => {
      const c = await cookies();
      const authCookie = c.get("admin_session")?.value;
      
      if (authCookie === "authenticated") {
        return {
          user: {
            name: "Administrator",
            email: process.env.ADMIN_EMAIL || "admin123@gmail.com",
          },
          session: {
            id: "admin_session_id",
          }
        };
      }
      return null;
    }
  }
};
