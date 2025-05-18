import { eq, or } from "drizzle-orm";
import type { Response } from "express";
import { type DatabaseClient } from "../../../db/db";
import { type TUSER, userSchema } from "../../../db/schemas";
import envConfig from "../../../config/env.config";
import reshttp from "reshttp";
import { verifyToken } from "../../../util/globalUtil/tokenGenerator.util";
import logger from "../../../util/globalUtil/logger.util";
import { throwError } from "../../../util/globalUtil/throwError.util";
import {
  passwordHasher,
  verifyPassword,
} from "../../../util/globalUtil/passwordHasher.util";
import { isAdmin } from "../../../util/appUtil/authUtil/checkIfUserIsAdmin.util";
import { setTokensAndCookies } from "../../../util/globalUtil/setCookies.util";
import { userRepo } from "../../../repository/userRepository/user.repo";
import { generateVerificationOtpToken } from "../../../util/globalUtil/verificationTokenGenerator.util";
import { sendVerificationEmail } from "../../../util/quickUtil/sendVerificationEmail.util";
export const usrAuthService = (db: DatabaseClient) => {
  const checkExistingUser = async ({ email, username }: TUSER) => {
    const existingUser = await db
      .select({
        uid: userSchema.uid,
        isVerified: userSchema.isVerified,
        email: userSchema.email,
      })
      .from(userSchema)
      .where(or(eq(userSchema.email, email), eq(userSchema.username, username)))
      .limit(1);
    return existingUser.length > 0 ? existingUser : null;
  };

  const handleUnverifiedUser = () => {
    throwError(
      reshttp.conflictCode,
      "An unverified Account already exists with these details",
    );
  };
  const handleVerifiedUser = () => {
    logger.info("User already exists and is verified");
    throwError(
      reshttp.conflictCode,
      "Account already exists with these details",
    );
  };

  const handleNewUser = async (user: TUSER, res: Response) => {
    const { OTP_TOKEN } = generateVerificationOtpToken(res);
    const hashedPassword = (await passwordHasher(user.password, res)) as string;
    await db
      .insert(userSchema)
      .values({
        ...user,
        OTP_TOKEN: OTP_TOKEN,
        password: hashedPassword,
        role: isAdmin(user.email) ? "ADMIN" : "USER",
        isVerified: isAdmin(user.email) ? true : false,
      })
      .then(async () =>
        isAdmin(user.email)
          ? null
          : await sendVerificationEmail(user.email, OTP_TOKEN),
      )
      .catch((err: unknown) => {
        logger.error("Something went wrong while creating new user", { err });
        throwError(
          reshttp.internalServerErrorCode,
          reshttp.internalServerErrorMessage,
        );
      });
  };

  const verifyUser = async (OTP_TOKEN: string, res: Response) => {
    const user = await userRepo(db).getUserByToken(OTP_TOKEN);
    if (user.isVerified) {
      throwError(reshttp.conflictCode, "Account already verified");
    }
    const [err] = verifyToken<{ OTP: string }>(
      user?.OTP_TOKEN as string,
      envConfig.JWT_SECRET,
    );
    if (err) {
      logger.info("TOKEN was expired long ago");
      await db
        .update(userSchema)
        .set({
          isVerified: false,
          OTP_TOKEN: null,
          OTP_TOKEN_VERSION: user.OTP_TOKEN_VERSION + 1,
        })
        .where(eq(userSchema.OTP_TOKEN, OTP_TOKEN));
      throwError(reshttp.unauthorizedCode, `Invalid token ${err.message}`);
    }
    const [updatedUser] = await db
      .update(userSchema)
      .set({
        isVerified: true,
        OTP_TOKEN: null,
        OTP_TOKEN_VERSION: user.OTP_TOKEN_VERSION + 1,
      })
      .where(eq(userSchema.OTP_TOKEN, OTP_TOKEN))
      .returning();

    const { accessToken, refreshToken } = setTokensAndCookies(
      updatedUser,
      res,
      true,
    );
    // ** we are creating them for first time so we will pass raw number

    return { accessToken, refreshToken };
  };
  const resendOTPToken = async (email: string, res: Response) => {
    const { OTP_TOKEN } = generateVerificationOtpToken(res);
    const user = await userRepo(db).getUserByEmail(email);
    if (user.isVerified) {
      logger.error("Account already verified. This route is at risk ");
      throwError(reshttp.conflictCode, "Account already verified");
    }
    await db
      .update(userSchema)
      .set({ OTP_TOKEN: OTP_TOKEN })
      .where(eq(userSchema.email, email))
      .then(async () => await sendVerificationEmail(email, OTP_TOKEN))
      .catch((err: unknown) => {
        logger.error("Something went wrong while creating new user", { err });
        throwError(
          reshttp.internalServerErrorCode,
          reshttp.internalServerErrorMessage,
        );
      });
  };
  // ** login user

  const loginUser = async (email: string, password: string, res: Response) => {
    const user = await userRepo(db).getUserByEmail(email);
    const isPasswordMatch = await verifyPassword(password, user.password, res);
    if (!isPasswordMatch) {
      logger.info("Incorrect password");
      throwError(reshttp.unauthorizedCode, "Invalid Credentials");
    }
    if (!user.isVerified) {
      logger.info("User is not verified so he/she can't login");
      throwError(reshttp.forbiddenCode, reshttp.forbiddenMessage);
    }

    const { accessToken, refreshToken } = setTokensAndCookies(
      user,
      res,
      true,
      true,
    );
    return { accessToken, refreshToken };
  };
  // ** Moderator can be created using specific route but it can't verify itslelf until admin do it explicitly
  const handleNewModeratorUser = async (user: TUSER, res: Response) => {
    const hashedPassword = (await passwordHasher(user.password, res)) as string;
    await db.insert(userSchema).values({
      ...user,
      password: hashedPassword,
      role: "MODERATOR",
      isVerified: false,
    });
  };

  const verifyModerator = async (username: string) => {
    await db
      .update(userSchema)
      .set({ isVerified: true })
      .where(eq(userSchema.username, username));
  };
  // Return functions from HOF

  return {
    handleNewModeratorUser,
    checkExistingUser,
    handleNewUser,
    handleUnverifiedUser,
    handleVerifiedUser,
    verifyUser,
    resendOTPToken,
    loginUser,
    verifyModerator,
  };
};
