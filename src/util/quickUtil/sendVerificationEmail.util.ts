import envConfig from "../../config/env.config";
import emailResponsesConstant from "../../constant/emailResponses.constant";
import { gloabalMailMessage } from "../../service/globalService/globalEmail.service";
import logger from "../globalUtil/logger.util";

export const sendVerificationEmail = async (email: string, token: string) => {
  const verificationUrl = `${envConfig.FRONTEND_APP_URI}/auth/verify?token=${token}`;
  logger.info(verificationUrl);
  const emailContent = emailResponsesConstant.OTP_SENDER_MESSAGE(
    verificationUrl,
    "30",
  );
  return await gloabalMailMessage(
    email,
    emailContent,
    "Please verify your account",
  );
};
