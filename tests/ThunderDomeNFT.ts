import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { ZERO_ADDRESS } from "../constants/constants";

import { ThunderDomeNFT } from "../typechain-types/contracts";

const name = "ThunderDomeNFT";
const symbol = "TDT";

const uri = "1234";
const firstTokenId = "0";
const secondTokenId = "1";

describe("thunderDomeNFT", function () {
  let thunderDomeNFT: ThunderDomeNFT,
    owner: SignerWithAddress,
    addr1: SignerWithAddress,
    addr2: SignerWithAddress,
    addr3: SignerWithAddress,
    addr4: SignerWithAddress;

  beforeEach(async () => {
    const thunderDomeNFTFactory = await ethers.getContractFactory(
      "ThunderDomeNFT"
    );
    [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();
    thunderDomeNFT = await thunderDomeNFTFactory.deploy();
  });

  describe("Deployment", function () {
    it("should have a name", async function () {
      expect(await thunderDomeNFT.name()).to.equal(name);
    });

    it("should have a symbol", async function () {
      expect(await thunderDomeNFT.symbol()).to.equal(symbol);
    });
  });

  describe("Minting", function () {
    it("should return balance of 0 if no tokens had been minted", async function () {
      expect(await thunderDomeNFT.balanceOf(owner.address)).to.equal(0);
    });
    it("should return correct balanceOf after minting tokens", async function () {
      await thunderDomeNFT.safeMint(owner.address, firstTokenId);
      await thunderDomeNFT.safeMint(owner.address, secondTokenId);

      expect(await thunderDomeNFT.balanceOf(owner.address)).to.equal(2);
    });

    it("should revert for a zero address", async function () {
      await expect(thunderDomeNFT.balanceOf(ZERO_ADDRESS)).to.be.revertedWith(
        "ERC721: address zero is not a valid owner"
      );
    });
  });

  describe("Owner", function () {
    it("returns the tokenId owner", async function () {
      await thunderDomeNFT.safeMint(addr1.address, firstTokenId);

      expect(await thunderDomeNFT.ownerOf(firstTokenId)).to.equal(
        addr1.address
      );
    });

    it("reverts an error when tokenId is invalid/untracked", async function () {
      await thunderDomeNFT.safeMint(addr1.address, firstTokenId);

      await expect(thunderDomeNFT.ownerOf(secondTokenId)).to.be.revertedWith(
        "ERC721: invalid token ID"
      );
    });
  });

  describe("approvals", async () => {
    beforeEach(async () => {
      await thunderDomeNFT.safeMint(owner.address, firstTokenId);
      await thunderDomeNFT.safeMint(owner.address, secondTokenId);
    });

    it("has no token prior approvals", async () => {
      expect(await thunderDomeNFT.getApproved(firstTokenId)).to.equal(
        ZERO_ADDRESS
      );
    });

    it("sets approval accordingly", async () => {
      await thunderDomeNFT.approve(addr1.address, firstTokenId);

      expect(await thunderDomeNFT.getApproved(firstTokenId)).to.equal(
        addr1.address
      );
    });

    it("emits an Approval event", async () => {
      await expect(thunderDomeNFT.approve(addr1.address, firstTokenId))
        .to.emit(thunderDomeNFT, "Approval")
        .withArgs(owner.address, addr1.address, firstTokenId);
    });

    it("reverts an error if transfer is un-approved", async () => {
      await expect(
        thunderDomeNFT
          .connect(addr1)
          .transferFrom(owner.address, addr1.address, firstTokenId)
      ).to.be.revertedWith("ERC721: caller is not token owner nor approved");
    });

    it("allows transfers upon approval", async () => {
      await thunderDomeNFT.approve(addr1.address, firstTokenId);
      await expect(
        thunderDomeNFT
          .connect(addr1)
          .transferFrom(owner.address, addr1.address, firstTokenId)
      ).not.to.reverted;
    });

    it("clears the approval for the tokenId after transfer", async () => {
      await thunderDomeNFT.approve(addr1.address, firstTokenId);
      await thunderDomeNFT
        .connect(addr1)
        .transferFrom(owner.address, addr1.address, firstTokenId);

      expect(await thunderDomeNFT.getApproved(firstTokenId)).to.equal(
        ZERO_ADDRESS
      );
    });
  });

  describe("transfers", async () => {
    beforeEach(async () => {
      await thunderDomeNFT.safeMint(owner.address, firstTokenId);
      await thunderDomeNFT.safeMint(owner.address, secondTokenId);

      await thunderDomeNFT.approve(addr1.address, firstTokenId);
      await thunderDomeNFT.setApprovalForAll(thunderDomeNFT.address, true, {
        from: owner.address,
      });
    });

    it("transfers ownership of the token", async () => {
      await thunderDomeNFT.transferFrom(
        owner.address,
        addr1.address,
        firstTokenId
      );

      expect(await thunderDomeNFT.ownerOf(firstTokenId)).to.equal(
        addr1.address
      );
    });

    it("emits Transfer event upon transfer", async () => {
      await expect(
        thunderDomeNFT.transferFrom(owner.address, addr1.address, firstTokenId)
      )
        .to.emit(thunderDomeNFT, "Transfer")
        .withArgs(owner.address, addr1.address, firstTokenId);
    });

    it("adjusts the owner's balances", async () => {
      expect(await thunderDomeNFT.balanceOf(owner.address)).to.equal(2);
      expect(await thunderDomeNFT.balanceOf(addr1.address)).to.equal(0);

      await thunderDomeNFT.transferFrom(
        owner.address,
        addr1.address,
        firstTokenId
      );

      expect(await thunderDomeNFT.balanceOf(owner.address)).to.equal(1);
      expect(await thunderDomeNFT.balanceOf(addr1.address)).to.equal(1);
    });
  });
});
