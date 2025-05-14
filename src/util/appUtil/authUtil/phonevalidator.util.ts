import {
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";

export function validateAndFormatPhone(
  phoneNumber: string,
  countryCode?: CountryCode,
) {
  try {
    const parsedNumber = parsePhoneNumberFromString(
      phoneNumber,
      countryCode as CountryCode,
    );

    if (!parsedNumber || !parsedNumber.isValid()) {
      return {
        isValid: false,
        error: "Invalid phone number",
      };
    }

    return {
      isValid: true,
      phoneNumber: parsedNumber.number,
      nationalNumber: parsedNumber.nationalNumber,
      countryCode: parsedNumber.country,
      formattedNumber: parsedNumber.formatInternational(),
      type: parsedNumber.getType(),
    };
  } catch (err: unknown) {
    if (err instanceof Error)
      return {
        isValid: false,
        error: err.message,
      };
  }
}
