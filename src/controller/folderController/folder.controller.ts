import { returnDockerConfig } from "../../config/container.config";
import type { DatabaseClient } from "../../db/db";
import { folderSchema, type IFOLDER } from "../../db/schemas";
import type { _Request } from "../../middleware/globalMiddleware/auth.middleware";
import { asyncHandler } from "../../util/globalUtil/asyncHandler.util";
import Docker from "dockerode";
import getPort from "get-port";
import { generateSlug } from "../../util/quickUtil/slugStringGenerator.util";
import { httpResponse } from "../../util/globalUtil/apiResponse.util";
import reshttp from "reshttp";
import { throwError } from "../../util/globalUtil/throwError.util";
import logger from "../../util/globalUtil/logger.util";
import { and, eq } from "drizzle-orm";
import { historySchema } from "../../db/schemas/historySchema";
class FolderController {
  private readonly _db: DatabaseClient;
  private _docker: Docker;

  constructor(db: DatabaseClient) {
    this._db = db;
    this._docker = new Docker();
  }

  // Create a new folder

  public createFolder = asyncHandler(async (req: _Request, res) => {
    const userId = req.userFromToken!.uid;
    const { fileName, projectId, tech } = req.body as IFOLDER;
    const intProjectId = Number(projectId);
    const checkIfCurrentProjectHasFolderWithSameName =
      await this._db.query.folder.findFirst({
        where: and(
          eq(folderSchema.projectId, intProjectId),
          eq(folderSchema.fileName, fileName),
        ),
      });
    if (checkIfCurrentProjectHasFolderWithSameName) {
      logger.info("Folder already exists");
      return throwError(reshttp.badRequestCode, reshttp.badRequestMessage);
    }
    const port = await getPort();
    const containerConfig = returnDockerConfig(
      port,
      userId.split("-")[0],
      fileName,
      tech,
    );
    const dockerContainer = await this._docker.createContainer(containerConfig);
    await dockerContainer.start();
    const [folder] = await this._db
      .insert(folderSchema)
      .values({
        fileName,
        projectId: intProjectId,
        fileNameSlug: generateSlug(fileName),
        createdBy: userId,
        containerId: dockerContainer.id,
        projectLink: `http://localhost:${port}`,
        tech,
        status: "RUNNING",
        storage: "DOCKER",
      })
      .returning();
    await this._db.insert(historySchema).values({
      userId,
      folderId: folder.id,
      enterAt: new Date(),
      exitAt: null,
    });
    return httpResponse(req, res, reshttp.okCode, reshttp.okMessage, {
      message: "Folder created successfully",
      projectLink: `http://localhost:${port}`,
    });
  });
  // Get all folders
  public getAllFolders = asyncHandler(async (req: _Request, res) => {
    const projectId = Number(req.params.projectId);
    if (!projectId) {
      logger.info("Project id not found");
      return throwError(reshttp.badRequestCode, reshttp.badRequestMessage);
    }
    const folders = await this._db.query.folder.findMany({
      where: eq(folderSchema.projectId, projectId),
    });
    return httpResponse(req, res, reshttp.okCode, reshttp.okMessage, {
      folders,
    });
  });

  // Stop project under single folder
  public stopProjectUnderFolder = asyncHandler(async (req: _Request, res) => {
    const userId = req.userFromToken!.uid;
    const folderId = Number(req.params.folderId);
    const { containerId, projectId, historyId } = req.query as {
      containerId: string;
      projectId: string;
      historyId: string;
    };
    if (!containerId) {
      logger.info("Container id not found");
      return throwError(reshttp.badRequestCode, reshttp.badRequestMessage);
    }
    if (!folderId) {
      logger.info("Folder id not found");
      return throwError(reshttp.badRequestCode, reshttp.badRequestMessage);
    }
    const folder = await this._db.query.folder.findFirst({
      where: and(
        eq(folderSchema.id, folderId),
        eq(folderSchema.containerId, containerId),
        eq(folderSchema.projectId, Number(projectId)),
      ),
    });
    if (!folder) {
      logger.info("Folder not found");
      return throwError(reshttp.notFoundCode, reshttp.notFoundMessage);
    }
    const dockerContainer = this._docker.getContainer(folder.containerId);
    await dockerContainer.stop();
    await this._db
      .update(historySchema)
      .set({
        exitAt: new Date(),
      })
      .where(
        and(
          eq(historySchema.id, Number(historyId)),
          eq(historySchema.userId, userId),
        ),
      );
    await this._db
      .update(folderSchema)
      .set({
        status: "STOPPED",
      })
      .where(eq(folderSchema.id, folderId));
    return httpResponse(req, res, reshttp.okCode, reshttp.okMessage, {
      message: "Project stopped successfully",
    });
  });
  // Open Project in vs code if the project is at stop position first start it and then open it

