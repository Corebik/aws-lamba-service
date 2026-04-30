import { AuctionDto } from "../DTOs/auction.dto.js";
import { dynamoDb } from "./dynamoDbClient.js";
import { UpdateCommand, type UpdateCommandInput } from "@aws-sdk/lib-dynamodb";

export const closeAuction = async (auction: AuctionDto) => {
  const params: UpdateCommandInput = {
    TableName: process.env.AUCTIONS_TABLE_NAME!,
    Key: { id: auction.id },
    UpdateExpression: "set #status = :status",
    ExpressionAttributeNames: {
      "#status": "status",
    },
    ExpressionAttributeValues: {
      ":status": "CLOSED",
    },
  };

  try {
    // await dynamoDb.send(new UpdateCommand(params));
    // return { ...auction, status: "CLOSED" };
    const result = await dynamoDb.send(new UpdateCommand(params));
    return result;
  } catch (error) {
    console.log("closeAuction error");
    console.error(`Could not close auction ${auction.id}: ${error}`);
    // throw new createError.InternalServerError(
    //   `Could not close auction ${auction.id}`,
    // );
  }
};