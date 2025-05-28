import {
  boolean,
  text,
  pgTable,
  timestamp,
  serial,
  integer,
  varchar,
  index,
} from "drizzle-orm/pg-core";
import { projectSchema } from "../projectSchema";
import { workspaceSchema } from "../workspaceSchema";
export const codeContainerSchema = pgTable(
  "codeContainers",
  {
    id: serial("id").primaryKey(),
    codeContainerName: varchar("codeContainerName", { length: 100 })
      .notNull()
      .unique(),
    codeContainerDescription: varchar("codeContainerDescription", {
      length: 500,
    }),
    isContainerRunning: boolean("isContainerRunning").notNull().default(false),
    projectId: integer("projectId")
      .notNull()
      .references(() => projectSchema.id, {
        onDelete: "cascade",
      }),
    workspaceId: integer("workspaceId").references(() => workspaceSchema.id, {
      onDelete: "set null",
    }), // Optional: Link container to a workspace
    containerId: varchar("containerId", { length: 200 }).notNull().unique(),
    environmentConfig: text("environmentConfig"), // JSON string for language support (e.g., {"node": "18", "python": "3.9"})
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
  },
  (table) => [
    index("codeContainer_projectId_idx").on(table.projectId),
    index("codeContainer_workspaceId_idx").on(table.workspaceId),
    index("codeContainer_isContainerRunning_idx").on(table.isContainerRunning),
  ],
);

export type TCODECONTAINER = typeof codeContainerSchema.$inferSelect;
