import { relations } from "drizzle-orm";
import { userSchema } from "../authSchema";
import { projectSchema } from "../projectSchema";
import { workspaceSchema } from "../workspaceSchema";
import { codeContainerSchema } from "../codeContainerSchema";
import { folderSchema } from "../folderSchema";

export const userRelations = relations(userSchema, ({ many }) => ({
  projects: many(projectSchema),
}));

export const projectRelations = relations(projectSchema, ({ one, many }) => ({
  user: one(userSchema, {
    fields: [projectSchema.userId],
    references: [userSchema.uid],
  }),
  workspaces: many(workspaceSchema),
  codeContainers: many(codeContainerSchema),
}));

export const workspaceRelations = relations(workspaceSchema, ({ one, many }) => ({
  project: one(projectSchema, {
    fields: [workspaceSchema.projectId],
    references: [projectSchema.id],
  }),
  folders: many(folderSchema),
  codeContainers: many(codeContainerSchema),
}));

export const folderRelations = relations(folderSchema, ({ one, many }) => ({
  workspace: one(workspaceSchema, {
    fields: [folderSchema.workspaceId],
    references: [workspaceSchema.id],
  }),
  parentFolder: one(folderSchema, {
    fields: [folderSchema.parentFolderId],
    references: [folderSchema.id],
  }),
  subFolders: many(folderSchema),
}));

export const codeContainerRelations = relations(codeContainerSchema, ({ one }) => ({
  project: one(projectSchema, {
    fields: [codeContainerSchema.projectId],
    references: [projectSchema.id],
  }),
  workspace: one(workspaceSchema, {
    fields: [codeContainerSchema.workspaceId],
    references: [workspaceSchema.id],
  }),
}));
