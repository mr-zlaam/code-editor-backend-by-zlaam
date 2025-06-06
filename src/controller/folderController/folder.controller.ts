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
    await this._db.insert(folderSchema).values({
      fileName,
      projectId: intProjectId,
      fileNameSlug: generateSlug(fileName),
      createdBy: userId,
      projectLink: `http://localhost:${port}`,
      tech,
      status: "RUNNING",
      storage: "DOCKER",
    });
    return httpResponse(req, res, reshttp.okCode, reshttp.okMessage, {
      message: "Folder created successfully",
      projectLink: `http://localhost:${port}`,
    });
  });
}

export const folderController = (db: DatabaseClient) =>
  new FolderController(db);
