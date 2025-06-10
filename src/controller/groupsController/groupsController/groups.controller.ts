import reshttp from "reshttp";
import type { DatabaseClient } from "../../../db/db";
import type { _Request } from "../../../middleware/globalMiddleware/auth.middleware";
import { asyncHandler } from "../../../util/globalUtil/asyncHandler.util";
import { getFutureTimestamp } from "../../../util/globalUtil/getFutureTimestamp.util";
import { throwError } from "../../../util/globalUtil/throwError.util";
import { generateRandomStrings } from "../../../util/quickUtil/slugStringGenerator.util";
import type { TTIMESTRING } from "../../../type/types";
import {
  groupInviteLinksSchema,
  groupJoinRequestsSchema,
  groupMembersSchema,
  groupSchema,
} from "../../../db/schemas";
import { httpResponse } from "../../../util/globalUtil/apiResponse.util";
import { and, eq } from "drizzle-orm";
import logger from "../../../util/globalUtil/logger.util";

class GroupsController {
  private readonly _db: DatabaseClient;
  constructor(db: DatabaseClient) {
    this._db = db;
  }
  public createInviteLink = asyncHandler(async (req: _Request, res) => {
    const body = req.body as {
      groupId: number;
      expiredAt: unknown;
    };
    if (!body) {
      return throwError(
        reshttp.badRequestCode,
        "groupId and expiredAt is required",
      );
    }
    const { expiredAt, groupId } = body;
    if (!groupId) {
      return throwError(reshttp.badRequestCode, "groupId is required");
    }
    if (!expiredAt) {
      return throwError(reshttp.badRequestCode, "expiredAt is required");
    }
    const inviteToken = generateRandomStrings(10);
    const isoTimeStamp = getFutureTimestamp(expiredAt as TTIMESTRING);
    const checkIfUserCanCreateLink = await this._db.query.group.findFirst({
      where: and(
        eq(groupSchema.id, groupId),
        eq(groupSchema.ownerId, req.userFromToken!.uid),
      ),
    });
    if (!checkIfUserCanCreateLink) {
      return throwError(
        reshttp.forbiddenCode,
        "You are not allowed to create invite link for this group",
      );
    }
    const isLinkExist = await this._db.query.groupInviteLinks.findFirst({
      where: eq(groupInviteLinksSchema.groupId, groupId),
    });
    if (isLinkExist) {
      const [latestLink] = await this._db
        .update(groupInviteLinksSchema)
        .set({ expiresAt: new Date(isoTimeStamp), token: inviteToken })
        .where(eq(groupInviteLinksSchema.groupId, groupId))
        .returning({
          expiredAt: groupInviteLinksSchema.expiresAt,
          token: groupInviteLinksSchema.token,
        });
      return httpResponse(
        req,
        res,
        reshttp.okCode,
        reshttp.okMessage,
        latestLink,
      );
    }
    const [newGroupInviteLinkData] = await this._db
      .insert(groupInviteLinksSchema)
      .values({
        expiresAt: new Date(isoTimeStamp),
        groupId,
        token: inviteToken,
      })
      .onConflictDoNothing()
      .returning({
        token: groupInviteLinksSchema.token,
        expiredAt: groupInviteLinksSchema.expiresAt,
      });

    httpResponse(
      req,
      res,
      reshttp.okCode,
      reshttp.okMessage,
      newGroupInviteLinkData,
    );
  });

  public requestToJoinGroupWithTheInviteLink = asyncHandler(
    async (req: _Request, res) => {
      const userId = req.userFromToken!.uid;
      if (!req.body) {
        logger.info("req.body is required");
        throwError(reshttp.badRequestCode, reshttp.badRequestMessage);
      }
      const { groupId, linkToken } = req.body as {
        groupId: number;
        linkToken: string;
      };
      if (!groupId) {
        return throwError(reshttp.badRequestCode, "groupId is required");
      }
      if (!linkToken) {
        logger.warn("linkToken is required");
        return throwError(reshttp.badRequestCode, reshttp.badRequestMessage);
      }
      const checkIfGroupExists = await this._db.query.group.findFirst({
        where: eq(groupSchema.id, groupId),
      });
      if (!checkIfGroupExists) {
        return throwError(reshttp.badRequestCode, "Group not found");
      }
      if (checkIfGroupExists?.ownerId === userId) {
        return throwError(
          reshttp.badRequestCode,
          "come on you are one who created the group",
        );
      }
      const isLinkExist = await this._db.query.groupInviteLinks.findFirst({
        where: and(
          eq(groupInviteLinksSchema.groupId, groupId),
          eq(groupInviteLinksSchema.token, linkToken),
        ),
      });
      if (!isLinkExist) {
        return throwError(reshttp.badRequestCode, "Invalid invite link");
      }
      // check if link is expired
      if (isLinkExist.expiresAt < new Date()) {
        return throwError(reshttp.badRequestCode, "Invite link is expired");
      }
      const isPendingRequestExist =
        await this._db.query.groupJoinRequests.findFirst({
          where: and(
            eq(groupJoinRequestsSchema.groupId, groupId),
            eq(groupJoinRequestsSchema.userId, userId),
            eq(groupJoinRequestsSchema.requestStatus, "PENDING"),
          ),
        });
      if (isPendingRequestExist) {
        throwError(
          reshttp.badRequestCode,
          "You have already requested to join this group. Please wait for the admin to accept your request.",
        );
      }
      await this._db
        .insert(groupJoinRequestsSchema)
        .values({
          groupId,
          userId,
          requestStatus: "PENDING",
        })
        .returning();
      httpResponse(req, res, reshttp.okCode, reshttp.okMessage, {
        message: "Request was successful, Please wait for approval",
      });
    },
  );

