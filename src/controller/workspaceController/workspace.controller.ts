import { and, eq } from "drizzle-orm";
import {
  projectSchema,
  workspaceSchema,
  type TWORKSPACE,
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

class WorkspaceController {
  private readonly _db: DatabaseClient;

  constructor(db: DatabaseClient) {
    this._db = db;
  }

  // Create a new workspace
  public createWorkspace = asyncHandler(async (req: _Request, res) => {
    // TODO: Validate req.body with Zod middleware (workspaceName: string, projectId: number, workspaceDescription?: string)
    const {
      workspaceName,
      projectId: stringProjectId,
      workspaceDescription,
    } = req.body as TWORKSPACE;
    const projectId = Number(stringProjectId);
    // Ensure user is authenticated
    const userId = req.userFromToken?.uid;
    if (!userId) {
      logger.warn("Unauthorized attempt to create workspace: No user ID found");
      return throwError(reshttp.unauthorizedCode, reshttp.unauthorizedMessage);
    }

    // Validate project exists and belongs to user
    const project = await this._db.query.project.findFirst({
      where: and(
        eq(projectSchema.id, projectId),
        eq(projectSchema.userId, userId),
      ),
    });

    if (!project) {
      logger.warn(`Project ${projectId} not found for user ${userId}`);
      return throwError(reshttp.notFoundCode, "Project not found");
    }

    // Insert new workspace
    await this._db
      .insert(workspaceSchema)
      .values({
        workspaceName,
        projectId,
        workspaceDescription,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    logger.info(`Workspace created for project ${projectId} by user ${userId}`);

    httpResponse(req, res, reshttp.createdCode, reshttp.createdMessage, {
      message: "Workspace created successfully",
    });
  });

  // List all workspaces with pagination, optionally filtered by projectId
  public getAllWorkspaces = asyncHandler(async (req: _Request, res) => {
    // TODO: Validate req.query.page, req.query.pageSize, and req.query.projectId with Zod middleware
    const userId = req.userFromToken?.uid;
    if (!userId) {
      logger.warn("Unauthorized attempt to get workspaces: No user ID found");
      return throwError(reshttp.unauthorizedCode, reshttp.unauthorizedMessage);
    }

    // Parse query parameters
    const page = parseInt(req.query.page as string, 10) || 1;
    const pageSize = parseInt(req.query.pageSize as string, 10) || 10;
    const projectId = req.query.projectId
      ? parseInt(req.query.projectId as string, 10)
      : undefined;

    // Calculate offset
    const offset = (page - 1) * pageSize;

    // Build where clause
    const whereClause =
      projectId && !isNaN(projectId)
        ? and(
            eq(workspaceSchema.projectId, projectId),
            eq(projectSchema.userId, userId),
          )
        : eq(projectSchema.userId, userId);

    // Fetch total count
    const totalRecord = await this._db.query.workspace
      .findMany({
        where: whereClause,
        with: { project: true },
      })
      .then((workspaces) => workspaces.length);

    const totalPage = Math.ceil(totalRecord / pageSize);

    // Fetch paginated workspaces
    const workspaces = await this._db.query.workspace.findMany({
      where: whereClause,
      with: { project: true },
      limit: pageSize,
      offset,
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
      `Fetched ${workspaces.length} workspaces for user ${userId} (page ${page}, size ${pageSize}${
        projectId ? `, project ${projectId}` : ""
      })`,
    );

    httpResponse(req, res, reshttp.okCode, reshttp.okMessage, {
      message: "Workspaces retrieved successfully",
      workspaces,
      pagination,
    });
  });

  // Get a specific workspace by ID
  public getSingleWorkspace = asyncHandler(async (req: _Request, res) => {
    // TODO: Validate req.params.id with Zod middleware (id: number)
    const workspaceId = parseInt(req.params.id, 10);
    if (isNaN(workspaceId)) {
      logger.warn("Invalid workspace ID provided");
      return throwError(reshttp.badRequestCode, "Invalid workspace ID");
    }

    // Ensure user is authenticated
    const userId = req.userFromToken?.uid;
    if (!userId) {
      logger.warn("Unauthorized attempt to get workspace: No user ID found");
      return throwError(reshttp.unauthorizedCode, reshttp.unauthorizedMessage);
    }

    // Fetch workspace, ensuring it belongs to a project owned by the user
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

    logger.info(`Retrieved workspace ${workspaceId} for user ${userId}`);

    httpResponse(req, res, reshttp.okCode, reshttp.okMessage, {
      message: "Workspace retrieved successfully",
      workspace,
    });
  });

  // Update a workspace
  public updateWorkspace = asyncHandler(async (req: _Request, res) => {
    // TODO: Validate req.params.id and req.body with Zod middleware (id: number, workspaceName?: string, workspaceDescription?: string)
    const workspaceId = parseInt(req.params.id, 10);
    if (isNaN(workspaceId)) {
      logger.warn("Invalid workspace ID provided");
      return throwError(reshttp.badRequestCode, "Invalid workspace ID");
    }

    const { workspaceName, workspaceDescription } =
      req.body as Partial<TWORKSPACE>;

    // Ensure user is authenticated
    const userId = req.userFromToken?.uid;
    if (!userId) {
      logger.warn("Unauthorized attempt to update workspace: No user ID found");
      return throwError(reshttp.unauthorizedCode, reshttp.unauthorizedMessage);
    }

    // Check if workspace exists and belongs to a project owned by user
    const existingWorkspace = await this._db.query.workspace.findFirst({
      where: and(
        eq(workspaceSchema.id, workspaceId),
        eq(projectSchema.userId, userId),
      ),
      with: { project: true },
    });

    if (!existingWorkspace) {
      logger.warn(`Workspace ${workspaceId} not found for user ${userId}`);
      return throwError(reshttp.notFoundCode, "Workspace not found");
    }

    // Update workspace
    await this._db
      .update(workspaceSchema)
      .set({
        workspaceName: workspaceName ?? existingWorkspace.workspaceName,
        workspaceDescription:
          workspaceDescription ?? existingWorkspace.workspaceDescription,
        updatedAt: new Date(),
      })
      .where(eq(workspaceSchema.id, workspaceId))
      .returning();

    logger.info(`Updated workspace ${workspaceId} for user ${userId}`);

    httpResponse(req, res, reshttp.okCode, reshttp.okMessage, {
      message: "Workspace updated successfully",
    });
  });

  // Delete a workspace
  public deleteWorkspace = asyncHandler(async (req: _Request, res) => {
    // TODO: Validate req.params.id with Zod middleware (id: number)
    const workspaceId = parseInt(req.params.id, 10);
    if (isNaN(workspaceId)) {
      logger.warn("Invalid workspace ID provided");
      return throwError(reshttp.badRequestCode, "Invalid workspace ID");
    }

    // Ensure user is authenticated
    const userId = req.userFromToken?.uid;
    if (!userId) {
      logger.warn("Unauthorized attempt to delete workspace: No user ID found");
      return throwError(reshttp.unauthorizedCode, reshttp.unauthorizedMessage);
    }

    // Check if workspace exists and belongs to a project owned by user
    const existingWorkspace = await this._db.query.workspace.findFirst({
      where: and(
        eq(workspaceSchema.id, workspaceId),
        eq(projectSchema.userId, userId),
      ),
      with: { project: true },
    });

    if (!existingWorkspace) {
      logger.warn(`Workspace ${workspaceId} not found for user ${userId}`);
      return throwError(reshttp.notFoundCode, "Workspace not found");
    }

    // Delete workspace (cascades to folders, sets workspaceId to null in containers)
    await this._db
      .delete(workspaceSchema)
      .where(eq(workspaceSchema.id, workspaceId));

    logger.info(`Deleted workspace ${workspaceId} for user ${userId}`);

    httpResponse(req, res, reshttp.okCode, reshttp.okMessage, {
      message: "Workspace deleted successfully",
    });
  });
}

export const workspaceController = (db: DatabaseClient) =>
  new WorkspaceController(db);
