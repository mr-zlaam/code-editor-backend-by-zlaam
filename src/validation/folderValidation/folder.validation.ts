import { z } from "zod";
/**
 * fileName,projectId,createdBy,tech,
 */
export const createFolderSchemaZ = z.object({
  fileName: z
    .string({ message: "fileName must be string" })
    .min(3, "fileName must be atleast 3 characters")
    .max(100, "fileName can only have 100 characters"),
  projectId: z.number({ message: "projectId must be number" }),
  tech: z
    .string({ message: "tech must be string" })
    .min(3, "tech must be atleast 3 characters")
    .max(100, "tech can only have 100 characters"),
});
