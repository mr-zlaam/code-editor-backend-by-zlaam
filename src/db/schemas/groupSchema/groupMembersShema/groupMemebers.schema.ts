import { integer, pgTable, serial, timestamp, uuid } from "drizzle-orm/pg-core";
import { groupSchema } from "../groupSchema/group.schema";
import { userSchema } from "../../authSchema";

export const groupMembersSchema = pgTable("groupMembers", {
  id: serial("id").primaryKey(),
  groupId: integer("groupId")
    .references(() => groupSchema.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("userId")
    .references(() => userSchema.uid)
    .notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export type TGROUPMEMBERS = typeof groupMembersSchema.$inferSelect;
