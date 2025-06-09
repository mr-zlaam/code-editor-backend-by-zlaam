import {
  check,
  integer,
  pgTable,
  serial,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { userSchema } from "../../authSchema";
import { groupTypeEnum } from "../../shared/enums";
import { projectSchema } from "../../projectSchema";
import { folderSchema } from "../../folderSchema";
import { sql } from "drizzle-orm";

export const groupSchema = pgTable(
  "groups",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 50 }).notNull(),
    groupType: groupTypeEnum("type").notNull(),
    projectId: integer("projectId")
      .unique()
      .references(() => projectSchema.id),
    folderId: integer("folderId")
      .unique()
      .references(() => folderSchema.id),
    ownerId: uuid("ownerId")
      .references(() => userSchema.uid)
      .notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  () => [
    check(
      "project_or_folder",
      sql`("projectId" IS NOT NULL AND "folderId" IS NULL) OR ("projectId" IS NULL AND "folderId" IS NOT NULL)`,
    ),
  ],
);

export type TGROUP = typeof groupSchema.$inferSelect;
