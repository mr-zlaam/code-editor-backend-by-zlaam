import { Router } from "express";
import { authController } from "../../controller/userController/auth.controller";
import { validator } from "../../middleware/globalMiddleware/validation.middleware";
import {
  loginUserSchema,
  registerUserSchemaZ,
  resendOTPSchemaZ,
} from "../../validation/userValidation/auth.validation";
import { database } from "../../db/db";
import rateLimiterMiddleware from "../../middleware/globalMiddleware/ratelimiter.middleware";
import { authMiddleware } from "../../middleware/globalMiddleware/auth.middleware";
import { getUserController } from "../../controller/userController/getUser.controller";
import { httpResponse } from "../../util/globalUtil/apiResponse.util";
export const authRouter: Router = Router();
// ** Register User
authRouter
  .route("/registerUser")
  .post(
    validator(registerUserSchemaZ),
    authController(database.db).registerUser,
  );
// ** Verify User
authRouter.route("/verifyUser").patch(authController(database.db).verifyUser);
// ** Resend OTP
authRouter.route("/resendOTP").post(
  validator(resendOTPSchemaZ),
  // Rate limiter that user can get only 1 otp per 2 minutes
  async (req, res, next) => {
    await rateLimiterMiddleware.handle(req, res, next, 1, undefined, 1, 120);
  },
  authController(database.db).resendOTP,
);

authRouter.route("/loginUser").post(
  validator(loginUserSchema),
  // Rate limiter that user can get only 1 otp per 2 minutes
  async (req, res, next) => {
    await rateLimiterMiddleware.handle(req, res, next, 1, undefined, 5, 120);
  },
  authController(database.db).loginUser,
);
// ** Refresh access Toke
authRouter
  .route("/refreshAccessToken")
  .post(authController(database.db).refreshAccessToken);

// ** Register Moderator
authRouter
  .route("/registerAsModerator")
  .post(
    validator(registerUserSchemaZ),
    authController(database.db).registerAsModerator,
  );

// ** Verify Moderator
authRouter
  .route("/verifyModerator/:username")
  .patch(
    /*Verification is done in controller*/ authMiddleware(database.db)
      .checkToken,
    authMiddleware(database.db).checkIfUserIsAdmin,
    authController(database.db).verifyModerator,
  );
// ** Get All User
authRouter
  .route("/getAllUser")
  .get(
    authMiddleware(database.db).checkToken,
    authMiddleware(database.db).checkIfUserIsAdmin,
    getUserController(database.db).getAllUser,
  );
// ** Get Current User: user specific only logged in user can access this
authRouter
  .route("/getCurrentUser")
  .get(
    authMiddleware(database.db).checkToken,
    getUserController(database.db).getCurrentUser,
  );
// ** Get Single User admin specific
authRouter
  .route("/getSingleUser/:username")
  .get(
    authMiddleware(database.db).checkToken,
    authMiddleware(database.db).checkIfUserIsAdmin,
    getUserController(database.db).getSingleUser,
  );
authRouter
  .route("/checkUser")
  .get(authMiddleware(database.db).checkToken, (req, res) => {
    httpResponse(req, res, 200, "You are logged in");
  });
