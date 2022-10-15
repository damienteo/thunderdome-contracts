import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { url } from "./ThunderDomeNFT";
import { ZERO_ADDRESS } from "../constants/constants";

const prizeId = 1;

describe("LuckyDraw", function () {
  async function deployLuckyDrawLoadFixture() {
    const ThunderDomeNFT = await ethers.getContractFactory("ThunderDomeNFT");
    const LuckyDraw = await ethers.getContractFactory("LuckyDraw");

    const [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();

    const thunderDomeNFT = await ThunderDomeNFT.deploy();
    const luckyDraw = await LuckyDraw.deploy(thunderDomeNFT.address, prizeId);

    await thunderDomeNFT.safeMint(owner.address, url);
    await thunderDomeNFT.safeMint(owner.address, url);

    return {
      luckyDraw,
      thunderDomeNFT,
      owner,
      addr1,
      addr2,
      addr3,
      addr4,
    };
  }

  async function deployLuckyDrawWithTransferLoadFixture() {
    const { thunderDomeNFT, luckyDraw, owner, addr1, ...props } =
      await loadFixture(deployLuckyDrawLoadFixture);

    await thunderDomeNFT.transferFrom(
      owner.address,
      luckyDraw.address,
      prizeId
    );

    await thunderDomeNFT.safeMint(addr1.address, url);
    await luckyDraw.connect(addr1).enter();

    return { thunderDomeNFT, luckyDraw, owner, addr1, ...props };
  }

  describe("Deployment", function () {
    it("should set the owner as the manager", async function () {
      const { luckyDraw, owner } = await loadFixture(
        deployLuckyDrawLoadFixture
      );

      expect(await luckyDraw.manager()).to.equal(owner.address);
    });
  });

  describe("Entering LuckyDraw", function () {
    it("should not allow a account to enter if user does not have a ThunderDome NFT", async function () {
      const { luckyDraw, addr1 } = await loadFixture(
        deployLuckyDrawLoadFixture
      );

      await expect(luckyDraw.connect(addr1).enter()).to.revertedWith(
        "You need to own an NFT to enter the lucky draw"
      );
    });

    it("should allow one account to enter", async function () {
      const { luckyDraw, thunderDomeNFT, addr1 } = await loadFixture(
        deployLuckyDrawLoadFixture
      );

      expect((await luckyDraw.getPlayers()).length).to.equal(0);

      await thunderDomeNFT.safeMint(addr1.address, url);

      await luckyDraw.connect(addr1).enter();

      expect((await luckyDraw.getPlayers()).length).to.equal(1);
    });

    it("should should emit an event when a user enters the LuckyDraw", async function () {
      const { luckyDraw, thunderDomeNFT, addr1 } = await loadFixture(
        deployLuckyDrawLoadFixture
      );

      expect((await luckyDraw.getPlayers()).length).to.equal(0);

      await thunderDomeNFT.safeMint(addr1.address, url);

      await expect(luckyDraw.connect(addr1).enter())
        .to.emit(luckyDraw, "NewChallenger")
        .withArgs(addr1.address);
    });

    it("should allow multiple accounts to enter", async function () {
      const { luckyDraw, thunderDomeNFT, addr1, addr2, addr3, addr4 } =
        await loadFixture(deployLuckyDrawLoadFixture);

      expect((await luckyDraw.getPlayers()).length).to.equal(0);

      await thunderDomeNFT.safeMint(addr1.address, url);
      await thunderDomeNFT.safeMint(addr2.address, url);
      await thunderDomeNFT.safeMint(addr3.address, url);
      await thunderDomeNFT.safeMint(addr4.address, url);

      await luckyDraw.connect(addr1).enter();
      await luckyDraw.connect(addr2).enter();
      await luckyDraw.connect(addr3).enter();
      await luckyDraw.connect(addr4).enter();

      expect((await luckyDraw.getPlayers()).length).to.equal(4);
    });
  });

  describe("Pick Winner", function () {
    describe("errors", function () {
      it("Should return zero address if pickWinner method not called", async function () {
        const { luckyDraw } = await loadFixture(deployLuckyDrawLoadFixture);

        expect(await luckyDraw.winner()).to.equal(ZERO_ADDRESS);
      });

      it("Should allow only the manager to pick the winner", async function () {
        const { luckyDraw, addr1 } = await loadFixture(
          deployLuckyDrawLoadFixture
        );

        await expect(luckyDraw.connect(addr1).pickWinner()).to.revertedWith(
          "Only manager can pick winner"
        );
      });

      it("Should revert an error if the NFT prize had not been sent to the contract", async function () {
        const { luckyDraw, thunderDomeNFT, addr1 } = await loadFixture(
          deployLuckyDrawLoadFixture
        );

        await thunderDomeNFT.safeMint(addr1.address, url);

        await luckyDraw.connect(addr1).enter();

        await expect(luckyDraw.pickWinner()).to.be.revertedWith(
          "ERC721: caller is not token owner nor approved"
        );
      });
    });

    describe("successful scenario", function () {
      it("Should pick the winner", async function () {
        const { luckyDraw, addr1 } = await loadFixture(
          deployLuckyDrawWithTransferLoadFixture
        );

        await luckyDraw.pickWinner();

        expect(await luckyDraw.winner()).to.equal(addr1.address);
      });

      it("Should emit the WinnerPickedEvent", async function () {
        const { luckyDraw, addr1 } = await loadFixture(
          deployLuckyDrawWithTransferLoadFixture
        );

        await expect(luckyDraw.pickWinner())
          .to.emit(luckyDraw, "WinnerPicked")
          .withArgs(addr1.address);
      });

      it("Should send the token to the right owner", async function () {
        const { luckyDraw, thunderDomeNFT, addr1 } = await loadFixture(
          deployLuckyDrawWithTransferLoadFixture
        );

        expect(await thunderDomeNFT.ownerOf(prizeId)).to.equal(
          luckyDraw.address
        );

        await luckyDraw.pickWinner();

        expect(await thunderDomeNFT.ownerOf(prizeId)).to.equal(addr1.address);
      });

      it("Should not allow entries after winnder is picked", async function () {
        const { luckyDraw, thunderDomeNFT, addr2 } = await loadFixture(
          deployLuckyDrawWithTransferLoadFixture
        );

        await luckyDraw.pickWinner();

        await thunderDomeNFT.safeMint(addr2.address, url);

        await expect(luckyDraw.connect(addr2).enter()).to.revertedWith(
          "Winner has already been picked."
        );
      });
    });
  });
});
