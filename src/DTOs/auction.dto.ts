export interface CreateAuctionDto {
title: string;
}

export interface AuctionDto {
id: string;
title: string;
status: "OPEN" | "CLOSED";
createdAt: string;
highestBid: {
  amount: number;
};
}