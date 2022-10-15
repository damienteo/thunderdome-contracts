import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { url } from "./ThunderDomeNFT";

const NFT_TOKEN_PRICE = 5;
const TOKEN_ID = 1;

const WITHDRAWN_AMOUNT = 1;

describe("NFTSale", () => {
  async function deployNFTSaleLoadFixture() {
    const ThunderDomeNFT = await ethers.getContractFactory("ThunderDomeNFT");
    const thunderDomeNFT = await ThunderDomeNFT.deploy();

    const NFTSale = await ethers.getContractFactory("NFTSale");
    const nftSale = await NFTSale.deploy(
      NFT_TOKEN_PRICE,
      thunderDomeNFT.address
    );

    const [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();

    await thunderDomeNFT.safeMint(owner.address, url);
    await thunderDomeNFT.safeMint(owner.address, url);

    return {
      nftSale,
      thunderDomeNFT,
      owner,
      addr1,
      addr2,
      addr3,
      addr4,
    };
  }

  async function deployNFTSaleWithTransferLoadFixture() {
    const { nftSale, thunderDomeNFT, owner, ...props } = await loadFixture(
      deployNFTSaleLoadFixture
    );

    await thunderDomeNFT.transferFrom(owner.address, nftSale.address, TOKEN_ID);

    return {
      nftSale,
      thunderDomeNFT,
      owner,
      ...props,
    };
  }

  describe("Deployment", async () => {
    it("defines the price as provided in parameters", async () => {
      const { nftSale } = await loadFixture(deployNFTSaleLoadFixture);

      expect(await nftSale.nftPrice()).to.equal(NFT_TOKEN_PRICE);
    });

    it("defines adminPool as 0", async () => {
      const { nftSale } = await loadFixture(deployNFTSaleLoadFixture);

      expect(await nftSale.adminPool()).to.equal(0);
    });
  });

  describe("Purchase", async () => {
    it("reverts an error when the user did not send enough value", async () => {
      const { nftSale, addr1 } = await loadFixture(deployNFTSaleLoadFixture);

      await expect(
        nftSale.connect(addr1).purchaseNFT(TOKEN_ID, {
          value: NFT_TOKEN_PRICE - 1,
        })
      ).to.be.revertedWith("Insufficient value sent");
    });

    it("reverts an error when the NFT is not available in the TokenSale contract", async () => {
      const { nftSale, addr1 } = await loadFixture(deployNFTSaleLoadFixture);

      await expect(
        nftSale.connect(addr1).purchaseNFT(TOKEN_ID, {
          value: NFT_TOKEN_PRICE,
        })
      ).to.be.revertedWith("ERC721: caller is not token owner nor approved");
    });

    it("transfers the NFT after purchase", async () => {
      const { nftSale, thunderDomeNFT, addr1 } = await loadFixture(
        deployNFTSaleWithTransferLoadFixture
      );

      await nftSale.connect(addr1).purchaseNFT(TOKEN_ID, {
        value: NFT_TOKEN_PRICE,
      });

      expect(await thunderDomeNFT.ownerOf(TOKEN_ID)).to.equal(addr1.address);
    });

    it("emits an event after purchase", async () => {
      const { nftSale, addr1 } = await loadFixture(
        deployNFTSaleWithTransferLoadFixture
      );

      await expect(
        nftSale.connect(addr1).purchaseNFT(TOKEN_ID, {
          value: NFT_TOKEN_PRICE,
        })
      )
        .to.emit(nftSale, "Purchased")
        .withArgs(addr1.address, TOKEN_ID, NFT_TOKEN_PRICE);
    });

    it("update the pool accounts correctly", async () => {
      const { nftSale, addr1 } = await loadFixture(
        deployNFTSaleWithTransferLoadFixture
      );

      await nftSale.connect(addr1).purchaseNFT(TOKEN_ID, {
        value: NFT_TOKEN_PRICE,
      });

      const nextAdminPool = await nftSale.adminPool();
      expect(nextAdminPool).to.equal(NFT_TOKEN_PRICE);
    });
  });

  describe("When the owner withdraw from the Shop contract", async () => {
    it("updates Admin pool correctly", async () => {
      const { nftSale, addr1 } = await loadFixture(
        deployNFTSaleWithTransferLoadFixture
      );

      const purchaseNFTTx = await nftSale.connect(addr1).purchaseNFT(TOKEN_ID, {
        value: NFT_TOKEN_PRICE,
      });
      await purchaseNFTTx.wait();

      const withDrawTx = await nftSale.withdraw(WITHDRAWN_AMOUNT);
      await withDrawTx.wait();

      const adminPool = await nftSale.adminPool();

      expect(adminPool).to.equal(NFT_TOKEN_PRICE - WITHDRAWN_AMOUNT);
    });

    it("updates the owner account correctly", async () => {
      const { nftSale, thunderDomeNFT, addr1, owner } = await loadFixture(
        deployNFTSaleWithTransferLoadFixture
      );

      const purchaseNFTTx = await nftSale.connect(addr1).purchaseNFT(TOKEN_ID, {
        value: NFT_TOKEN_PRICE,
      });
      await purchaseNFTTx.wait();

      const prevBalance = await owner.getBalance();

      const withDrawTx = await nftSale.withdraw(WITHDRAWN_AMOUNT);
      const withDrawTxReceipt = await withDrawTx.wait();

      const { gasUsed, effectiveGasPrice } = withDrawTxReceipt;
      const gasCost = gasUsed.mul(effectiveGasPrice);

      const nextBalance = await owner.getBalance();
      const diff = nextBalance.sub(prevBalance);

      const diffWithoutGasCost = diff.add(gasCost);

      expect(diffWithoutGasCost).to.equal(WITHDRAWN_AMOUNT);
    });
  });
});
