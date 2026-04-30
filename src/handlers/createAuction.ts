import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from "aws-lambda";
import { v4 as uuid } from "uuid";

import httpJsonBodyParser from "@middy/http-json-body-parser";
import createError from "http-errors";

import { AuctionDto, CreateAuctionDto } from "../DTOs/auction.dto.js";
import { commonMiddleware } from "../lib/commonMiddleware.js";

import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDb } from "../lib/dynamoDbClient.js";

import validator from "@middy/validator";
import { transpileSchema } from "@middy/validator/transpile";
import createAuctionSchema from "../schemas/createAuction.schema.js";

type CreateAuctionEvent = Omit<APIGatewayProxyEvent, "body"> & {
  body: CreateAuctionDto;
};

const createAuction = async (
  event: CreateAuctionEvent,
): Promise<APIGatewayProxyResult> => {
  const { title } = event.body;
  const now = new Date();
  const endDate = new Date();
  endDate.setHours(now.getHours() + 1);

  const auction: AuctionDto = {
    id: uuid(),
    title,
    status: "OPEN",
    createdAt: now.toISOString(),
    endingAt: endDate.toISOString(),
    highestBid: { amount: 0 },
  };
  
  try {    
    await dynamoDb.send(
      new PutCommand({
        TableName: process.env.AUCTIONS_TABLE_NAME!,
        Item: auction,
      }),
    );
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError("Could not create auction");
  }


  return {
    statusCode: 201,
    body: JSON.stringify(auction),
  };
};

export const handler = commonMiddleware(createAuction)
  .use(httpJsonBodyParser())
  .use(validator({ eventSchema: transpileSchema(createAuctionSchema) }));