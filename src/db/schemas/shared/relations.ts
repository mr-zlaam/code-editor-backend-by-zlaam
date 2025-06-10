// import { relations } from "drizzle-orm";
// import { userSchema } from "../authSchema";
// import { projectSchema } from "../projectSchema";
// import { folderSchema } from "../folderSchema";
// import { historySchema } from "../historySchema";
//
// export const projectRelations = relations(projectSchema, ({ one, many }) => ({
//   user: one(userSchema, {
//     fields: [projectSchema.userId],
//     references: [userSchema.uid],
//   }),
//   folders: many(folderSchema),
// }));
// export const historyRelations = relations(historySchema, ({ one }) => ({
//   user: one(userSchema, {
//     fields: [historySchema.userId],
//     references: [userSchema.uid],
//   }),
//   folder: one(folderSchema, {
//     fields: [historySchema.folderId],
//     references: [folderSchema.id],
//   }),
// }));
//
// // Update folder relations to include history
// export const folderRelations = relations(folderSchema, ({ one, many }) => ({
//   project: one(projectSchema, {
//     fields: [folderSchema.projectId],
//     references: [projectSchema.id],
//   }),
//   history: many(historySchema), // One folder has many history entries
// }));
//
// // Update user relations to include history
// export const userRelations = relations(userSchema, ({ many }) => ({
//   projects: many(projectSchema),
//   history: many(historySchema), // One user has many history entries
// }));
import { relations } from "drizzle-orm";
import { userSchema } from "../authSchema";
import { projectSchema } from "../projectSchema";
import { folderSchema } from "../folderSchema";
import { historySchema } from "../historySchema";
import {
  groupInviteLinksSchema,
  groupJoinRequestsSchema,
  groupMembersSchema,
  groupSchema,
} from "../groupSchema";

// User Relations
export const userRelations = relations(userSchema, ({ many }) => ({
  projects: many(projectSchema),
  history: many(historySchema),
  groupsOwned: many(groupSchema),
  groupMemberships: many(groupMembersSchema),
  joinRequests: many(groupJoinRequestsSchema),
}));

// Project Relations
export const projectRelations = relations(projectSchema, ({ one, many }) => ({
  user: one(userSchema, {
    fields: [projectSchema.userId],
    references: [userSchema.uid],
  }),
  folders: many(folderSchema),
  group: one(groupSchema, {
    fields: [projectSchema.id],
    references: [groupSchema.projectId],
  }),
}));

// Folder Relations
export const folderRelations = relations(folderSchema, ({ one, many }) => ({
  project: one(projectSchema, {
    fields: [folderSchema.projectId],
    references: [projectSchema.id],
  }),
  history: many(historySchema),
  group: one(groupSchema, {
    fields: [folderSchema.id],
    references: [groupSchema.folderId],
  }),
}));

// History Relations
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

// Group Relations
export const groupRelations = relations(groupSchema, ({ one, many }) => ({
  project: one(projectSchema, {
    fields: [groupSchema.projectId],
    references: [projectSchema.id],
  }),
  folder: one(folderSchema, {
    fields: [groupSchema.folderId],
    references: [folderSchema.id],
  }),
  owner: one(userSchema, {
    fields: [groupSchema.ownerId],
    references: [userSchema.uid],
  }),
  members: many(groupMembersSchema),
  inviteLinks: many(groupInviteLinksSchema),
  joinRequests: many(groupJoinRequestsSchema),
}));

// Group Members Relations
export const groupMembersRelations = relations(
  groupMembersSchema,
  ({ one }) => ({
    group: one(groupSchema, {
      fields: [groupMembersSchema.groupId],
      references: [groupSchema.id],
    }),
    user: one(userSchema, {
      fields: [groupMembersSchema.userId],
      references: [userSchema.uid],
    }),
  }),
);

// Group Invite Links Relations
export const groupInviteLinksRelations = relations(
  groupInviteLinksSchema,
  ({ one }) => ({
    group: one(groupSchema, {
      fields: [groupInviteLinksSchema.groupId],
      references: [groupSchema.id],
    }),
  }),
);

// Group Join Requests Relations
export const groupJoinRequestsRelations = relations(
  groupJoinRequestsSchema,
  ({ one }) => ({
    group: one(groupSchema, {
      fields: [groupJoinRequestsSchema.groupId],
      references: [groupSchema.id],
    }),
    user: one(userSchema, {
      fields: [groupJoinRequestsSchema.userId],
      references: [userSchema.uid],
    }),
  }),
);
