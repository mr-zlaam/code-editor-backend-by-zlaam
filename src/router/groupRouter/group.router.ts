import { Router } from "express";
import { authMiddleware } from "../../middleware/globalMiddleware/auth.middleware";
import { database } from "../../db/db";
import { groupsController } from "../../controller/groupsController/groupsController/groups.controller";

export const groupRouter: Router = Router();
groupRouter
  .route("/createInviteLink")
  .post(
    authMiddleware(database.db).checkToken,
    groupsController(database.db).createInviteLink,
  );
groupRouter
  .route("/requestToJoinGroupWithTheInviteLink")
  .post(
    authMiddleware(database.db).checkToken,
    groupsController(database.db).requestToJoinGroupWithTheInviteLink,
  );
groupRouter
  .route("/updateStatusOfGroupJoinRequest")
  .patch(
    authMiddleware(database.db).checkToken,
    groupsController(database.db).updateStatusOfGroupJoinRequest,
  );
groupRouter
  .route("/getAllJoinRequests/:groupId")
  .get(
    authMiddleware(database.db).checkToken,
    groupsController(database.db).getAllJoinRequests,
  );

groupRouter
  .route("/getAllGroupMembers/:groupId")
  .get(
    authMiddleware(database.db).checkToken,
    groupsController(database.db).getAllGroupMembers,
  );
