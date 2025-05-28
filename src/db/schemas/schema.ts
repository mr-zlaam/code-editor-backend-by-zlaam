import { userSchema } from "./authSchema";
import { codeContainerSchema } from "./codeContainerSchema";
import { folderSchema } from "./folderSchema";
import { projectSchema } from "./projectSchema";
import { codeContainerRelations, folderRelations, projectRelations, userRelations, workspaceRelations } from "./shared/relations";
import { workspaceSchema } from "./workspaceSchema";

export const schema = {
  users: userSchema,
  project: projectSchema,
  codeContainer: codeContainerSchema,
  folder: folderSchema,
  workspace: workspaceSchema,
  userRelations,
  codeContainerRelations,
  folderRelations,
  projectRelations,
  workspaceRelations
};
export type TSCHEMA = typeof schema;
