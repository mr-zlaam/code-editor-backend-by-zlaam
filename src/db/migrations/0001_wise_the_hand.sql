ALTER TABLE "groups" DROP CONSTRAINT "project_or_folder";--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "project_or_folder" CHECK ((
  ("projectId" IS NOT NULL AND "folderId" IS NULL) OR 
  ("projectId" IS NULL AND "folderId" IS NOT NULL) OR 
  ("projectId" IS NOT NULL AND "folderId" IS NOT NULL)
));