import reshttp from "reshttp";
import type { DatabaseClient } from "../../../db/db";
import type { _Request } from "../../../middleware/globalMiddleware/auth.middleware";
import { asyncHandler } from "../../../util/globalUtil/asyncHandler.util";
import { getFutureTimestamp } from "../../../util/globalUtil/getFutureTimestamp.util";
import { throwError } from "../../../util/globalUtil/throwError.util";
import { generateRandomStrings } from "../../../util/quickUtil/slugStringGenerator.util";
import type { TTIMESTRING } from "../../../type/types";
import { groupInviteLinksSchema } from "../../../db/schemas";
import { httpResponse } from "../../../util/globalUtil/apiResponse.util";
import { eq } from "drizzle-orm";

class GroupsController {
  private readonly _db: DatabaseClient;
  constructor(db: DatabaseClient) {
    this._db = db;
  }
  public createInviteLink = asyncHandler(async (req: _Request, res) => {
    const { groupId, expiredAt } = req.body as {
      groupId: number;
      expiredAt: unknown;
    };
    if (!groupId) {
      return throwError(reshttp.badRequestCode, "groupId is required");
    }
    if (!expiredAt) {
      return throwError(reshttp.badRequestCode, "expiredAt is required");
    }
    const isLinkExist = await this._db.query.groupInviteLinks.findFirst({
      where: eq(groupInviteLinksSchema.groupId, groupId),
    });
    if (isLinkExist) {
      return httpResponse(
        req,
        res,
        reshttp.badRequestCode,
        reshttp.badRequestMessage,
        isLinkExist,
      );
    }
    const inviteToken = generateRandomStrings(10);
    const isoTimeStamp = getFutureTimestamp(expiredAt as TTIMESTRING);
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
}

export const groupsController = (db: DatabaseClient) =>
  new GroupsController(db);
