import {
  pgTable,
  serial,
  varchar,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { projectSchema } from "../projectSchema";
export const workspaceSchema = pgTable("workspaces", {
  id: serial("id").primaryKey(),
  workspaceName: varchar("workspaceName", { length: 100 }).notNull(),
  workspaceDescription: varchar("workspaceDescription", { length: 500 }),
  projectId: integer("projectId")
    .notNull()
    .references(() => projectSchema.id, {
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
});

export type TWORKSPACE = typeof workspaceSchema.$inferSelect;
