import { pgEnum } from "drizzle-orm/pg-core";

//** Auth enum */
export const userRoleEnum = pgEnum("role", ["ADMIN", "USER", "MODERATOR"]);

export type TCURRENTROLE = (typeof userRoleEnum.enumValues)[number];

export const containerStatusEnum = pgEnum("containerStatus", [
  "RUNNING",
  "STOPPED",
]);
export type TCONTAINERSTATUS = (typeof containerStatusEnum.enumValues)[number];
