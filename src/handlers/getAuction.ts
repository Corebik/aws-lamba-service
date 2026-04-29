import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import AWS from "aws-sdk";

import createError from "http-errors";
import { commonMiddleware } from "../lib/commonMiddleware.js";

const dynamoDb = new AWS.DynamoDB.DocumentClient();

export const getAuctionById = async (id?: string) => {
  if (!id) throw new createError.BadRequest("Missing id path parameter");

  try {
    const result = await dynamoDb.get({
      TableName: process.env.AUCTIONS_TABLE_NAME!,
      Key: { id },
    }).promise();

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