CREATE TYPE "public"."status" AS ENUM('RUNNING', 'STOPPED');--> statement-breakpoint
CREATE TYPE "public"."groupType" AS ENUM('PROJECT', 'FOLDER');--> statement-breakpoint
CREATE TYPE "public"."requestStatus" AS ENUM('PENDING', 'ACCEPTED', 'REJECTED');--> statement-breakpoint
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
CREATE TABLE "folders" (
	"id" serial PRIMARY KEY NOT NULL,
	"folderName" varchar(100) NOT NULL,
	"projectId" integer NOT NULL,
	"createdBy" uuid NOT NULL,
	"folderNameSlug" varchar(200) NOT NULL,
	"projectLink" varchar(2000) NOT NULL,
	"status" "status" DEFAULT 'STOPPED' NOT NULL,
	"storage" varchar(100),
	"containerId" varchar(200) DEFAULT '' NOT NULL,
	"tech" varchar(100) NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL,
	CONSTRAINT "folders_folderNameSlug_unique" UNIQUE("folderNameSlug")
);
--> statement-breakpoint
CREATE TABLE "groupInviteLinks" (
	"id" serial PRIMARY KEY NOT NULL,
	"groupId" integer NOT NULL,
	"token" varchar(255) NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "groupInviteLinks_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "groupJoinRequests" (
	"id" serial PRIMARY KEY NOT NULL,
	"groupId" integer NOT NULL,
	"userId" uuid NOT NULL,
	"requestStatus" "requestStatus" DEFAULT 'PENDING' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "groupMembers" (
	"id" serial PRIMARY KEY NOT NULL,
	"groupId" integer NOT NULL,
	"userId" uuid NOT NULL,
	"joinedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"type" "groupType" NOT NULL,
	"projectId" integer,
	"folderId" integer,
	"ownerId" uuid NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "groups_projectId_unique" UNIQUE("projectId"),
	CONSTRAINT "groups_folderId_unique" UNIQUE("folderId"),
	CONSTRAINT "project_or_folder" CHECK (("projectId" IS NOT NULL AND "folderId" IS NULL) OR ("projectId" IS NULL AND "folderId" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "history" (
	"id" serial PRIMARY KEY NOT NULL,
	"folderId" serial NOT NULL,
	"userId" uuid NOT NULL,
	"enterAt" timestamp (3) NOT NULL,
	"exitAt" timestamp (3),
	"createdAt" timestamp (3) DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"projectName" varchar(100) NOT NULL,
	"projectNameSlug" varchar(200) NOT NULL,
	"configuration" varchar(200),
	"userId" uuid NOT NULL,
	"createdBy" uuid NOT NULL,
	"storage" varchar(100) NOT NULL,
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
ALTER TABLE "folders" ADD CONSTRAINT "folders_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folders" ADD CONSTRAINT "folders_createdBy_users_uid_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("uid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groupInviteLinks" ADD CONSTRAINT "groupInviteLinks_groupId_groups_id_fk" FOREIGN KEY ("groupId") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groupJoinRequests" ADD CONSTRAINT "groupJoinRequests_groupId_groups_id_fk" FOREIGN KEY ("groupId") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groupJoinRequests" ADD CONSTRAINT "groupJoinRequests_userId_users_uid_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groupMembers" ADD CONSTRAINT "groupMembers_groupId_groups_id_fk" FOREIGN KEY ("groupId") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groupMembers" ADD CONSTRAINT "groupMembers_userId_users_uid_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_projectId_projects_id_fk" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_folderId_folders_id_fk" FOREIGN KEY ("folderId") REFERENCES "public"."folders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_ownerId_users_uid_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "history" ADD CONSTRAINT "history_folderId_folders_id_fk" FOREIGN KEY ("folderId") REFERENCES "public"."folders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "history" ADD CONSTRAINT "history_userId_users_uid_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("uid") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_userId_users_uid_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("uid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_createdBy_users_uid_fk" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("uid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "user_createdAt_idx" ON "users" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "fullName_idx" ON "users" USING btree ("fullName");--> statement-breakpoint
CREATE INDEX "isVerified_idx" ON "users" USING btree ("isVerified");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_pending_request" ON "groupJoinRequests" USING btree ("groupId","userId") WHERE ("requestStatus" = 'PENDING');--> statement-breakpoint
CREATE UNIQUE INDEX "unique_membership" ON "groupMembers" USING btree ("groupId","userId");--> statement-breakpoint
CREATE INDEX "key_idx" ON "rate_limiter_flexible" USING btree ("key");