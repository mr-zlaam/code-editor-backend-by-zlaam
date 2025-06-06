import { z } from "zod";

export const createProjectSchemaZ = z.object({
  projectName: z
    .string({ message: "projectName must be string" })
    .min(3, "projectName must be atleast 3 characters")
    .max(100, "projectName can only have 100 characters"),
  configuration: z
    .string({ message: "configuration must be string" })
    .min(3, "configuration must be atleast 3 characters")
    .max(100, "configuration can only have 100 characters")
    .optional(),
});

export const updateProjectSchemaZ = z.object({
  projectName: z
    .string({ message: "projectName must be string" })
    .min(3, "projectName must be atleast 3 characters")
    .max(100, "projectName can only have 100 characters"),
  configuration: z
    .string({ message: "configuration must be string" })
    .min(3, "configuration must be atleast 3 characters")
    .max(100, "configuration can only have 100 characters")
    .optional(),
});
export const deleteProjectSchemaZ = z.object({
  projectId: z.string({ message: "projectId must be string" }),
});
