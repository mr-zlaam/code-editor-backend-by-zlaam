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
    const { projectId } = req.query as { projectId: string };
    const intProjectId = Number(projectId);
    if (!codeContainerId) {
      logger.info("Code container id is required!");
      return throwError(reshttp.badRequestCode, reshttp.badRequestMessage);
    }
    const intContainerId = Number(codeContainerId);
    if (!projectId) {
      logger.info("Project id is required!");
      return throwError(reshttp.badRequestCode, reshttp.badRequestMessage);
    }
    //**  if container is running then return container configuration otherwise continue
    const currentContainer = await this._db.query.codeContainer.findFirst({
      where: and(
        eq(codeContainerSchema.id, intContainerId),
        eq(codeContainerSchema.projectId, intProjectId),
      ),
    });
    if (!currentContainer)
      return throwError(reshttp.notFoundCode, reshttp.notFoundMessage);
    if (currentContainer.containerStatus === "RUNNING") {
      return httpResponse(req, res, 200, "Container is already running", {
        projectConfig: {
          containerName: currentContainer.codeContainerName,
          status: "RUNNING",
          terminalPath: `/home/${currentContainer.codeContainerName}`,
          url: currentContainer.containerURI,
        },
      });
    }

    const isThereAnyContainerRunningForCurrentUser =
      await this._db.query.project.findFirst({
        where: and(
          eq(projectSchema.userId, userId),
          eq(projectSchema.id, intProjectId),
        ),
        with: { codeContainers: { columns: { containerStatus: true } } },
      });
    if (
      isThereAnyContainerRunningForCurrentUser?.codeContainers
        .containerStatus === "RUNNING"
    ) {
      logger.info("Other Container is already running");
      return throwError(
        reshttp.badRequestCode,
        "Please stop other project to start this one",
      );
    }
    const stoppedContainer = await this._db.query.codeContainer.findFirst({
      where: and(
        eq(codeContainerSchema.id, intContainerId),
        eq(codeContainerSchema.projectId, intProjectId),
        eq(codeContainerSchema.containerStatus, "STOPPED"),
      ),
    });
    //** user can't create or run the container if any other container connected to him is already running */
    if (stoppedContainer?.containerId) {
      // ** if stopped container has  container id its mean this container was running once so we will start it from there where it stops
      // ** run the container
      await this._docker
        .getContainer(stoppedContainer.codeContainerName)
        .start();
      await this._db
        .update(codeContainerSchema)
        .set({ containerStatus: "RUNNING" })
        .where(
          and(
            eq(codeContainerSchema.id, intContainerId),
            eq(codeContainerSchema.projectId, intProjectId),
          ),
        );
      return httpResponse(req, res, 200, "Container is already running", {
        projectConfig: {
          containerName: stoppedContainer.codeContainerName,
          status: "RUNNING",
          terminalPath: `/home/${stoppedContainer.codeContainerName}`,
          url: stoppedContainer.containerURI,
        },
      });
    }
    if (!stoppedContainer) {
      logger.info("Container not found");
      return throwError(reshttp.notFoundCode, reshttp.notFoundMessage);
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
    const containerConfig = returnDockerConfig(
      stoppedContainer,
      port,
      stoppedContainer.codeContainerName.split("_")[0],
    );
    // Check if a container with the same name exists and remove it
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
        containerURI: `http://localhost:${port}`,
      })
      .where(
        and(
          eq(codeContainerSchema.id, intContainerId),
          eq(codeContainerSchema.projectId, intProjectId),
        ),
      );
    httpResponse(req, res, reshttp.okCode, reshttp.okMessage, {
      projectConfig: {
        containerName: stoppedContainer.codeContainerName,
        status: "RUNNING",
        terminalPath: `/home/${stoppedContainer.codeContainerName}`,
        url: `http://localhost:${port}`,
      },
    });
  });
  public stopContainer = asyncHandler(async (req: _Request, res) => {
    const { containerName, codeContainerId, projectId } = req.body as {
      codeContainerId: number;
      projectId: number;
      containerName: string;
    };
    const intContainerId = Number(codeContainerId);
    const intProjectId = Number(projectId);
    if (!intContainerId) {
      logger.info("Container id is required");
      return throwError(reshttp.badRequestCode, reshttp.badRequestMessage);
    }
    if (!intProjectId) {
      logger.info("Project id is required");
      return throwError(reshttp.badRequestCode, reshttp.badRequestMessage);
    }
    if (!containerName) {
      logger.info("Container name is required");
      return throwError(reshttp.badRequestCode, reshttp.badRequestMessage);
    }
    const stoppedContainer = await this._db.query.codeContainer.findFirst({
      where: and(
        eq(codeContainerSchema.id, intContainerId),
        eq(codeContainerSchema.projectId, intProjectId),
        eq(codeContainerSchema.containerStatus, "RUNNING"),
      ),
    });
    if (!stoppedContainer) {
      logger.info("Container not found");
      return throwError(reshttp.notFoundCode, reshttp.notFoundMessage);
    }
    const dockerContainer = this._docker.getContainer(
      stoppedContainer.codeContainerName,
    );
    await dockerContainer.stop();
    await this._db
      .update(codeContainerSchema)
      .set({ containerStatus: "STOPPED" })
      .where(
        and(
          eq(codeContainerSchema.id, intContainerId),
          eq(codeContainerSchema.projectId, intProjectId),
        ),
      );
    httpResponse(req, res, reshttp.okCode, reshttp.okMessage, {
      message: "Container stopped successfully",
    });
  });
}
export const codeContainerController = (db: DatabaseClient) =>
  new CodeContainerController(db);
