import { serial, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { userSchema } from "../authSchema";
import { folderSchema } from "../folderSchema";

export const historySchema = pgTable("history", {
  id: serial("id").primaryKey(), // Better than serial for distributed systems
  folderId: serial("folderId").references(() => folderSchema.id, {
    onDelete: "cascade",
  }),
  userId: uuid("userId")
    .notNull()
    .references(() => userSchema.uid),
  enterAt: timestamp("enterAt", {
    mode: "date",
    precision: 3,
  }).notNull(),
  exitAt: timestamp("exitAt", {
    mode: "date",
    precision: 3,
  }),
  createdAt: timestamp("createdAt", {
    mode: "date",
    precision: 3,
  }).defaultNow(),
});

export type THISTORY = typeof historySchema.$inferSelect;
