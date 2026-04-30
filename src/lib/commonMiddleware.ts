import middy from "@middy/core";
import httpErrorHandler from "@middy/http-error-handler";
import httpEventNormalizer from "@middy/http-event-normalizer";
import { type Handler } from "aws-lambda";

export const commonMiddleware = <TEvent, TResult>(
  handler: Handler<TEvent, TResult>,
) =>
  middy(handler).use([
    httpEventNormalizer(),
    httpErrorHandler(),
  ]);