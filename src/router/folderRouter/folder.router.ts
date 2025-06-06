// import { Router } from "express";
// import { authMiddleware } from "../../middleware/globalMiddleware/auth.middleware";
// import { database } from "../../db/db";
// import { folderController } from "../../controller/folderController/folder.controller";

// export const folderRouter: Router = Router();

// folderRouter
//   .route("/createFolder")
//   .post(
//     authMiddleware(database.db).checkToken,
//     folderController(database.db).createFolder,
//   );
// folderRouter
//   .route("/getSingleFolder")
//   .get(
//     authMiddleware(database.db).checkToken,
//     folderController(database.db).getSingleFolder,
//   );
// folderRouter
//   .route("/getAllFolders")
//   .get(
//     authMiddleware(database.db).checkToken,
//     folderController(database.db).getAllFolders,
//   );
// folderRouter
//   .route("/updateFolder")
//   .patch(
//     authMiddleware(database.db).checkToken,
//     folderController(database.db).updateFolder,
//   );
// folderRouter
//   .route("/deleteFolder")
//   .delete(
//     authMiddleware(database.db).checkToken,
//     folderController(database.db).deleteFolder,
//   );
