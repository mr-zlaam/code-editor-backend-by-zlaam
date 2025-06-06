import { relations } from "drizzle-orm";
import { userSchema } from "../authSchema";
import { projectSchema } from "../projectSchema";
import { folderSchema } from "../folderSchema";
import { historySchema } from "../historySchema";

export const projectRelations = relations(projectSchema, ({ one, many }) => ({
  user: one(userSchema, {
    fields: [projectSchema.userId],
    references: [userSchema.uid],
  }),
  folders: many(folderSchema),
}));
export const historyRelations = relations(historySchema, ({ one }) => ({
  user: one(userSchema, {
    fields: [historySchema.userId],
    references: [userSchema.uid],
  }),
  folder: one(folderSchema, {
    fields: [historySchema.folderId],
    references: [folderSchema.id],
  }),
}));

// Update folder relations to include history
export const folderRelations = relations(folderSchema, ({ one, many }) => ({
  project: one(projectSchema, {
    fields: [folderSchema.projectId],
    references: [projectSchema.id],
  }),
  history: many(historySchema), // One folder has many history entries
}));

// Update user relations to include history
export const userRelations = relations(userSchema, ({ many }) => ({
  projects: many(projectSchema),
  history: many(historySchema), // One user has many history entries
}));
