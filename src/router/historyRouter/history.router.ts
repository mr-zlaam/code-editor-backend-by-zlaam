import { Router } from "express";
import { authMiddleware } from "../../middleware/globalMiddleware/auth.middleware";
import { database } from "../../db/db";
import { historyController } from "../../controller/historyController/history.controller";

export const historyRouter: Router = Router();

historyRouter
  .route("/getAllHistory/:folderId")
  .get(
    authMiddleware(database.db).checkToken,
    historyController(database.db).getAllHistoryHistory,
  );
