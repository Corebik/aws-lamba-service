import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

import createError from "http-errors";
import { commonMiddleware } from "../lib/commonMiddleware.js";
import httpJsonBodyParser from '@middy/http-json-body-parser';
import { getAuctionById } from "./getAuction.js";

import { UpdateCommand, type UpdateCommandInput } from "@aws-sdk/lib-dynamodb";
import { dynamoDb } from "../lib/dynamoDbClient.js";

import validator from "@middy/validator";
import { transpileSchema } from "@middy/validator/transpile";
import PlaceBidSchema from "../schemas/placeBid.schema.js";
import { Auth0AuthorizerContext } from "../types/requestContext.type.js";

type CreateAuctionEvent = Omit<APIGatewayProxyEvent, "body"> & {
  body: { amount: number; };
  requestContext: APIGatewayProxyEvent["requestContext"] & {
    authorizer: Auth0AuthorizerContext;
  };
};

const placeBid = async (event: CreateAuctionEvent): Promise<APIGatewayProxyResult> => {
  if(!event.pathParameters || !event.pathParameters.id) 
    throw new createError.BadRequest("Missing id path parameter");

  const { id } = event.pathParameters;
  const { amount } = event.body;
  const { email } = event.requestContext.authorizer;

  const auction = await getAuctionById(id);

  //Bid identity validation
  if(auction.seller === email)
    throw new createError.BadRequest("You can not place a bid on your own auction!");

  //Avoid double bidding by the same user
  if(auction.highestBid.bidder === email)
    throw new createError.BadRequest("You are already the highest bidder!");

  // Auction status validation
  if(auction.status !== "OPEN")
    throw new createError.BadRequest("You can not place a bid on a closed auction!");

  // Bid amount validation
  if(amount <= auction.highestBid.amount) 
    throw new createError.BadRequest(`Bid amount must be higher than the current highest bid of ${auction.highestBid.amount}`);

  const params: UpdateCommandInput = {
    TableName: process.env.AUCTIONS_TABLE_NAME!,
    Key: { id },
    UpdateExpression: "set highestBid.amount = :amount, highestBid.bidder = :bidder",
    ConditionExpression: "highestBid.amount < :amount and #status = :open",
    ExpressionAttributeValues: {
      ":amount": amount,
      ":open": "OPEN",
      ":bidder": email,
    },
    ExpressionAttributeNames: {
      "#status": "status",
    },
    ReturnValues: "ALL_NEW",
  };

  try {
    const result = await dynamoDb.send(new UpdateCommand(params));
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
.use(httpJsonBodyParser())
.use(validator({ eventSchema: transpileSchema(PlaceBidSchema) }));