interface IENVIRONMENTCONFIG {
  PORT: number;
  DATABASE_URI: string;
  JWT_SECRET: string;
  BACKEND_API_URI: string;
  FRONTEND_APP_URI: string;
  NODE_ENV: "development" | "production" | "test";
  HOST_EMAIL: string;
  HOST_EMAIL_SECRET: string;
  WHITE_LIST_MAILS: string;
  ALLOWED_REGIONS: string;
  CLOUDINARY_API_SECRET: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_NAME: string;
  CLOUDINARY_URI: string;
}
export default {
  PORT: process.env.PORT
    ? parseInt(process.env.PORT)
    : "Unable to fetch PORT from .env file",
  DATABASE_URI: process.env.DATABASE_URI
    ? process.env.DATABASE_URI
    : "Unable to fetch DATABASE_URI from .env file",
  JWT_SECRET: process.env.JWT_SECRET
    ? process.env.JWT_SECRET
    : "Unable to fetch JWT_SECRET from .env file",
  BACKEND_API_URI: process.env.BACKEND_API_URI
    ? process.env.BACKEND_API_URI
    : "Unable to fetch BACKEND_API_URI from .env file",
  FRONTEND_APP_URI: process.env.FRONTEND_APP_URI
    ? process.env.FRONTEND_APP_URI
    : "Unable to fetch FRONTEND_APP_URI from .env file",
  NODE_ENV: process.env.NODE_ENV
    ? process.env.NODE_ENV
    : "Unable to fetch NODE_ENV from .env file",
  HOST_EMAIL: process.env.HOST_EMAIL
    ? process.env.HOST_EMAIL
    : "Unable to fetch HOST_EMAIL from .env file",
  HOST_EMAIL_SECRET: process.env.HOST_EMAIL_SECRET
    ? process.env.HOST_EMAIL_SECRET
    : "Unable to fetch HOST_EMAIL_SECRET from .env file",
  WHITE_LIST_MAILS: process.env.WHITE_LIST_MAILS
    ? process.env.WHITE_LIST_MAILS
    : "Unable to fetch WHITE_LIST_MAILS from .env file",
  ALLOWED_REGIONS: process.env.ALLOWED_REGIONS
    ? process.env.ALLOWED_REGIONS
    : "Unable to fetch ALLOWED_REGIONS from .env file",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET
    ? process.env.CLOUDINARY_API_SECRET
    : "Unable to fetch CLOUDINARY_API_SECRET from .env file",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY
    ? process.env.CLOUDINARY_API_KEY
    : "Unable to fetch CLOUDINARY_API_KEY from .env file",
  CLOUDINARY_NAME: process.env.CLOUDINARY_NAME
    ? process.env.CLOUDINARY_NAME
    : "Unable to fetch CLOUDINARY_NAME from .env file",
  CLOUDINARY_URI: process.env.CLOUDINARY_URI
    ? process.env.CLOUDINARY_URI
    : "Unable to fetch CLOUDINARY_URI from .env file",
} as IENVIRONMENTCONFIG;
