export interface ICOOKIEOPTIONS {
  httpOnly: true;
  secure: boolean;
  sameSite: "none";
  expires: Date;
}
// ** login through application id
export interface IAPPLICATIONLOGIN {
  applicationId: string;
  password: string;
  email: string;
}
// ** Enums

// ** Pagination types
export interface IPAGINATION {
  currentPage: number;
  pageSize: number;
  totalPage: number;
  totalRecord: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
// ** Vendor partnership enum */
export type TVENDORPARTNERSHIP =
  | "DKC_E_COMMERCE"
  | "DKC_CONSIGNMENT"
  | "DKC_EXHIBITION"
  | "DKC_IMPORT_EXPORT"
  | "DKC_SUBSIDORY"
  | "DKC_BRICK_AND_MORTAR"
  | "DKC_FRANCHISE";
// ** Buyer partnership enum */

export type TBUYERPARTNERSHIP =
  | "DKC_DROP_SHIPPING"
  | "DKC_CONSIGNEE"
  | "DKC_EXHIBITION"
  | "DKC_IMPORT_EXPORT"
  | "DKC_INVESTOR"
  | "DKC_BRICK_AND_MORTAR"
  | "DKC_FRANCHISE";

export type TTIMEUNIT =
  | "second"
  | "seconds"
  | "minute"
  | "minutes"
  | "hour"
  | "hours"
  | "day"
  | "days"
  | "week"
  | "weeks"
  | "month"
  | "months"
  | "year"
  | "years";

// Define the time string type
export type TTIMESTRING = `${number} ${TTIMEUNIT}`;
