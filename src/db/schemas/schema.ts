import { userSchema } from "./authSchema";
import { folderSchema } from "./folderSchema";
import { historySchema } from "./historySchema";
import { projectSchema } from "./projectSchema";
import {
  folderRelations,
  historyRelations,
  projectRelations,
  userRelations,
} from "./shared/relations";

export const schema = {
  users: userSchema,
  project: projectSchema,
  folder: folderSchema,
  history: historySchema,
  userRelations,
  folderRelations,
  projectRelations,
  historyRelations,
};
export type TSCHEMA = typeof schema;
