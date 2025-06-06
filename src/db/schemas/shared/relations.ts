import { relations } from "drizzle-orm";
import { userSchema } from "../authSchema";
import { projectSchema } from "../projectSchema";
import { folderSchema } from "../folderSchema";

export const userRelations = relations(userSchema, ({ many }) => ({
  projects: many(projectSchema),
}));

export const projectRelations = relations(projectSchema, ({ one, many }) => ({
  user: one(userSchema, {
    fields: [projectSchema.userId],
    references: [userSchema.uid],
  }),
  folders: many(folderSchema),
}));

export const folderRelations = relations(folderSchema, ({ one }) => ({
  project: one(projectSchema, {
    fields: [folderSchema.projectId],
    references: [projectSchema.id],
  }),
}));
