import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { url } from "./ThunderDomeNFT";

import { MarketPlace, ThunderDomeNFT } from "../typechain-types/contracts";

const COMMISSION = 5;
const TOKEN_ID = 0;

const WITHDRAWN_AMOUNT = 1;

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

    await thunderDomeNFT.safeMint(owner.address, url);
    await thunderDomeNFT.safeMint(owner.address, url);

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
    beforeEach(async () => [
      thunderDomeNFT.connect(addr1).approve(marketPlace.address, TOKEN_ID),
    ]);

    it("allows the user to make a listing for their NFT", async () => {
      await marketPlace.connect(addr1).makeListing(TOKEN_ID, COMMISSION + 1);
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
});
