import reshttp from "reshttp";
import type { DatabaseClient } from "../../db/db";
import { httpResponse } from "../../util/globalUtil/apiResponse.util";
import { asyncHandler } from "../../util/globalUtil/asyncHandler.util";
import { and, eq, or, like, sql } from "drizzle-orm";
import { userSchema } from "../../db/schemas";
import type { IPAGINATION } from "../../type/types";
import type { TCURRENTROLE } from "../../db/schemas/shared/enums";
import { throwError } from "../../util/globalUtil/throwError.util";
import appConstant from "../../constant/app.constant";
import type { _Request } from "../../middleware/globalMiddleware/auth.middleware";
import logger from "../../util/globalUtil/logger.util";

class GetUserController {
  private _db: DatabaseClient;
  public constructor(db: DatabaseClient) {
    this._db = db;
  }

  public getAllUser = asyncHandler(async (req, res) => {
    const {
      q,
      role,
      page = 1,
      limit = 10,
    } = req.query as {
      q?: string;
      role?: TCURRENTROLE;
      page?: number;
      limit?: number;
    };

    // Validate and sanitize inputs
    const currentPage = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(Math.max(1, Number(limit) || 10), 100);

    // Build dynamic conditions
    const conditions = [];
    const params: Record<string, unknown> = {};

    if (role) {
      conditions.push(eq(userSchema.role, role));
    }

    if (q !== undefined && q.trim() !== "") {
      const searchTerm = `%${q}%`;
      params.searchTerm = searchTerm;
      conditions.push(
        or(
          like(userSchema.username, sql.placeholder("searchTerm")),
          like(userSchema.fullName, sql.placeholder("searchTerm")),
        ),
      );
    }

    // Build the main query
    const query = this._db
      .select({
        uid: userSchema.uid,
        email: userSchema.email,
        fullName: userSchema.fullName,
        username: userSchema.username,
        role: userSchema.role,
        createdAt: userSchema.createdAt,
        updatedAt: userSchema.updatedAt,
      })
      .from(userSchema)
      .where(conditions.length ? and(...conditions) : undefined)
      .limit(pageSize)
      .offset((currentPage - 1) * pageSize);

    // Execute with parameters only if they exist
    const users = await (params.searchTerm
      ? query.execute(params)
      : query.execute());

    // Total count for pagination
    const countQuery = this._db
      .select({ count: sql<number>`count(*)` })
      .from(userSchema)
      .where(conditions.length ? and(...conditions) : undefined);

    const [{ count: totalRecord }] = await (params.searchTerm
      ? countQuery.execute(params)
      : countQuery.execute());

    const pagination: IPAGINATION = {
      currentPage,
      pageSize,
      totalRecord,
      hasNextPage: currentPage < Math.ceil(totalRecord / pageSize),
      hasPreviousPage: currentPage > 1,
      totalPage: Math.ceil(totalRecord / pageSize),
    };
    httpResponse(req, res, reshttp.okCode, reshttp.okMessage, {
      data: users,
      pagination,
    });
  });
  // ** Get single user with all children table details
  public getSingleUser = asyncHandler(async (req, res) => {
    const { username } = req.params;
    if (!username)
      return throwError(reshttp.badRequestCode, "username is required");
    const user = await this._db.query.users.findFirst({
      where: eq(userSchema.username, username),
      columns: appConstant.SELECTED_COLUMNS.FROM.USER,
      with: {
        projects: {
          with: {
            codeContainers: true,
            workspaces: { with: { folders: true } },
          },
        },
      },
    });
    if (!user) return throwError(reshttp.notFoundCode, "User not found");
    httpResponse(req, res, reshttp.okCode, reshttp.okMessage, { data: user });
  });

  // ** Get current logged In user with all children table details
  public getCurrentUser = asyncHandler(async (req: _Request, res) => {
    const uid = req.userFromToken?.uid;
    if (!uid) {
      logger.warn(
        "uid is not found in the request. Check for unauthorized access",
      );
      return throwError(reshttp.badRequestCode, reshttp.badRequestMessage);
    }
    const user = await this._db.query.users.findFirst({
      where: eq(userSchema.uid, uid),
      columns: appConstant.SELECTED_COLUMNS.FROM.USER,
    });
    httpResponse(req, res, reshttp.okCode, reshttp.okMessage, { user });
  });
}
export const getUserController = (db: DatabaseClient) =>
  new GetUserController(db);
export default getUserController;
