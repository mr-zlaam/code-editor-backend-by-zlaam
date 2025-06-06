import { pgEnum } from "drizzle-orm/pg-core";

//** Auth enum */
export const userRoleEnum = pgEnum("role", ["ADMIN", "USER", "MODERATOR"]);

export type TCURRENTROLE = (typeof userRoleEnum.enumValues)[number];

export const folderStatusEnum = pgEnum("status", ["RUNNING", "STOPPED"]);
export type TFOLDERSTATUS = (typeof folderStatusEnum.enumValues)[number];
