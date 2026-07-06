import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "sqlite" }),
  emailAndPassword: { enabled: true },
  session: {
    expiresIn: 60 * 60 * 24, // 1 day
    updateAge: 60 * 60 * 24, // no rolling renewal — hard expiry
  },
});
