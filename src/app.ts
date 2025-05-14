import express, { type Application } from "express";
import cors from "cors";
import helmet from "helmet";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/globalMiddleware/error.middleware";
import endPointsConstant from "./constant/endPoints.constant";
import { defaultRouter } from "./router/default.router";
import appConstant from "./constant/app.constant";
import path from "node:path";
export const app: Application = express();

//  * Default Middlewares
app.use(express.json());
app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(helmet());
app.use(cors(appConstant.CORS_OPTIONS));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.resolve(__dirname, "../public")));

// * Custom Middlewares
app.use(endPointsConstant.DEFAULT_ENDPOINT, defaultRouter);
// * Error handling Middleware
app.use(notFoundHandler);
app.use(errorHandler);
