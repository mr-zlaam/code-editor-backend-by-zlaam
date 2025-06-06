import path from "path";
import fs from "fs";
import { generateRandomStrings } from "../quickUtil/slugStringGenerator.util";

const WORKSPACE_ROOT = "/code-server-workspaces";

export function createUniqueWorkspace(
  username: string,
  fileNameSlug: string,
): string {
  const workspacePath = path.join(
    WORKSPACE_ROOT,
    username,
    `${fileNameSlug}_${generateRandomStrings(4)}`,
  );

  if (!fs.existsSync(workspacePath)) {
    fs.mkdirSync(workspacePath, { recursive: true, mode: 0o755 });
  }

  return workspacePath;
}
