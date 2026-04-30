import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import createError from "http-errors";

import { AuctionDto } from "../DTOs/auction.dto.js";
import { commonMiddleware } from "../lib/commonMiddleware.js";

import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDb } from "../lib/dynamoDbClient.js";

import { transpileSchema } from '@middy/validator/transpile'
import getAuctionsSchema from "../schemas/getAuction.schema.js";
import validator from "@middy/validator";

const getAuctions = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const status = event.queryStringParameters?.status;
  let auctions: AuctionDto[];

  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME!,
    IndexName: "StatusAndEndDateIndex",
    KeyConditionExpression: "#status = :status",
    ExpressionAttributeNames: {
      "#status": "status",
    },
    ExpressionAttributeValues: {
      ":status": status,
    }
  }

  try {
    // const result = await dynamoDb.send(
    //   new ScanCommand({
    //     TableName: process.env.AUCTIONS_TABLE_NAME!,
    //   }),
    // );
    const result = await dynamoDb.send(new QueryCommand(params));
    auctions = (result.Items ?? []) as AuctionDto[];
  } catch (error) {
    throw new createError.InternalServerError(`getAuctionsHandler error: ${error}`);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(auctions),
  };
};

export const handler = commonMiddleware(getAuctions)
  .use(validator({
    eventSchema: transpileSchema(getAuctionsSchema),
  }));