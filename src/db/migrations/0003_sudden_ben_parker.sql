ALTER TABLE "codeContainers" DROP CONSTRAINT "codeContainers_containerId_unique";--> statement-breakpoint
ALTER TABLE "codeContainers" ALTER COLUMN "containerId" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "codeContainers" ALTER COLUMN "containerId" SET NOT NULL;