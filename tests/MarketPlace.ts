import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { url } from "./ThunderDomeNFT";

import { MarketPlace, ThunderDomeNFT } from "../typechain-types/contracts";
import { ZERO_ADDRESS } from "../constants/constants";

const COMMISSION = 5;
const TOKEN_ID = 0;

const WITHDRAWN_AMOUNT = 1;

const nextListingPrice = COMMISSION + 1;

describe("MarketPlace", () => {
  let thunderDomeNFT: ThunderDomeNFT,
    marketPlace: MarketPlace,
    owner: SignerWithAddress,
    addr1: SignerWithAddress,
    addr2: SignerWithAddress,
    addr3: SignerWithAddress,
    addr4: SignerWithAddress;

  beforeEach(async () => {
    const ThunderDomeNFT = await ethers.getContractFactory("ThunderDomeNFT");
    thunderDomeNFT = await ThunderDomeNFT.deploy();

    const MarketPlace = await ethers.getContractFactory("MarketPlace");
    marketPlace = await MarketPlace.deploy(thunderDomeNFT.address, COMMISSION);

    [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();

    await thunderDomeNFT.safeMint(addr1.address, url);

    return {
      marketPlace,
      thunderDomeNFT,
      owner,
      addr1,
      addr2,
      addr3,
      addr4,
    };
  });

  describe("Deployment", async () => {
    it("defines the commission as provided in parameters", async () => {
      expect(await marketPlace.commission()).to.equal(COMMISSION);
    });

    it("defines adminPool as 0", async () => {
      expect(await marketPlace.adminPool()).to.equal(0);
    });

    it("defines publicPool as 0", async () => {
      expect(await marketPlace.publicPool()).to.equal(0);
    });
  });

  describe("Make Listing", async () => {
    beforeEach(async () => {
      await thunderDomeNFT
        .connect(addr1)
        .approve(marketPlace.address, TOKEN_ID);
    });

    it("allows the user to make a listing for their NFT", async () => {
      await expect(
        marketPlace.connect(addr1).makeListing(TOKEN_ID, nextListingPrice)
      ).not.to.be.reverted;

      const listing = await marketPlace.listings(TOKEN_ID);

      expect(listing.seller).to.equal(addr1.address);
      expect(listing.buyer).to.equal(ZERO_ADDRESS);
      expect(listing.listingPrice).to.equal(nextListingPrice);
      expect(listing.buyerDeposit).to.equal(0);

      expect(await thunderDomeNFT.ownerOf(TOKEN_ID)).to.equal(
        marketPlace.address
      );
    });

    it("emits a ListingMade event upon listing", async () => {
      await expect(
        marketPlace.connect(addr1).makeListing(TOKEN_ID, nextListingPrice)
      )
        .to.emit(marketPlace, "ListingMade")
        .withArgs(addr1.address, TOKEN_ID, nextListingPrice);
    });

    it("reverts if price offer is equal to commission", async () => {
      await expect(
        marketPlace.connect(addr1).makeListing(TOKEN_ID, COMMISSION)
      ).to.be.revertedWith("The listing price is too low");
    });

    it("reverts if price offer is less than commission", async () => {
      await expect(
        marketPlace.connect(addr1).makeListing(TOKEN_ID, COMMISSION - 1)
      ).to.be.revertedWith("The listing price is too low");
    });
  });

  describe("Withdraw Listing", async () => {
    beforeEach(async () => {
      await thunderDomeNFT
        .connect(addr1)
        .approve(marketPlace.address, TOKEN_ID);
      await marketPlace.connect(addr1).makeListing(TOKEN_ID, nextListingPrice);
    });

    it("allows the user to withdraw the listing for their NFT", async () => {
      await marketPlace.connect(addr1).withdrawListing(TOKEN_ID);

      expect(await thunderDomeNFT.ownerOf(TOKEN_ID)).to.equal(addr1.address);

      const listing = await marketPlace.listings(TOKEN_ID);

      expect(listing.seller).to.equal(ZERO_ADDRESS);
      expect(listing.buyer).to.equal(ZERO_ADDRESS);
    });

    it("emits a ListingWithdrawn event upon withdrawal of the listing", async () => {
      await expect(marketPlace.connect(addr1).withdrawListing(TOKEN_ID))
        .to.emit(marketPlace, "ListingWithdrawn")
        .withArgs(addr1.address, TOKEN_ID);
    });

    it("reverts if person making the withdrawal is not the person who made the listing", async () => {
      await expect(marketPlace.withdrawListing(TOKEN_ID)).to.be.revertedWith(
        "Only seller can withdraw the listing"
      );
    });
  });
});