  public updateStatusOfGroupJoinRequest = asyncHandler(
    async (req: _Request, res) => {
      const { groupId, status, userId } = req.body as {
        groupId: string;
        status: "ACCEPTED" | "REJECTED";
        userId: string;
      };
      if (!groupId) {
        return throwError(reshttp.badRequestCode, "id is required");
      }
      if (!userId) {
        return throwError(reshttp.badRequestCode, "userId is required");
      }
      const isRequestExist = await this._db.query.groupJoinRequests.findFirst({
        where: and(
          eq(groupJoinRequestsSchema.groupId, Number(groupId)),
          eq(groupJoinRequestsSchema.userId, userId),
        ),
      });
      if (!isRequestExist) {
        return throwError(reshttp.badRequestCode, "Request does not exist");
      }
      if (!status) {
        return throwError(reshttp.badRequestCode, "status is required");
      }
      if (status !== "ACCEPTED" && status !== "REJECTED") {
        return throwError(reshttp.badRequestCode, "Invalid status");
      }

      if (status === "ACCEPTED") {
        const [data] = await this._db
          .update(groupJoinRequestsSchema)
          .set({
            requestStatus: "ACCEPTED",
          })
          .where(
            and(
              eq(groupJoinRequestsSchema.groupId, Number(groupId)),
              eq(groupJoinRequestsSchema.userId, userId),
            ),
          )
          .returning({
            userId: groupJoinRequestsSchema.userId,
            groupId: groupJoinRequestsSchema.groupId,
          });
        await this._db.insert(groupMembersSchema).values({
          groupId: data.groupId,
          userId: data.userId as string,
          joinedAt: new Date(),
        });
        await this._db
          .delete(groupJoinRequestsSchema)
          .where(
            and(
              eq(groupJoinRequestsSchema.groupId, Number(groupId)),
              eq(groupJoinRequestsSchema.userId, userId),
            ),
          );
        httpResponse(req, res, reshttp.okCode, reshttp.okMessage, {
          message: "Request has been accepted",
        });
      }
      if (status === "REJECTED") {
        await this._db
          .delete(groupJoinRequestsSchema)
          .where(
            and(
              eq(groupJoinRequestsSchema.groupId, Number(groupId)),
              eq(groupJoinRequestsSchema.userId, userId),
            ),
          );
        httpResponse(req, res, reshttp.okCode, reshttp.okMessage, {
          message: "Request has been rejected",
        });
      }
    },
  );
  public getAllJoinRequests = asyncHandler(async (req: _Request, res) => {
    const { groupId } = req.params as { groupId: string };
    if (!groupId) {
      return throwError(reshttp.badRequestCode, "groupdId is required");
    }
    const joinGroupReuest = await this._db.query.groupJoinRequests.findMany({
      where: and(
        eq(groupJoinRequestsSchema.groupId, Number(groupId)),
        eq(groupJoinRequestsSchema.requestStatus, "PENDING"),
      ),
      with: { user: { columns: { fullName: true, email: true } } },
    });

    httpResponse(req, res, reshttp.okCode, reshttp.okMessage, joinGroupReuest);
  });

  // ** get all group members
  public getAllGroupMembers = asyncHandler(async (req: _Request, res) => {
    const { groupId } = req.params as { groupId: string };
    if (!groupId) {
      return throwError(reshttp.badRequestCode, "groupId is required");
    }
    const checkGroupExist = await this._db.query.group.findFirst({
      where: eq(groupSchema.id, Number(groupId)),
    });
    if (!checkGroupExist) {
      return throwError(reshttp.badRequestCode, "Group does not exist");
    }
    const groupMembers = await this._db.query.groupMembers.findMany({
      where: eq(groupMembersSchema.groupId, Number(groupId)),
      with: { user: { columns: { fullName: true, email: true } } },
    });
    httpResponse(req, res, reshttp.okCode, reshttp.okMessage, groupMembers);
  });
}

export const groupsController = (db: DatabaseClient) =>
  new GroupsController(db);
