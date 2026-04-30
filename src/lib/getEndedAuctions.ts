import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDb } from "./dynamoDbClient.js";
import { AuctionDto } from "../DTOs/auction.dto.js";

export const getEndedAuctions = async () => {
  const now = new Date();
  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME!,
    IndexName: "StatusAndEndDateIndex",
    KeyConditionExpression: "#status = :status AND endingAt <= :now",
    ExpressionAttributeValues: {
      ":status": "OPEN",
      ":now": now.toISOString(),
    },
    ExpressionAttributeNames: {
      "#status": "status"
    }
  }

  const result = await dynamoDb.send(new QueryCommand(params));
  return (result.Items ?? []) as AuctionDto[];
};