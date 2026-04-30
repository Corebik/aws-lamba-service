import { closeAuction } from "../lib/closeAuction.js";
import { getEndedAuctions } from "../lib/getEndedAuctions.js";
import createError from "http-errors";

const processAuctions = async () => {

  try{
    const auctionsToClose = await getEndedAuctions();
    const closePromises = auctionsToClose.map((auction) => closeAuction(auction));
    const closedAuctions = await Promise.all(closePromises);

    return {
      statusCode: 200,
      body: JSON.stringify({ closed: closedAuctions.length }),
    };
  }
  catch(error) {
    console.error(`processAuctions error: ${error}`);
    throw new createError.InternalServerError(`processAuctions error: ${error}`);
  }

}

export const handler = processAuctions;