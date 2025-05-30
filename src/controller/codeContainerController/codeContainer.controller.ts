import { and, eq } from "drizzle-orm";
import type { DatabaseClient } from "../../db/db";
import type { _Request } from "../../middleware/globalMiddleware/auth.middleware";
import { asyncHandler } from "../../util/globalUtil/asyncHandler.util";
import Docker from "dockerode";
import { codeContainerSchema, projectSchema } from "../../db/schemas";
import { throwError } from "../../util/globalUtil/throwError.util";
import reshttp from "reshttp";
import logger from "../../util/globalUtil/logger.util";
import { generatePort } from "../../util/quickUtil/slugStringGenerator.util";
import { httpResponse } from "../../util/globalUtil/apiResponse.util";
import net from "net";
import { returnDockerConfig } from "../../config/app.config";

class CodeContainerController {
  private _docker: Docker;
  private _db: DatabaseClient;
  constructor(db: DatabaseClient) {
    this._db = db;
    this._docker = new Docker();
  }
  public runCodeContainer = asyncHandler(async (req: _Request, res) => {
    const { codeContainerId } = req.params;
    const userId = req.userFromToken!.uid;
    if (!codeContainerId) {
      logger.info("Code container id is required!");
      return throwError(reshttp.badRequestCode, reshttp.badRequestMessage);
    }
    const intContainerId = Number(codeContainerId);
    const { projectId } = req.query as { projectId: string };
    if (!projectId) {
      logger.info("Project id is required!");
      return throwError(reshttp.badRequestCode, reshttp.badRequestMessage);
    }
    const intProjectId = Number(projectId);
    const stoppedContainer = await this._db.query.codeContainer.findFirst({
      where: and(
        eq(codeContainerSchema.id, intContainerId),
        eq(codeContainerSchema.projectId, intProjectId),
      ),
    });
    //** user can't create or run the container if any other container connected to him is already running */
    if (!stoppedContainer) {
      logger.info("Container not found");
      return throwError(reshttp.notFoundCode, reshttp.notFoundMessage);
    }
    const getProjectWithContainerRunning =
      await this._db.query.project.findFirst({
        where: and(
          eq(projectSchema.userId, userId),
          eq(projectSchema.id, intProjectId),
        ),
        with: { codeContainers: { columns: { containerStatus: true } } },
      });
    if (
      getProjectWithContainerRunning?.codeContainers.containerStatus ===
      "RUNNING"
    ) {
      logger.info(
        "Container is already running. Since user can run only one container at one time",
      );
      return throwError(
        reshttp.badRequestCode,
        "An another container is running from your quota",
      );
    }
    // Check for a free port starting from generated port
    let port = generatePort(stoppedContainer.codeContainerName);
    const maxPort = 60999;
    const findFreePort = new Promise<number>((resolve, reject) => {
      const server = net.createServer();
      const tryPort = (currentPort: number) => {
        if (currentPort > maxPort) {
          reject(new Error("No available ports in range"));
          return;
        }
        server.listen(currentPort, () => {
          server.close(() => resolve(currentPort));
        });
        server.on("error", () => {
          tryPort(currentPort + 1);
        });
      };
      tryPort(port);
    });
    port = await findFreePort;
    const containerConfig = returnDockerConfig(stoppedContainer, port);
    // Check if a container with the same name exists and remove it
    const existingContainer = this._docker.getContainer(
      stoppedContainer.codeContainerName,
    );
    await existingContainer
      .inspect()
      .then(async () => {
        await existingContainer.remove({ force: true });
        logger.info(
          `Cleaned up existing container ${stoppedContainer.codeContainerName}`,
        );
      })
      .catch(() => {
        // Ignore if container doesn't exist
      });
    // Create and start new container
    const dockerContainer = await this._docker.createContainer(containerConfig);
    await dockerContainer.start();
    logger.info(
      `Docker container ${stoppedContainer.codeContainerName} started successfully on port ${port}`,
    );
    await this._db
      .update(codeContainerSchema)
      .set({
        containerStatus: "RUNNING",
        codeContainerDescription: `Docker container ${stoppedContainer.codeContainerName} started successfully on port ${port}`,
        containerId: dockerContainer.id,
      })
      .where(eq(codeContainerSchema.id, intContainerId));
    httpResponse(req, res, reshttp.okCode, reshttp.okMessage, {
      projectConfig: {
        containerName: stoppedContainer.codeContainerName,
        status: "RUNNING",
        terminalPath: `/home/${stoppedContainer.codeContainerName}`,
        url: `http://localhost:${port}`,
      },
    });
  });
}
export const codeContainerController = (db: DatabaseClient) =>
  new CodeContainerController(db);
