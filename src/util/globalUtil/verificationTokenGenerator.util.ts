import type { Response } from "express";
import type ms from "ms";
import { generateOtp } from "../quickUtil/slugStringGenerator.util";
import tokenGeneratorUtil from "./tokenGenerator.util";
export function generateVerificationOtpToken(
  res: Response,
  expiryTime?: ms.StringValue,
) {
  const { otpExpiry, otp } = generateOtp(6, 30, "m");
  const { generateOTPToken } = tokenGeneratorUtil;
  const OTP_TOKEN = generateOTPToken({ OTP: otp }, res, expiryTime) as string;
  return { otpExpiry, OTP_TOKEN };
}
