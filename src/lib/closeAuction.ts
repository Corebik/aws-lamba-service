import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { AuctionDto } from "../DTOs/auction.dto.js";
import { dynamoDb } from "./dynamoDbClient.js";
import { UpdateCommand, type UpdateCommandInput } from "@aws-sdk/lib-dynamodb";

const sqs = new SQSClient();

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
    await dynamoDb.send(new UpdateCommand(params));
    
    const { title, seller, highestBid } = auction;
    const { amount, bidder } = highestBid;

    const notifySeller = sqs.send(
      new SendMessageCommand({
        QueueUrl: process.env.MAIL_QUEUE_URL!,
        MessageBody: JSON.stringify({
          subject: "Your auction has closed - item sold",
          recipient: seller,
          body: `Your auction for ${title} has closed. ${
            amount > 0
              ? `The winning bid was $${amount} by ${bidder}.`
              : "Unfortunately, your item did not receive any bids."
          }`,
        }),
      }),
    );

    const notifyBidder = bidder
      ? sqs.send(
          new SendMessageCommand({
            QueueUrl: process.env.MAIL_QUEUE_URL!,
            MessageBody: JSON.stringify({
              subject: "You won an auction!",
              recipient: bidder,
              body: `Congratulations! You won the auction for ${title} with a bid of $${amount}. Please contact the seller at ${seller} to arrange payment and delivery.`,
            }),
          }),
        )
      : Promise.resolve();

    return Promise.all([notifySeller, notifyBidder]);
      
  } catch (error) {
    console.log("closeAuction error");
    console.error(`Could not close auction ${auction.id}: ${error}`);
    // throw new createError.InternalServerError(
    //   `Could not close auction ${auction.id}`,
    // );
  }
};