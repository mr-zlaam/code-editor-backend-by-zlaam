import { Router } from "express";
import { authMiddleware } from "../../middleware/globalMiddleware/auth.middleware";
import { database } from "../../db/db";
import { workspaceController } from "../../controller/workspaceController/workspace.controller";

export const workspaceRouter: Router = Router();

workspaceRouter
  .route("/createWorkspace")
  .post(
    authMiddleware(database.db).checkToken,
    workspaceController(database.db).createWorkspace,
  );
workspaceRouter
  .route("/getSingleWorkspace")
  .get(
    authMiddleware(database.db).checkToken,
    workspaceController(database.db).getSingleWorkspace,
  );
workspaceRouter
  .route("/getAllWorkspaces")
  .get(
    authMiddleware(database.db).checkToken,
    workspaceController(database.db).getAllWorkspaces,
  );
workspaceRouter
  .route("/updateWorkspace")
  .patch(
    authMiddleware(database.db).checkToken,
    workspaceController(database.db).updateWorkspace,
  );
workspaceRouter
  .route("/deleteWorkspace")
  .delete(
    authMiddleware(database.db).checkToken,
    workspaceController(database.db).deleteWorkspace,
  );
