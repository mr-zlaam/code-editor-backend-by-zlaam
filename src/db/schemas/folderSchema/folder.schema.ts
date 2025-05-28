import { type AnyPgColumn, index, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { workspaceSchema } from "../workspaceSchema";
export const folderSchema = pgTable("folders", {
  id: serial("id").primaryKey(),
  folderName: varchar("folderName", { length: 100 }).notNull(),
  workspaceId: integer("workspaceId").notNull().references(() => workspaceSchema.id, {
    onDelete: "cascade",
  }),
  parentFolderId: integer("parentFolderId").references((): AnyPgColumn => folderSchema.id, {
    onDelete: "cascade",
  }),
  createdAt: timestamp("createdAt", {
    mode: "date",
    precision: 3,
  })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updatedAt", {
    mode: "date",
    precision: 3,
  })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}, (table) => [
  index("folder_workspaceId_idx").on(table.workspaceId),
]);

export type TFOLDER = typeof folderSchema.$inferSelect;
