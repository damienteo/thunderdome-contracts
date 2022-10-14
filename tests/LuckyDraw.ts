import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { url } from "./ThunderDomeNFT";
import { ZERO_ADDRESS } from "../constants/constants";

describe("LuckyDraw", function () {
  async function deployLuckyDrawLoadFixture() {
    const ThunderDomeNFT = await ethers.getContractFactory("ThunderDomeNFT");
    const LuckyDraw = await ethers.getContractFactory("LuckyDraw");

    const [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();

    const ThunderDomeNFTContract = await ThunderDomeNFT.deploy();
    const LuckyDrawContract = await LuckyDraw.deploy(
      ThunderDomeNFTContract.address
    );

    return {
      LuckyDrawContract,
      ThunderDomeNFTContract,
      owner,
      addr1,
      addr2,
      addr3,
      addr4,
    };
  }

  describe("Deployment", function () {
    it("should set the owner as the manager", async function () {
      const { LuckyDrawContract, owner } = await loadFixture(
        deployLuckyDrawLoadFixture
      );

      expect(await LuckyDrawContract.manager()).to.equal(owner.address);
    });
  });

  describe("Entering LuckyDraw", function () {
    it("should not allow a account to enter if user does not have a ThunderDome NFT", async function () {
      const { LuckyDrawContract, addr1 } = await loadFixture(
        deployLuckyDrawLoadFixture
      );

      await expect(LuckyDrawContract.connect(addr1).enter()).to.revertedWith(
        "You need to own an NFT to enter the lucky draw"
      );
    });

    it("should allow one account to enter", async function () {
      const { LuckyDrawContract, ThunderDomeNFTContract, addr1 } =
        await loadFixture(deployLuckyDrawLoadFixture);

      expect((await LuckyDrawContract.getPlayers()).length).to.equal(0);

      await ThunderDomeNFTContract.safeMint(addr1.address, url);

      await LuckyDrawContract.connect(addr1).enter();

      expect((await LuckyDrawContract.getPlayers()).length).to.equal(1);
    });

    it("should should emit an event when a user enters the LuckyDraw", async function () {
      const { LuckyDrawContract, ThunderDomeNFTContract, addr1 } =
        await loadFixture(deployLuckyDrawLoadFixture);

      expect((await LuckyDrawContract.getPlayers()).length).to.equal(0);

      await ThunderDomeNFTContract.safeMint(addr1.address, url);

      await expect(LuckyDrawContract.connect(addr1).enter())
        .to.emit(LuckyDrawContract, "NewChallenger")
        .withArgs(addr1.address);
    });

    it("should allow multiple accounts to enter", async function () {
      const {
        LuckyDrawContract,
        ThunderDomeNFTContract,
        addr1,
        addr2,
        addr3,
        addr4,
      } = await loadFixture(deployLuckyDrawLoadFixture);

      expect((await LuckyDrawContract.getPlayers()).length).to.equal(0);

      await ThunderDomeNFTContract.safeMint(addr1.address, url);
      await ThunderDomeNFTContract.safeMint(addr2.address, url);
      await ThunderDomeNFTContract.safeMint(addr3.address, url);
      await ThunderDomeNFTContract.safeMint(addr4.address, url);

      await LuckyDrawContract.connect(addr1).enter();
      await LuckyDrawContract.connect(addr2).enter();
      await LuckyDrawContract.connect(addr3).enter();
      await LuckyDrawContract.connect(addr4).enter();

      expect((await LuckyDrawContract.getPlayers()).length).to.equal(4);
    });
  });

  describe("Pick Winner", function () {
    it("Should return zero address if pickWinner method not called", async function () {
      const { LuckyDrawContract } = await loadFixture(
        deployLuckyDrawLoadFixture
      );

      expect(await LuckyDrawContract.winner()).to.equal(ZERO_ADDRESS);
    });

    it("Should allow only the manager to pick the winner", async function () {
      const { LuckyDrawContract, addr1 } = await loadFixture(
        deployLuckyDrawLoadFixture
      );

      await expect(
        LuckyDrawContract.connect(addr1).pickWinner()
      ).to.revertedWith("Only manager can pick winner");
    });

    it("Should pick the winner", async function () {
      const { LuckyDrawContract, ThunderDomeNFTContract, addr1 } =
        await loadFixture(deployLuckyDrawLoadFixture);

      await ThunderDomeNFTContract.safeMint(addr1.address, url);

      await LuckyDrawContract.connect(addr1).enter();

      await LuckyDrawContract.pickWinner();

      expect(await LuckyDrawContract.winner()).to.equal(addr1.address);
    });

    it("Should emit the WinnerPickedEvent", async function () {
      const { LuckyDrawContract, ThunderDomeNFTContract, addr1 } =
        await loadFixture(deployLuckyDrawLoadFixture);

      await ThunderDomeNFTContract.safeMint(addr1.address, url);

      await LuckyDrawContract.connect(addr1).enter();

      await expect(LuckyDrawContract.pickWinner())
        .to.emit(LuckyDrawContract, "WinnerPicked")
        .withArgs(addr1.address);
    });

    it("Should not allow entries after winnder is picked", async function () {
      const { LuckyDrawContract, ThunderDomeNFTContract, addr1, addr2 } =
        await loadFixture(deployLuckyDrawLoadFixture);

      await ThunderDomeNFTContract.safeMint(addr1.address, url);

      await LuckyDrawContract.connect(addr1).enter();

      await LuckyDrawContract.pickWinner();

      await ThunderDomeNFTContract.safeMint(addr2.address, url);

      await expect(LuckyDrawContract.connect(addr2).enter()).to.revertedWith(
        "Winner has already been picked."
      );
    });
  });
});
