import { pgTable, timestamp, serial, varchar, uuid } from "drizzle-orm/pg-core";
import { userSchema } from "../authSchema";

export const projectSchema = pgTable("projects", {
  id: serial("id").primaryKey(),
  projectName: varchar("projectName", { length: 100 }).notNull(),
  projectNameSlug: varchar("projectNameSlug", { length: 200 }).notNull(),
  configuration: varchar("configuration", { length: 200 }),
  userId: uuid("userId")
    .notNull()
    .references(() => userSchema.uid, {
      onDelete: "cascade",
    }),
  createdBy: uuid("createdBy")
    .notNull()
    .references(() => userSchema.uid, {
      onDelete: "cascade",
    }),
  storage: varchar("storage", { length: 100 }).notNull(),
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
export type TPROJECT = typeof projectSchema.$inferSelect;
