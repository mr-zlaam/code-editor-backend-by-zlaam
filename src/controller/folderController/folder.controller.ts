import { and, eq } from "drizzle-orm";
import {
  folderSchema,
  projectSchema,
  workspaceSchema,
  type TFOLDER,
} from "../../db/schemas/";
import { asyncHandler } from "../../util/globalUtil/asyncHandler.util";
import { httpResponse } from "../../util/globalUtil/apiResponse.util";
import { throwError } from "../../util/globalUtil/throwError.util";
import reshttp from "reshttp";
import type { DatabaseClient } from "../../db/db";
import logger from "../../util/globalUtil/logger.util";
import type { _Request } from "../../middleware/globalMiddleware/auth.middleware";

interface IPAGINATION {
  currentPage: number;
  pageSize: number;
  totalPage: number;
  totalRecord: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

class FolderController {
  private readonly _db: DatabaseClient;

  constructor(db: DatabaseClient) {
    this._db = db;
  }

  // Create a new folder
  public createFolder = asyncHandler(async (req: _Request, res) => {
    // TODO: Validate req.body with Zod middleware (folderName: string, workspaceId: number, parentFolderId?: number)
    const { folderName, workspaceId, parentFolderId } = req.body as TFOLDER;
    const parsedWorkspaceId = parseInt(workspaceId as unknown as string, 10);
    const parsedParentFolderId = parentFolderId
      ? parseInt(parentFolderId as unknown as string, 10)
      : undefined;

    // Ensure user is authenticated
    const userId = req.userFromToken?.uid;
    if (!userId) {
      logger.warn("Unauthorized attempt to create folder: No user ID found");
      return throwError(reshttp.unauthorizedCode, reshttp.unauthorizedMessage);
    }

    if (isNaN(parsedWorkspaceId)) {
      logger.warn("Invalid workspace ID provided");
      return throwError(reshttp.badRequestCode, "Invalid workspace ID");
    }

    // Validate workspace exists and belongs to user
    const workspace = await this._db.query.workspace.findFirst({
      where: and(
        eq(workspaceSchema.id, parsedWorkspaceId),
        eq(projectSchema.userId, userId),
      ),
      with: { project: true },
    });

    if (!workspace) {
      logger.warn(
        `Workspace ${parsedWorkspaceId} not found for user ${userId}`,
      );
      return throwError(reshttp.notFoundCode, "Workspace not found");
    }

    // Validate parentFolderId if provided
    if (parsedParentFolderId !== undefined) {
      if (isNaN(parsedParentFolderId)) {
        logger.warn("Invalid parent folder ID provided");
        return throwError(reshttp.badRequestCode, "Invalid parent folder ID");
      }

      const parentFolder = await this._db.query.folder.findFirst({
        where: and(
          eq(folderSchema.id, parsedParentFolderId),
          eq(folderSchema.workspaceId, parsedWorkspaceId),
        ),
      });

      if (!parentFolder) {
        logger.warn(
          `Parent folder ${parsedParentFolderId} not found in workspace ${parsedWorkspaceId}`,
        );
        return throwError(reshttp.notFoundCode, "Parent folder not found");
      }
    }

    // Insert new folder
    await this._db
      .insert(folderSchema)
      .values({
        folderName,
        workspaceId: parsedWorkspaceId,
        parentFolderId: parsedParentFolderId ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    logger.info(
      `Folder created in workspace ${parsedWorkspaceId} by user ${userId}`,
    );

    httpResponse(req, res, reshttp.createdCode, reshttp.createdMessage, {
      message: "Folder created successfully",
    });
  });

  // List all folders with pagination, filtered by workspaceId and optional parentFolderId
  public getAllFolders = asyncHandler(async (req: _Request, res) => {
    // TODO: Validate req.query.workspaceId, req.query.page, req.query.pageSize, and req.query.parentFolderId with Zod middleware
    const userId = req.userFromToken?.uid;
    if (!userId) {
      logger.warn("Unauthorized attempt to get folders: No user ID found");
      return throwError(reshttp.unauthorizedCode, reshttp.unauthorizedMessage);
    }

    // Parse query parameters
    const workspaceId = parseInt(req.query.workspaceId as string, 10);
    const page = parseInt(req.query.page as string, 10) || 1;
    const pageSize = parseInt(req.query.pageSize as string, 10) || 10;
    const parentFolderId = req.query.parentFolderId
      ? parseInt(req.query.parentFolderId as string, 10)
      : undefined;

    if (isNaN(workspaceId)) {
      logger.warn("Invalid workspace ID provided");
      return throwError(reshttp.badRequestCode, "Invalid workspace ID");
    }

    // Validate workspace exists and belongs to user
    const workspace = await this._db.query.workspace.findFirst({
      where: and(
        eq(workspaceSchema.id, workspaceId),
        eq(projectSchema.userId, userId),
      ),
      with: { project: true },
    });

    if (!workspace) {
      logger.warn(`Workspace ${workspaceId} not found for user ${userId}`);
      return throwError(reshttp.notFoundCode, "Workspace not found");
    }

    // Build where clause as an array of conditions
    const conditions = [eq(folderSchema.workspaceId, workspaceId)];
    if (parentFolderId !== undefined) {
      if (isNaN(parentFolderId)) {
        logger.warn("Invalid parent folder ID provided");
        return throwError(reshttp.badRequestCode, "Invalid parent folder ID");
      }
      conditions.push(eq(folderSchema.parentFolderId, parentFolderId));
    }
    const whereClause = and(...conditions);

    // Fetch total count
    const totalRecord = await this._db.query.folder
      .findMany({
        where: whereClause,
      })
      .then((folders) => folders.length);

    const totalPage = Math.ceil(totalRecord / pageSize);

    // Fetch paginated folders
    const folders = await this._db.query.folder.findMany({
      where: whereClause,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    // Build pagination metadata
    const pagination: IPAGINATION = {
      currentPage: page,
      pageSize,
      totalPage,
      totalRecord,
      hasNextPage: page < totalPage,
      hasPreviousPage: page > 1,
    };

    logger.info(
      `Fetched ${folders.length} folders for workspace ${workspaceId} (page ${page}, size ${pageSize}${
        parentFolderId ? `, parent ${parentFolderId}` : ""
      })`,
    );

    httpResponse(req, res, reshttp.okCode, reshttp.okMessage, {
      message: "Folders retrieved successfully",
      folders,
      pagination,
    });
  });

  // Get a specific folder by ID
  public getSingleFolder = asyncHandler(async (req: _Request, res) => {
    // TODO: Validate req.params.id with Zod middleware (id: number)
    const folderId = parseInt(req.params.id, 10);
    if (isNaN(folderId)) {
      logger.warn("Invalid folder ID provided");
      return throwError(reshttp.badRequestCode, "Invalid folder ID");
    }

    // Ensure user is authenticated
    const userId = req.userFromToken?.uid;
    if (!userId) {
      logger.warn("Unauthorized attempt to get folder: No user ID found");
      return throwError(reshttp.unauthorizedCode, reshttp.unauthorizedMessage);
    }

    // Fetch folder
    const folder = await this._db.query.folder.findFirst({
      where: eq(folderSchema.id, folderId),
    });

    if (!folder) {
      logger.warn(`Folder ${folderId} not found`);
      return throwError(reshttp.notFoundCode, "Folder not found");
    }

    // Validate workspace belongs to user
    const workspace = await this._db.query.workspace.findFirst({
      where: and(
        eq(workspaceSchema.id, folder.workspaceId),
        eq(projectSchema.userId, userId),
      ),
      with: { project: true },
    });

    if (!workspace) {
      logger.warn(
        `Workspace ${folder.workspaceId} not found for user ${userId}`,
      );
      return throwError(reshttp.notFoundCode, "Folder not found");
    }

    logger.info(`Retrieved folder ${folderId} for user ${userId}`);

    httpResponse(req, res, reshttp.okCode, reshttp.okMessage, {
      message: "Folder retrieved successfully",
      folder,
    });
  });

  // Update a folder
  public updateFolder = asyncHandler(async (req: _Request, res) => {
    // TODO: Validate req.params.id and req.body with Zod middleware (id: number, folderName: string)
    const folderId = parseInt(req.params.id, 10);
    if (isNaN(folderId)) {
      logger.warn("Invalid folder ID provided");
      return throwError(reshttp.badRequestCode, "Invalid folder ID");
    }

    const { folderName } = req.body as TFOLDER;

    // Ensure user is authenticated
    const userId = req.userFromToken?.uid;
    if (!userId) {
      logger.warn("Unauthorized attempt to update folder: No user ID found");
      return throwError(reshttp.unauthorizedCode, reshttp.unauthorizedMessage);
    }

    // Fetch folder
    const existingFolder = await this._db.query.folder.findFirst({
      where: eq(folderSchema.id, folderId),
    });

    if (!existingFolder) {
      logger.warn(`Folder ${folderId} not found`);
      return throwError(reshttp.notFoundCode, "Folder not found");
    }

    // Validate workspace belongs to user
    const workspace = await this._db.query.workspace.findFirst({
      where: and(
        eq(workspaceSchema.id, existingFolder.workspaceId),
        eq(projectSchema.userId, userId),
      ),
      with: { project: true },
    });

    if (!workspace) {
      logger.warn(
        `Workspace ${existingFolder.workspaceId} not found for user ${userId}`,
      );
      return throwError(reshttp.notFoundCode, "Folder not found");
    }

    // Update folder
    await this._db
      .update(folderSchema)
      .set({
        folderName,
        updatedAt: new Date(),
      })
      .where(eq(folderSchema.id, folderId))
      .returning();

    logger.info(`Updated folder ${folderId} for user ${userId}`);

    httpResponse(req, res, reshttp.okCode, reshttp.okMessage, {
      message: "Folder updated successfully",
    });
  });

  // Delete a folder
  public deleteFolder = asyncHandler(async (req: _Request, res) => {
    // TODO: Validate req.params.id with Zod middleware (id: number)
    const folderId = parseInt(req.params.id, 10);
    if (isNaN(folderId)) {
      logger.warn("Invalid folder ID provided");
      return throwError(reshttp.badRequestCode, "Invalid folder ID");
    }

    // Ensure user is authenticated
    const userId = req.userFromToken?.uid;
    if (!userId) {
      logger.warn("Unauthorized attempt to delete folder: No user ID found");
      return throwError(reshttp.unauthorizedCode, reshttp.unauthorizedMessage);
    }

    // Fetch folder
    const existingFolder = await this._db.query.folder.findFirst({
      where: eq(folderSchema.id, folderId),
    });

    if (!existingFolder) {
      logger.warn(`Folder ${folderId} not found`);
      return throwError(reshttp.notFoundCode, "Folder not found");
    }

    // Validate workspace belongs to user
    const workspace = await this._db.query.workspace.findFirst({
      where: and(
        eq(workspaceSchema.id, existingFolder.workspaceId),
        eq(projectSchema.userId, userId),
      ),
      with: { project: true },
    });

    if (!workspace) {
      logger.warn(
        `Workspace ${existingFolder.workspaceId} not found for user ${userId}`,
      );
      return throwError(reshttp.notFoundCode, "Folder not found");
    }

    // Delete folder (cascades to subfolders)
    await this._db.delete(folderSchema).where(eq(folderSchema.id, folderId));

    logger.info(`Deleted folder ${folderId} for user ${userId}`);

    httpResponse(req, res, reshttp.okCode, reshttp.okMessage, {
      message: "Folder deleted successfully",
    });
  });
}

export const folderController = (db: DatabaseClient) =>
  new FolderController(db);
