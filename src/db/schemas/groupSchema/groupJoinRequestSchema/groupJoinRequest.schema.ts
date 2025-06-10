import {
  integer,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { requestStatusEnum } from "../../shared/enums";
import { groupSchema } from "../groupSchema/group.schema";
import { userSchema } from "../../authSchema";
import { sql } from "drizzle-orm";

export const groupJoinRequestsSchema = pgTable(
  "groupJoinRequests",
  {
    id: serial("id").primaryKey(),
    groupId: integer("groupId")
      .references(() => groupSchema.id)
      .notNull(),
    userId: uuid("userId").references(() => userSchema.uid),
    requestStatus: requestStatusEnum().notNull().default("PENDING"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("unique_pending_request")
      .on(table.groupId, table.userId)
      .where(sql`("requestStatus" = 'PENDING')`),
  ],
);

export type TGROUP_JOIN_REQUEST = typeof groupJoinRequestsSchema;
