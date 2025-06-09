import { Router } from "express";
import { authMiddleware } from "../../middleware/globalMiddleware/auth.middleware";
import { database } from "../../db/db";
import { folderController } from "../../controller/folderController/folder.controller";
import { validator } from "../../middleware/globalMiddleware/validation.middleware";
import { createFolderSchemaZ } from "../../validation/folderValidation/folder.validation";

export const folderRouter: Router = Router();

folderRouter
  .route("/createFolder")
  .post(
    authMiddleware(database.db).checkToken,
    validator(createFolderSchemaZ),
    folderController(database.db).createFolder,
  );
folderRouter
  .route("/getAllFolders/:projectId")
  .get(
    authMiddleware(database.db).checkToken,
    folderController(database.db).getAllFolders,
  );
folderRouter
  .route("/stopProjectUnderFolder/:folderId")
  .patch(
    authMiddleware(database.db).checkToken,
    folderController(database.db).stopProjectUnderFolder,
  );
folderRouter
  .route("/deleteFolder/:folderId")
  .delete(
    authMiddleware(database.db).checkToken,
    folderController(database.db).deleteFolder,
  );
folderRouter
  .route("/updateFolder/:folderId")
  .patch(
    authMiddleware(database.db).checkToken,
    folderController(database.db).updateFolderName,
  );

folderRouter
  .route("/restartProject/:folderId")
  .patch(
    authMiddleware(database.db).checkToken,
    folderController(database.db).restartProject,
  );
