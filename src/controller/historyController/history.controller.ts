import { and, count, eq } from "drizzle-orm";
import type { DatabaseClient } from "../../db/db";
import type { _Request } from "../../middleware/globalMiddleware/auth.middleware";
import { asyncHandler } from "../../util/globalUtil/asyncHandler.util";
import { historySchema } from "../../db/schemas/historySchema";
import appConstant from "../../constant/app.constant";
import { httpResponse } from "../../util/globalUtil/apiResponse.util";
import reshttp from "reshttp";
import type { IPAGINATION } from "../../type/types";

class HistoryController {
  private readonly _db: DatabaseClient;
  constructor(db: DatabaseClient) {
    this._db = db;
  }
  public getAllHistoryHistory = asyncHandler(async (req: _Request, res) => {
    const folderId = Number(req.params.folderId);
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;

    const totalRecord = await this._db
      .select({ count: count() })
      .from(historySchema)
      .where(eq(historySchema.folderId, folderId));

    const totalCount = totalRecord[0].count || 0;
    const totalPage = Math.ceil(totalCount / pageSize);

    const history = await this._db.query.history.findMany({
      where: and(eq(historySchema.folderId, folderId)),
      with: { user: { columns: appConstant.SELECTED_COLUMNS.FROM.USER } },
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    const pagination: IPAGINATION = {
      currentPage: page,
      pageSize: pageSize,
      totalPage: totalPage,
      totalRecord: totalCount,
      hasNextPage: page < totalPage,
      hasPreviousPage: page > 1,
    };

    httpResponse(req, res, reshttp.okCode, reshttp.okMessage, {
      message: "History fetched successfully",
      history,
      pagination,
    });
  });
}
export const historyController = (db: DatabaseClient) =>
  new HistoryController(db);
