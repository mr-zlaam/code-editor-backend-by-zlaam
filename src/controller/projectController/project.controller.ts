import { count, and, eq } from "drizzle-orm";
import {
  codeContainerSchema,
  projectSchema,
  type TPROJECT,
} from "../../db/schemas/";
import { asyncHandler } from "../../util/globalUtil/asyncHandler.util";
import { httpResponse } from "../../util/globalUtil/apiResponse.util";
import { throwError } from "../../util/globalUtil/throwError.util";
import reshttp from "reshttp";
import type { DatabaseClient } from "../../db/db";
import logger from "../../util/globalUtil/logger.util";
import type { _Request } from "../../middleware/globalMiddleware/auth.middleware";
import type { IPAGINATION } from "../../type/types";
import { generateSlug } from "../../util/quickUtil/slugStringGenerator.util";

class ProjectController {
  private readonly _db: DatabaseClient;

  constructor(db: DatabaseClient) {
    this._db = db;
  }

  // Create a new project
  public createProject = asyncHandler(async (req: _Request, res) => {
    // TODO: Validate req.body with Zod middleware (projectName: string, projectDescription?: string)
    const { projectName, projectDescription } = req.body as TPROJECT;
    if (projectName === "" || projectName.length < 3) {
      return throwError(
        reshttp.badRequestCode,
        "Project name must be at least 3 characters long",
      );
    }

    // Ensure user is authenticated (uid from JWT middleware)
    const userId = req.userFromToken?.uid;
    if (!userId) {
      logger.warn("Unauthorized attempt to create project: No user ID found");
      return throwError(reshttp.unauthorizedCode, reshttp.unauthorizedMessage);
    }
    const checkIfProjectWithSameNameAlreadyExists = await this._db
      .select()
      .from(projectSchema)
      .where(eq(projectSchema.projectName, projectName));
    if (checkIfProjectWithSameNameAlreadyExists.length > 0) {
      logger.info("Project with same name already exists for user");
      return throwError(reshttp.conflictCode, reshttp.conflictMessage);
    }

    await this._db.transaction(async (tx) => {
      const [createdProject] = await tx
        .insert(projectSchema)
        .values({
          projectName: projectName,
          projectDescription,
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      await tx.insert(codeContainerSchema).values({
        codeContainerName: generateSlug(createdProject.projectName),
        projectId: createdProject.id,
        containerId: "",
        containerStatus: "STOPPED",
        createdAt: new Date(),
        environmentConfig: "",
      });
    });

    logger.info(`Project created:  for user ${userId}`);

    httpResponse(req, res, reshttp.createdCode, reshttp.createdMessage, {
      message: "Project created successfully",
    });
  });

  // Get a specific project by ID
  public getSingleProject = asyncHandler(async (req: _Request, res) => {
    // TODO: Validate req.params.id with Zod middleware (id: number)
    const projectId = parseInt(req.params.id, 10);
    if (isNaN(projectId)) {
      logger.warn("Invalid project ID provided");
      return throwError(reshttp.badRequestCode, "Invalid project ID");
    }

    // Ensure user is authenticated
    const userId = req.userFromToken?.uid;
    if (!userId) {
      logger.warn("Unauthorized attempt to get project: No user ID found");
      return throwError(reshttp.unauthorizedCode, reshttp.unauthorizedMessage);
    }

    const project = await this._db.query.project.findFirst({
      where: and(
        eq(projectSchema.id, Number(projectId)),
        eq(projectSchema.userId, userId),
      ),
      with: { codeContainers: true },
    });
    if (!project) {
      logger.warn(`Project ${projectId} not found for user ${userId}`);
      throwError(reshttp.notFoundCode, "Project not found");
    }

    logger.info(`Retrieved project ${projectId} for user ${userId}`);

    httpResponse(req, res, reshttp.okCode, reshttp.okMessage, {
      message: "Project retrieved successfully",
      data: { project },
    });
  });

  // Update a project
  public updateProject = asyncHandler(async (req: _Request, res) => {
    // TODO: Validate req.params.id and req.body with Zod middleware (id: number, projectName?: string, projectDescription?: string)
    const projectId = parseInt(req.params.id, 10);
    if (isNaN(projectId)) {
      logger.warn("Invalid project ID provided");
      return throwError(reshttp.badRequestCode, "Invalid project ID");
    }

    const { projectName, projectDescription } = req.body as Partial<TPROJECT>;

    // Ensure user is authenticated
    const userId = req.userFromToken?.uid;
    if (!userId) {
      logger.warn("Unauthorized attempt to update project: No user ID found");
      return throwError(reshttp.unauthorizedCode, reshttp.unauthorizedMessage);
    }

    // Check if project exists and belongs to user
    const [existingProject] = await this._db
      .select()
      .from(projectSchema)
      .where(
        and(
          eq(projectSchema.id, Number(projectId)),
          eq(projectSchema.userId, userId),
        ),
      )
      .limit(1);

    if (!existingProject) {
      logger.warn(`Project ${projectId} not found for user ${userId}`);
      return throwError(reshttp.notFoundCode, "Project not found");
    }

    // Update project
    await this._db
      .update(projectSchema)
      .set({
        projectName: projectName ?? existingProject.projectName,
        projectDescription:
          projectDescription ?? existingProject.projectDescription,
        updatedAt: new Date(),
      })
      .where(eq(projectSchema.id, projectId))
      .returning();

    logger.info(`Updated project ${projectId} for user ${userId}`);

    httpResponse(req, res, reshttp.okCode, reshttp.okMessage, {
      message: "Project updated successfully",
    });
  });

  // Delete a project
  public deleteProject = asyncHandler(async (req: _Request, res) => {
    // TODO: Validate req.params.id with Zod middleware (id: number)
    const projectId = parseInt(req.params.id, 10);
    if (isNaN(projectId)) {
      logger.warn("Invalid project ID provided");
      return throwError(reshttp.badRequestCode, "Invalid project ID");
    }

    // Ensure user is authenticated
    const userId = req.userFromToken?.uid;
    if (!userId) {
      logger.warn("Unauthorized attempt to delete project: No user ID found");
      return throwError(reshttp.unauthorizedCode, reshttp.unauthorizedMessage);
    }

    // Check if project exists and belongs to user
    const [existingProject] = await this._db
      .select()
      .from(projectSchema)
      .where(
        and(
          eq(projectSchema.id, Number(projectId)),
          eq(projectSchema.userId, userId),
        ),
      )
      .limit(1);

    if (!existingProject) {
      logger.warn(`Project ${projectId} not found for user ${userId}`);
      return throwError(reshttp.notFoundCode, "Project not found");
    }

    // Delete project (cascades to workspaces and containers)
    await this._db.delete(projectSchema).where(eq(projectSchema.id, projectId));

    logger.info(`Deleted project ${projectId} for user ${userId}`);

    httpResponse(req, res, reshttp.okCode, reshttp.okMessage, {
      message: "Project deleted successfully",
    });
  });
  public getAllProjects = asyncHandler(async (req: _Request, res) => {
    // TODO: Validate req.query.page and req.query.pageSize with Zod middleware (page: number, pageSize: number)
    const userId = req.userFromToken?.uid;
    if (!userId) {
      logger.warn("Unauthorized attempt to get projects: No user ID found");
      return throwError(reshttp.unauthorizedCode, reshttp.unauthorizedMessage);
    }

    // Parse query parameters
    const page = parseInt(req.query.page as string, 10) || 1;
    const pageSize = parseInt(req.query.pageSize as string, 10) || 10;

    // Calculate offset
    const offset = (page - 1) * pageSize;

    // Fetch total count of projects
    const [counts] = await this._db
      .select({ count: count(projectSchema.id) })
      .from(projectSchema)
      .where(eq(projectSchema.userId, userId));

    const totalRecord = Number(counts);
    const totalPage = Math.ceil(totalRecord / pageSize);

    // Fetch paginated projects
    const projects = await this._db.query.project.findMany({
      where: eq(projectSchema.userId, userId),
      offset,
      limit: pageSize,
      with: {
        codeContainers: true,
      },
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
      `Fetched ${projects.length} projects for user ${userId} (page ${page}, size ${pageSize})`,
    );

    httpResponse(req, res, reshttp.okCode, reshttp.okMessage, {
      message: "Projects retrieved successfully",
      projects: { ...projects },
      pagination,
    });
  });
}

export const projectController = (db: DatabaseClient) =>
  new ProjectController(db);
