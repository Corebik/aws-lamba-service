import middy from "@middy/core";
import httpErrorHandler from "@middy/http-error-handler";
import httpEventNormalizer from "@middy/http-event-normalizer";
import { Context } from "aws-lambda";

type AsyncHandler<TEvent, TResult> = (
  event: TEvent,
  context?: Context,
) => Promise<TResult> | TResult;

export const commonMiddleware = <TEvent, TResult>(
  handler: AsyncHandler<TEvent, TResult>,
) => 
  middy(handler)
  .use([
    httpEventNormalizer(), 
    httpErrorHandler()
  ]);