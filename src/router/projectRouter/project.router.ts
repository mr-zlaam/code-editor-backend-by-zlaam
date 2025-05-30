import { Router } from "express";
import { authMiddleware } from "../../middleware/globalMiddleware/auth.middleware";
import { database } from "../../db/db";
import { projectController } from "../../controller/projectController/project.controller";

export const projectRouter: Router = Router();

projectRouter
  .route("/createProject")
  .post(
    authMiddleware(database.db).checkToken,
    projectController(database.db).createProject,
  );
projectRouter
  .route("/getSingleProject")
  .get(
    authMiddleware(database.db).checkToken,
    projectController(database.db).getSingleProject,
  );
projectRouter
  .route("/getAllProjects")
  .get(
    authMiddleware(database.db).checkToken,
    projectController(database.db).getAllProjects,
  );
projectRouter
  .route("/updateProject/:id")
  .patch(
    authMiddleware(database.db).checkToken,
    projectController(database.db).updateProject,
  );
projectRouter
  .route("/deleteProject/:id")
  .delete(
    authMiddleware(database.db).checkToken,
    projectController(database.db).deleteProject,
  );