  public openProjectInVsCode = asyncHandler(async (req: _Request, res) => {
    const folderId = Number(req.params.folderId);
    const { containerId } = req.query as {
      containerId: string;
    };
    const userId: string = req.userFromToken!.uid;
    if (!containerId) {
      logger.info("Container id not found");
      return throwError(reshttp.badRequestCode, reshttp.badRequestMessage);
    }
    if (!folderId) {
      logger.info("Folder id not found");
      return throwError(reshttp.badRequestCode, reshttp.badRequestMessage);
    }
    const folder = await this._db.query.folder.findFirst({
      where: eq(folderSchema.id, folderId),
    });
    if (!folder) {
      logger.info("Folder not found");
      return throwError(reshttp.notFoundCode, reshttp.notFoundMessage);
    }
    const projectStatus = folder.status;
    const dockerContainer = this._docker.getContainer(folder.containerId);
    if (!dockerContainer) {
      logger.info("Docker container not found");
      return throwError(reshttp.notFoundCode, reshttp.notFoundMessage);
    }
    if (projectStatus === "STOPPED") {
      await dockerContainer.start();
      await this._db.insert(historySchema).values({
        userId,
        folderId,
        enterAt: new Date(),
        exitAt: null,
      });
      await this._db.update(folderSchema).set({
        status: "RUNNING",
      });
      return httpResponse(req, res, reshttp.okCode, reshttp.okMessage, {
        message: "Project opened successfully",
        projectLink: folder.projectLink,
      });
    }
    if (projectStatus === "RUNNING") {
      return httpResponse(req, res, reshttp.okCode, reshttp.okMessage, {
        message: "Project opened successfully",
        projectLink: folder.projectLink,
      });
    }
    return throwError(
      reshttp.internalServerErrorCode,
      reshttp.internalServerErrorMessage,
    );
  });
  // * delete folder
  public deleteFolder = asyncHandler(async (req: _Request, res) => {
    const folderId = Number(req.params.folderId);
    const folder = await this._db.query.folder.findFirst({
      where: eq(folderSchema.id, folderId),
    });
    if (!folder) {
      logger.info("Folder not found");
      return throwError(reshttp.notFoundCode, reshttp.notFoundMessage);
    }
    const dockerContainer = this._docker.getContainer(folder.containerId);
    await dockerContainer.remove();
    await this._db.delete(folderSchema).where(eq(folderSchema.id, folderId));
    return httpResponse(req, res, reshttp.okCode, reshttp.okMessage, {
      message: "Folder deleted successfully",
    });
  });

  // ** Update folderName
  public updateFolderName = asyncHandler(async (req: _Request, res) => {
    const folderId = Number(req.params.folderId);
    const { fileName } = req.body as { fileName: string };
    if (!fileName) {
      logger.info("filename is required");
      throwError(reshttp.badRequestCode, "Filename is required");
    }
    const folder = await this._db.query.folder.findFirst({
      where: eq(folderSchema.id, folderId),
    });
    if (!folder) {
      logger.info("Folder not found");
      return throwError(reshttp.notFoundCode, reshttp.notFoundMessage);
    }
    await this._db
      .update(folderSchema)
      .set({ fileName, fileNameSlug: generateSlug(fileName) })
      .where(eq(folderSchema.id, folderId));
    return httpResponse(req, res, reshttp.okCode, reshttp.okMessage, {
      message: "Folder name updated successfully",
    });
  });
}

export const folderController = (db: DatabaseClient) =>
  new FolderController(db);
