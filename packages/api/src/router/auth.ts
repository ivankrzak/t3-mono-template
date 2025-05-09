import type { TRPCRouterRecord } from "@trpc/server";
import { cookies } from "next/headers";
import { z } from "zod";

import { getFirebaseAdminAuth } from "../lib/firebase/firebaseAdmin";
import { protectedProcedure, publicProcedure } from "../trpc";

export const authRouter = {
  login: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      const { token } = input;
      const firebaseAdmin = getFirebaseAdminAuth();
      const decodedToken = await firebaseAdmin.verifyIdToken(token);

      if (decodedToken) {
        //Generate session cookie
        const expiresIn = 60 * 60 * 24 * 5 * 1000;
        const sessionCookie = await firebaseAdmin.createSessionCookie(token, {
          expiresIn,
        });
        console.log("sessionCookie", sessionCookie);
        const options = {
          name: "session",
          value: sessionCookie,
          maxAge: expiresIn,
          httpOnly: true,
          secure: false,
        };

        //Add the cookie to the browser , NEEDED FOR RSC
        const test = (await cookies()).set(options);
        console.log("test", test);
      }
    }),
  signUp: publicProcedure
    .input(
      z.object({
        firebaseUid: z.string(),
        name: z.string().optional(),
        image: z.string().optional(),
        email: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const createdUser = ctx.db.user.create({ data: input });
      return createdUser;
    }),
  signOut: protectedProcedure.mutation(async () => {
    const options = {
      name: "session",
      value: "",
      maxAge: 0,
      httpOnly: true,
      secure: false,
    };

    //Add the cookie to the browser , NEEDED FOR RSC
    const test = (await cookies()).set(options);
    console.log("test", test);
    // await invalidateSessionToken(opts.ctx.token);
    return { success: true };
  }),
} satisfies TRPCRouterRecord;
