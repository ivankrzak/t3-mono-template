import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";

import { protectedProcedure, publicProcedure } from "../trpc";

const MockPostsData = [
  {
    id: 1,
    title: "Title 1",
    content: "Content",
    createdAt: "323232",
    updatedAt: "323232",
  },
  {
    id: 2,
    title: "Title 2",
    content: "Content",
    createdAt: "323232",
    updatedAt: "323232",
  },
  {
    id: 3,
    title: "Title 3",
    content: "Content",
    createdAt: "323232",
    updatedAt: "323232",
  },
];

export const postRouter = {
  all: protectedProcedure.query(({ ctx }) => {
    return ctx.db.post.findMany();
  }),

  byId: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => {
      return ctx.db.post.findUnique({ where: { id: input.id } });
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        content: z.string().min(1),
      }),
    )
    .mutation(({ ctx, input }) => {
      if (!ctx.user?.id) {
        throw Error("User not exists");
      }

      return ctx.db.post.create({
        data: { ...input, createdById: ctx.user.id },
      });
    }),

  delete: protectedProcedure.input(z.number()).mutation(({ ctx, input }) => {
    return ctx.db.post.delete({ where: { id: input } });
  }),
} satisfies TRPCRouterRecord;
