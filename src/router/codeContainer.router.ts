import { Router } from "express";
import { authMiddleware } from "../middleware/globalMiddleware/auth.middleware";
import { database } from "../db/db";
import { codeContainerController } from "../controller/codeContainerController/codeContainer.controller";

export const codeContainerRouter: Router = Router();
codeContainerRouter
  .route("/runCodeContainer/:codeContainerId")
  .post(
    authMiddleware(database.db).checkToken,
    codeContainerController(database.db).runCodeContainer,
  );

codeContainerRouter
  .route("/stopContainer")
  .patch(
    authMiddleware(database.db).checkToken,
    codeContainerController(database.db).stopContainer,
  );
