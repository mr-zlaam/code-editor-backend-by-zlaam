import { Router } from "express";
import { authRouter } from "./userRouter/auth.router";
import { updateUserRouter } from "./userRouter/updateUser.router";
import { projectRouter } from "./projectRouter/project.router";
import { folderRouter } from "./folderRouter/folder.router";
import { historyRouter } from "./historyRouter/history.router";
export const defaultRouter: Router = Router();

// *** User
defaultRouter.use("/user", authRouter);
defaultRouter.use("/user", updateUserRouter);
// *** Project
defaultRouter.use("/project", projectRouter);
// *** folder
defaultRouter.use("/folder", folderRouter);
// ***
defaultRouter.use("/history", historyRouter);
