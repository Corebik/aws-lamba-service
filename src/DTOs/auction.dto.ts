export interface CreateAuctionDto {
title: string;
}

export interface AuctionDto {
id: string;
title: string;
status: "OPEN" | "CLOSED";
createdAt: string;
endingAt: string;
highestBid: {
  amount: number;
  bidder?: string;
};
seller: string;
}