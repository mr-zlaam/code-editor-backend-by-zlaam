import { Router } from "express";
import { authRouter } from "./userRouter/auth.router";
import { updateUserRouter } from "./userRouter/updateUser.router";
import { projectRouter } from "./projectRouter/project.router";
import { workspaceRouter } from "./workspaceRouter/workspace.router";
export const defaultRouter: Router = Router();

// *** User
defaultRouter.use("/user", authRouter);
defaultRouter.use("/user", updateUserRouter);
// *** Project
defaultRouter.use("/project", projectRouter);
// *** Code Container
defaultRouter.use("/workspace", workspaceRouter);
// *** Folder

// *** Workspace
