import { userSchema } from "./authSchema";

export const schema = {
  users: userSchema,
};
export type TSCHEMA = typeof schema;
