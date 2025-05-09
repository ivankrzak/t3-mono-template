import type { TRPCRouterRecord } from "@trpc/server";

import { protectedProcedure } from "../trpc";

export const userRouter = {
  userMe: protectedProcedure.query(({ ctx }) => {
    if (!ctx.user?.id) {
      return null;
    }
    return ctx.db.user.findUnique({ where: { id: ctx.user.id } });
  }),
} satisfies TRPCRouterRecord;
