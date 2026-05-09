import { APIGatewayProxyEvent } from "aws-lambda";
import { getAuctionById } from "./getAuction.js";
import { uploadImageToS3 } from "../lib/uploadImageToS3.js";
import { setAuctionImageUrl } from "../lib/setAuctionImageUrl.js";

import middy from "@middy/core";
import httpErrorHandler from "@middy/http-error-handler";
import validator from "@middy/validator";

import createError from "http-errors";
import { Auth0AuthorizerContext } from "../types/requestContext.type.js";
import uploadImageSchema from "../schemas/uploadImage.schema.js";
import { transpileSchema } from "@middy/validator/transpile";

type UploadAuctionImageEvent = Omit<APIGatewayProxyEvent, "body"> & {
  body: string;
  requestContext: APIGatewayProxyEvent["requestContext"] & {
    authorizer: Auth0AuthorizerContext;
  };
};

const uploadAuctionImage = async (event: UploadAuctionImageEvent) => {

  const { id } = event.pathParameters ?? {};
  const { email } = event.requestContext.authorizer;
  const auction = await getAuctionById(id);
  const base64 = event.body?.replace(/^data:image\/\w+;base64,/, "") ?? "";
  const buffer = Buffer.from(base64, "base64");

  // Validatie auction ownership
  if(auction.seller !== email)
    throw new createError.Forbidden("You can only upload images for your own auctions!");

  
  try {
    const imageUrl = await uploadImageToS3(`${auction.id}.jpg`, buffer);
    const updatedAuction = await setAuctionImageUrl(auction.id, imageUrl);

    return{
      statusCode: 200,
      body: JSON.stringify({ message: "Image uploaded successfully!", auction: updatedAuction }),
    }
  } catch (error) {
    console.error(`uploadAuctionImage error: ${error}`);
    throw new createError.InternalServerError(`Could not upload image for auction ${auction.id}: ${error}`);
  }
};

export const handler = middy(uploadAuctionImage)
.use(httpErrorHandler())
.use(validator({ eventSchema: transpileSchema(uploadImageSchema), }))