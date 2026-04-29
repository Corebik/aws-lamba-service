import { APIGatewayProxyResult } from "aws-lambda";
import AWS from "aws-sdk";
import createError from "http-errors";

import { AuctionDto } from "../DTOs/auction.dto.js";
import { commonMiddleware } from "../lib/commonMiddleware.js";

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const getAuctions = async (): Promise<APIGatewayProxyResult> => {

  let auctions: AuctionDto[];

  try {
    const result = await dynamoDb
      .scan({
        TableName: process.env.AUCTIONS_TABLE_NAME!,
      })
      .promise();

    auctions = result.Items as AuctionDto[];
  } catch (error) {
    throw new createError.InternalServerError(`getAuctionsHandler error: ${error}`);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(auctions),
  };
};

export const handler = commonMiddleware(getAuctions);