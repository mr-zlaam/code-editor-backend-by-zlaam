import { pgEnum } from "drizzle-orm/pg-core";

//** Auth enum */
export const userRoleEnum = pgEnum("role", ["ADMIN", "USER", "MODERATOR"]);

export type TCURRENTROLE = (typeof userRoleEnum.enumValues)[number];

export const folderStatusEnum = pgEnum("status", ["RUNNING", "STOPPED"]);
export type TFOLDERSTATUS = (typeof folderStatusEnum.enumValues)[number];

// *** groups enums
export const groupTypeEnum = pgEnum("groupType", ["PROJECT", "FOLDER"]);
export type TGROUPTYPE = (typeof groupTypeEnum.enumValues)[number];
export const requestStatusEnum = pgEnum("requestStatus", [
  "PENDING",
  "ACCEPTED",
  "REJECTED",
]);
export type TREQUESTSTATUS = (typeof requestStatusEnum.enumValues)[number];
