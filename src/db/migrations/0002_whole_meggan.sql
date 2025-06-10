DROP INDEX "unique_membership";--> statement-breakpoint
CREATE UNIQUE INDEX "unique_membership" ON "groupMembers" USING btree ("userId");