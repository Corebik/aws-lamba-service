import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from "aws-lambda";
import { v4 as uuid } from "uuid";
import AWS from "aws-sdk";

import middy from "@middy/core";
import httpJsonBodyParser from "@middy/http-json-body-parser";
import httpEventNormalizer from "@middy/http-event-normalizer";
import httpErrorHandler from "@middy/http-error-handler";
import createError from "http-errors";

import { AuctionDto, CreateAuctionDto } from "../DTOs/auction.dto.js";

type CreateAuctionEvent = Omit<APIGatewayProxyEvent, "body"> & {
  body: CreateAuctionDto;
};

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const createAuction = async (
  event: CreateAuctionEvent,
): Promise<APIGatewayProxyResult> => {
  const { title } = event.body;

  const auction: AuctionDto = {
    id: uuid(),
    title,
    status: "OPEN",
    createdAt: new Date().toISOString(),
  };
  
  try {    
    await dynamoDb
      .put({
        TableName: process.env.AUCTIONS_TABLE_NAME!,
        Item: auction,
      })
      .promise();
  } catch (error) {
    console.error(error);
    throw new createError.InternalServerError("Could not create auction");
  }


  return {
    statusCode: 201,
    body: JSON.stringify(auction),
  };
};

export const handler = middy(createAuction)
  .use(httpJsonBodyParser())
  .use(httpEventNormalizer())
  .use(httpErrorHandler());