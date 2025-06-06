import { userSchema } from "./authSchema";
import { folderSchema } from "./folderSchema";
import { projectSchema } from "./projectSchema";
import {
  folderRelations,
  projectRelations,
  userRelations,
} from "./shared/relations";

export const schema = {
  users: userSchema,
  project: projectSchema,
  folder: folderSchema,
  userRelations,
  folderRelations,
  projectRelations,
};
export type TSCHEMA = typeof schema;
