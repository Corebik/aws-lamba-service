import { dynamoDb } from "../lib/dynamoDbClient.js";
import { UpdateCommand, type UpdateCommandInput } from "@aws-sdk/lib-dynamodb";

export const setAuctionImageUrl = async (auctionId: string, imageUrl: string) => {
  const params: UpdateCommandInput = {
    TableName: process.env.AUCTIONS_TABLE_NAME!,
    Key: { id: auctionId },
    UpdateExpression: "set imageUrl = :imageUrl",
    ExpressionAttributeValues: {
      ":imageUrl": imageUrl,
    },
    ReturnValues: "ALL_NEW",
  };

  try {
    const result = await dynamoDb.send(new UpdateCommand(params));
    return result.Attributes;
  } catch (error) {
    console.error(`setAuctionImageUrl error: ${error}`);
    throw new Error(`Could not update auction ${auctionId} with image URL: ${error}`);
  }
};