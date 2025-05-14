import { Router } from "express";
import { authRouter } from "./userRouter/auth.router";
import { updateUserRouter } from "./userRouter/updateUser.router";
export const defaultRouter: Router = Router();

// *** User
defaultRouter.use("/user", authRouter);
defaultRouter.use("/user", updateUserRouter);
