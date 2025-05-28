import { pgTable, timestamp, serial, varchar, uuid } from "drizzle-orm/pg-core";
import { userSchema } from "../authSchema";

export const projectSchema = pgTable("projects", {
  id: serial("id").primaryKey(),
  projectName: varchar("projectName", { length: 100 }).notNull(),
  projectDescription: varchar("projectDescription", { length: 500 }),
  userId: uuid("userId").notNull().references(() => userSchema.uid, {
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
export type TPROJECT = typeof projectSchema.$inferSelect;
