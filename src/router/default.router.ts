import { Router } from "express";
import { authRouter } from "./userRouter/auth.router";
import { updateUserRouter } from "./userRouter/updateUser.router";
import { projectRouter } from "./projectRouter/project.router";
import { folderRouter } from "./folderRouter/folder.router";
import { historyRouter } from "./historyRouter/history.router";
import { groupRouter } from "./groupRouter/group.router";
export const defaultRouter: Router = Router();

// *** User
defaultRouter.use("/user", authRouter);
defaultRouter.use("/user", updateUserRouter);
// *** Project
defaultRouter.use("/project", projectRouter);
// *** folder
defaultRouter.use("/folder", folderRouter);
// *** history
defaultRouter.use("/history", historyRouter);
// *** group
defaultRouter.use("/group", groupRouter);
