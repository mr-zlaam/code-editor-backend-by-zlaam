import {
  integer,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { groupSchema } from "../groupSchema/group.schema";

export const groupInviteLinksSchema = pgTable("groupInviteLinks", {
  id: serial("id").primaryKey(),
  groupId: integer("groupId")
    .references(() => groupSchema.id, { onDelete: "cascade" })
    .notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TGROUPINVITELINK = typeof groupInviteLinksSchema.$inferSelect;
