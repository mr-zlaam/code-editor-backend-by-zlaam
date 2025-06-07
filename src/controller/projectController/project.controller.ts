import { count, and, eq, ne, desc } from "drizzle-orm";
import { folderSchema, projectSchema, type TPROJECT } from "../../db/schemas/";
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
    const { projectName, configuration } = req.body as TPROJECT;
    // ** Handle validation through zod in middleware
    const userId = req.userFromToken!.uid;
    const doesUserHaveProjectWithSameName =
      await this._db.query.project.findFirst({
        where: and(
          eq(projectSchema.userId, userId),
          eq(projectSchema.projectName, projectName),
        ),
      });
    if (doesUserHaveProjectWithSameName) {
      return throwError(reshttp.badRequestCode, "Project name already exists");
    }
    await this._db.insert(projectSchema).values({
      projectName,
      projectNameSlug: generateSlug(projectName),
      userId,
      storage: "0",
      configuration,
      createdBy: userId,
    });
    httpResponse(req, res, reshttp.createdCode, reshttp.createdMessage, {
      message: "Project created successfully",
    });
  });
  public updateProject = asyncHandler(async (req: _Request, res) => {
    const projectId = Number(req.params.id);
    if (isNaN(projectId)) {
      logger.warn("Invalid project ID provided");
      return throwError(reshttp.badRequestCode, "Invalid project ID");
    }

    const {
      projectName: updatedProjectName,
      configuration: updatedConfiguration,
    } = req.body as TPROJECT;
    // TODO: Validate req.body with Zod middleware (projectName?: string, projectDescription?: string)
    logger.info("data", { updatedProjectName, updatedConfiguration });
    const userId = req.userFromToken!.uid;
    const doesUserHaveProjectWithSameName =
      await this._db.query.project.findFirst({
        where: and(
          eq(projectSchema.projectName, updatedProjectName),
          eq(projectSchema.userId, userId),
          ne(projectSchema.id, projectId),
        ),
      });
    if (doesUserHaveProjectWithSameName) {
      return throwError(reshttp.badRequestCode, "Project name already exists");
    }
    await this._db
      .update(projectSchema)
      .set({
        projectName: updatedProjectName,
        configuration: updatedConfiguration,
        projectNameSlug: generateSlug(updatedProjectName),
        updatedAt: new Date(),
      })
      .where(eq(projectSchema.id, projectId));
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
    const checkIfProjectHasFolder = await this._db
      .select()
      .from(folderSchema)
      .where(eq(folderSchema.projectId, projectId));
    if (checkIfProjectHasFolder.length > 0) {
      logger.info("Project cannot be deleted if it has folders");
      return throwError(
        reshttp.badRequestCode,
        "Project cannot be deleted if it has folders",
      );
    }
    await this._db.delete(projectSchema).where(eq(projectSchema.id, projectId));
    httpResponse(req, res, reshttp.okCode, reshttp.okMessage, {
      message: "Project deleted successfully",
    });
  });
  public getAllProjects = asyncHandler(async (req: _Request, res) => {
    const userId = req.userFromToken?.uid;
    if (!userId) {
      logger.warn("Unauthorized attempt to get projects: No user ID found");
      return throwError(reshttp.unauthorizedCode, reshttp.unauthorizedMessage);
    }

    // Parse and validate pagination params (TypeScript-safe)
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const pageSize = Math.min(
      100, // Enforce maximum page size
      Math.max(1, parseInt(req.query.pageSize as string, 10) || 10),
    );

    // Calculate offset
    const offset = (page - 1) * pageSize;

    // Parallelize count and data fetching
    const [countPromise, projectsPromise] = await Promise.all([
      this._db
        .select({ count: count() })
        .from(projectSchema)
        .where(eq(projectSchema.userId, userId)),

      this._db.query.project.findMany({
        where: eq(projectSchema.userId, userId),
        orderBy: desc(projectSchema.createdAt),
        offset,
        limit: pageSize,
      }),
    ]);

    const totalRecord = Number(countPromise[0]?.count ?? 0);
    const totalPage = Math.ceil(totalRecord / pageSize);

    const projects = projectsPromise.map((project, index) => ({
      ...project,
      projectNo: offset + index + 1,
    }));

    // Response structure
    httpResponse(req, res, reshttp.okCode, reshttp.okMessage, {
      message: "Projects retrieved successfully",
      projects,
      pagination: {
        currentPage: page,
        pageSize,
        totalPage,
        totalRecord,
        hasNextPage: page < totalPage,
        hasPreviousPage: page > 1,
      } satisfies IPAGINATION,
    });
  });
}

export const projectController = (db: DatabaseClient) =>
  new ProjectController(db);
