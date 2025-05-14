import reshttp from "reshttp";
import { throwError } from "../../globalUtil/throwError.util";
import logger from "../../globalUtil/logger.util";
import envConfig from "../../../config/env.config";

export function canAccessNextLevel(
  unlockedAtTimestamp: string | number | Date,
  retentionPeriodAchievedByUser: number,
  kpiPointsAchievedByUser: number,
  requiredKpiPoints: number,
  currentMockDate?: string | null, // <-- new optional param for testability
): boolean {
  const unlockedDate: Date = new Date(unlockedAtTimestamp);
  if (isNaN(unlockedDate.getTime())) {
    throwError(reshttp.badRequestCode, "Invalid date format");
  }
  const currentDateParam: Date = new Date(currentMockDate!);
  const currentDate: Date = currentDateParam ?? new Date();

  const millisecondsPassed: number =
    currentDate.getTime() - unlockedDate.getTime();
  const totalMinutes: number = Math.floor(millisecondsPassed / (1000 * 60));
  const totalHours: number = Math.floor(totalMinutes / 60);
  const totalDays: number = Math.floor(totalHours / 24);

  const monthsPassed: number = Math.floor(totalDays / 30); // Approximate
  const remainingDays: number = totalDays % 30;
  const remainingHours: number = totalHours % 24;
  const remainingMinutes: number = totalMinutes % 60;

  const isRetentionPeriodValid: boolean =
    monthsPassed >= retentionPeriodAchievedByUser;

  if (envConfig.NODE_ENV === "production") {
    if (!isRetentionPeriodValid) {
      logger.warn(
        `Invalid retention period provided: User claims ${retentionPeriodAchievedByUser} months, but only ${monthsPassed} months, ${remainingDays} days, ${remainingHours} hours, and ${remainingMinutes} minutes have actually passed since unlock.`,
      );
      throwError(reshttp.badRequestCode, "Invalid retention period achieved");
    }
  }

  const targetDate: Date = new Date(unlockedDate);
  targetDate.setMonth(targetDate.getMonth() + retentionPeriodAchievedByUser);

  const didUserFulfillRetentionPeriodRequirement: boolean =
    currentDate >= targetDate;
  const didUserFulfillKpiPointsRequirement: boolean =
    kpiPointsAchievedByUser >= Math.min(requiredKpiPoints, 10);

  if (!didUserFulfillRetentionPeriodRequirement) {
    logger.warn(
      "User did not fulfill the retention period requirement: Retention period is not enough",
      {
        targetDate: `${targetDate.toLocaleDateString()} - ${targetDate.toLocaleTimeString()}`,
      },
    );
    throwError(
      reshttp.badRequestCode,
      "User did not fulfill the retention period requirement: Retention period is not enough",
    );
  }

  if (!didUserFulfillKpiPointsRequirement) {
    logger.warn(
      "User did not fulfill the kpi points requirement: KPI points are not enough",
    );
    throwError(
      reshttp.badRequestCode,
      `User did not fulfill the kpi points requirement: required kpi points are ${requiredKpiPoints}`,
    );
  }

  return true;
}
