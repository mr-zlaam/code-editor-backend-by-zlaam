CREATE TYPE "public"."containerStatus" AS ENUM('RUNNING', 'STOPPED');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('ADMIN', 'USER', 'MODERATOR');--> statement-breakpoint
CREATE TABLE "users" (
	"uid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(50) NOT NULL,
	"fullName" varchar(50) NOT NULL,
	"email" varchar(100) NOT NULL,
	"password" text NOT NULL,
	"role" "role" NOT NULL,
	"isVerified" boolean DEFAULT false NOT NULL,
	"OTP_TOKEN" text,
	"OTP_TOKEN_VERSION" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_OTP_TOKEN_unique" UNIQUE("OTP_TOKEN")
);
--> statement-breakpoint
CREATE TABLE "codeContainers" (
	"id" serial PRIMARY KEY NOT NULL,
	"codeContainerName" varchar(100) NOT NULL,
	"codeContainerDescription" varchar(500),
	"containerStatus" "containerStatus" DEFAULT 'STOPPED',
	"projectId" integer NOT NULL,
	"workspaceId" integer,
	"containerId" varchar(200) DEFAULT '' NOT NULL,
	"environmentConfig" text,
	"containerURI" text DEFAULT '' NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL,
	CONSTRAINT "codeContainers_codeContainerName_unique" UNIQUE("codeContainerName")
);
--> statement-breakpoint
CREATE TABLE "folders" (
	"id" serial PRIMARY KEY NOT NULL,
	"folderName" varchar(100) NOT NULL,
	"workspaceId" integer NOT NULL,
	"parentFolderId" integer,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"projectName" varchar(100) NOT NULL,
	"projectDescription" varchar(500),
	"userId" uuid NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" serial PRIMARY KEY NOT NULL,
	"workspaceName" varchar(100) NOT NULL,
	"workspaceDescription" varchar(500),
	"projectId" integer NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limiter_flexible" (
	"key" text PRIMARY KEY NOT NULL,
	"points" integer NOT NULL,
	"expire" timestamp,
	"previousDelay" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "codeContainers" ADD CONSTRAINT "codeContainers_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "codeContainers" ADD CONSTRAINT "codeContainers_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folders" ADD CONSTRAINT "folders_workspaceId_workspaces_id_fk" FOREIGN KEY ("workspaceId") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folders" ADD CONSTRAINT "folders_parentFolderId_folders_id_fk" FOREIGN KEY ("parentFolderId") REFERENCES "public"."folders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_userId_users_uid_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("uid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "user_createdAt_idx" ON "users" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "fullName_idx" ON "users" USING btree ("fullName");--> statement-breakpoint
CREATE INDEX "isVerified_idx" ON "users" USING btree ("isVerified");--> statement-breakpoint
CREATE INDEX "codeContainer_projectId_idx" ON "codeContainers" USING btree ("projectId");--> statement-breakpoint
CREATE INDEX "codeContainer_workspaceId_idx" ON "codeContainers" USING btree ("workspaceId");--> statement-breakpoint
CREATE INDEX "codeContainer_isContainerRunning_idx" ON "codeContainers" USING btree ("containerStatus");--> statement-breakpoint
CREATE INDEX "folder_workspaceId_idx" ON "folders" USING btree ("workspaceId");--> statement-breakpoint
CREATE INDEX "key_idx" ON "rate_limiter_flexible" USING btree ("key");