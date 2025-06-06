import {
  integer,
  pgTable,
  serial,
  timestamp,
  varchar,
  uuid,
} from "drizzle-orm/pg-core";
import { folderStatusEnum } from "../shared/enums";
import { projectSchema } from "../projectSchema";
import { userSchema } from "../authSchema";
export const folderSchema = pgTable("folders", {
  id: serial("id").primaryKey(),
  fileName: varchar("folderName", { length: 100 }).notNull(),
  projectId: integer("projectId")
    .notNull()
    .references(() => projectSchema.id, {
      onDelete: "cascade",
    }),
  createdBy: uuid("createdBy")
    .notNull()
    .references(() => userSchema.uid, {
      onDelete: "cascade",
    }),
  fileNameSlug: varchar("folderNameSlug", { length: 200 }).notNull().unique(),
  projectLink: varchar("projectLink", { length: 2000 }).notNull(),
  status: folderStatusEnum().notNull().default("STOPPED"),
  storage: varchar("storage", { length: 100 }),
  tech: varchar("tech", { length: 100 }).notNull(),
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

export type IFOLDER = typeof folderSchema.$inferSelect;
