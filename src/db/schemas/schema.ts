import { userSchema } from "./authSchema";
import { folderSchema } from "./folderSchema";
import {
  groupInviteLinksSchema,
  groupJoinRequestsSchema,
  groupMembersSchema,
  groupSchema,
} from "./groupSchema";
import { historySchema } from "./historySchema";
import { projectSchema } from "./projectSchema";
import {
  folderRelations,
  groupInviteLinksRelations,
  groupJoinRequestsRelations,
  groupMembersRelations,
  groupRelations,
  historyRelations,
  projectRelations,
  userRelations,
} from "./shared/relations";

export const schema = {
  users: userSchema,
  project: projectSchema,
  folder: folderSchema,
  history: historySchema,
  group: groupSchema,
  groupMembers: groupMembersSchema,
  groupInviteLinks: groupInviteLinksSchema,
  groupJoinRequests: groupJoinRequestsSchema,

  // relations
  userRelations,
  folderRelations,
  projectRelations,
  historyRelations,
  groupRelations,
  groupMembersRelations,
  groupInviteLinksRelations,
  groupJoinRequestsRelations,
};
export type TSCHEMA = typeof schema;
