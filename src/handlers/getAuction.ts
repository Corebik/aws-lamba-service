import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

import createError from "http-errors";
import { commonMiddleware } from "../lib/commonMiddleware.js";

import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDb } from "../lib/dynamoDbClient.js";

export const getAuctionById = async (id?: string) => {
  if (!id) throw new createError.BadRequest("Missing id path parameter");

  try {
    const result = await dynamoDb.send(
      new GetCommand({
        TableName: process.env.AUCTIONS_TABLE_NAME!,
        Key: { id },
      }),
    );

    const auction = result.Item;

    if (!auction) throw new createError.NotFound(`Auction with id "${id}" not found`);  

    return auction;
    
  } catch (error) {
    if (error instanceof createError.HttpError) {
      throw error;
    }
    throw new createError.InternalServerError(`getAuctionHandler error: ${error}`);
  }
};

const getAuction = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { id } = event.pathParameters ?? {};
  const auction = await getAuctionById(id);

  return {
    statusCode: 200,
    body: JSON.stringify(auction),
  };
};

export const handler = commonMiddleware(getAuction);