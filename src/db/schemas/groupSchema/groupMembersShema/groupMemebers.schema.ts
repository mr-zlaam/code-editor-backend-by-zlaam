import {
  integer,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { groupSchema } from "../groupSchema/group.schema";
import { userSchema } from "../../authSchema";

export const groupMembersSchema = pgTable(
  "groupMembers",
  {
    id: serial("id").primaryKey(),
    groupId: integer("groupId")
      .references(() => groupSchema.id)
      .notNull(),
    userId: uuid("userId")
      .references(() => userSchema.uid)
      .notNull(),
    joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("unique_membership").on(table.groupId, table.userId)],
);

export type TGROUPMEMBERS = typeof groupMembersSchema.$inferSelect;
