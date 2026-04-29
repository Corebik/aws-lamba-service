import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import AWS from "aws-sdk";

import createError from "http-errors";
import { commonMiddleware } from "../lib/commonMiddleware.js";
import httpJsonBodyParser from '@middy/http-json-body-parser';
import { getAuctionById } from "./getAuction.js";

type CreateAuctionEvent = Omit<APIGatewayProxyEvent, "body"> & {
  body: { amount: number; };
};

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const placeBid = async (event: CreateAuctionEvent): Promise<APIGatewayProxyResult> => {
  if(!event.pathParameters) throw new createError.BadRequest("Missing id path parameter");

  const { id } = event.pathParameters;
  const { amount } = event.body;

  const auction = await getAuctionById(id);

  if(amount <= auction.highestBid.amount) 
    throw new createError.BadRequest(`Bid amount must be higher than the current highest bid of ${auction.highestBid.amount}`);

  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME!,
    Key: { id },
    UpdateExpression: "set highestBid.amount = :amount",
    ConditionExpression: "highestBid.amount < :amount and #status = :open",
    ExpressionAttributeValues: {
      ":amount": amount,
      ":open": "OPEN",
    },
    ExpressionAttributeNames: {
      "#status": "status",
    },
    ReturnValues: "ALL_NEW",
  };

  try {
    const result = await dynamoDb.update(params).promise();
    const updatedAuction = result.Attributes;

    return {
      statusCode: 200,
      body: JSON.stringify(updatedAuction),
    };
  } catch (error) {
    throw new createError.InternalServerError(`placeBidHandler error: ${error}`);
  }
  
};

export const handler = commonMiddleware(placeBid)
.use(httpJsonBodyParser());