import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { url } from "../ThunderDomeNFT";

import {
  PokemonCenter,
  PokePoint,
} from "../../typechain-types/contracts/Farming";
import { ThunderDomeNFT, NFTSale } from "../../typechain-types/contracts";

const NFT_TOKEN_PRICE = 5;
const tokenId: number = 0;
const nextTokenId = tokenId + 1;
const subsequentTokenId = nextTokenId + 1;
const REWARDS_RATE = 200;

describe("PokemonCenter", () => {
  let pokemonCenter: PokemonCenter,
    pokePoint: PokePoint,
    thunderDomeNFT: ThunderDomeNFT,
    nftSale: NFTSale,
    owner: SignerWithAddress,
    addr1: SignerWithAddress,
    addr2: SignerWithAddress,
    addr3: SignerWithAddress,
    addr4: SignerWithAddress;

  beforeEach(async () => {
    const PokePointFactory = await ethers.getContractFactory("PokePoint");
    pokePoint = await PokePointFactory.deploy();

    const ThunderDomeNFTFactory = await ethers.getContractFactory(
      "ThunderDomeNFT"
    );
    thunderDomeNFT = await ThunderDomeNFTFactory.deploy();

    const PokemonCenterFactory = await ethers.getContractFactory(
      "PokemonCenter"
    );
    pokemonCenter = await PokemonCenterFactory.deploy(
      pokePoint.address,
      thunderDomeNFT.address
    );
    const NFTSaleFactory = await ethers.getContractFactory("NFTSale");
    nftSale = await NFTSaleFactory.deploy(
      NFT_TOKEN_PRICE,
      thunderDomeNFT.address
    );

    [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();
  });

  describe("deployment", async () => {
    it("should not have pokePoint balances for addresses", async () => {
      expect(await pokemonCenter.pokePointBalance(addr1.address)).to.equal(0);
    });

    it("should not have pokemon deposited for addresses", async () => {
      await expect(pokemonCenter.depositedPokemon(addr1.address, tokenId)).to.be
        .reverted;
    });

    it("should not set isDeposited to true for addresses", async () => {
      expect(await pokemonCenter.isDeposited(addr1.address)).to.equal(false);
    });
  });

  describe("depositing pokemon", async () => {
    beforeEach(async () => {
      await thunderDomeNFT.safeMint(nftSale.address, url);
      await thunderDomeNFT.safeMint(nftSale.address, url);

      await nftSale
        .connect(addr1)
        .purchaseNFT(tokenId, { value: NFT_TOKEN_PRICE });
      await nftSale
        .connect(addr1)
        .purchaseNFT(nextTokenId, { value: NFT_TOKEN_PRICE });

      await thunderDomeNFT
        .connect(addr1)
        .approve(pokemonCenter.address, tokenId);

      await expect(pokemonCenter.connect(addr1).deposit(tokenId)).not.to
        .reverted;

      await thunderDomeNFT
        .connect(addr1)
        .approve(pokemonCenter.address, nextTokenId);
      await expect(pokemonCenter.connect(addr1).deposit(nextTokenId)).not.to
        .reverted;
    });

    it("should update user's deposit balance after depositing pokemon", async () => {
      expect(
        await pokemonCenter.depositedPokemon(addr1.address, tokenId)
      ).to.equal(tokenId);
      expect(
        await pokemonCenter.depositedPokemon(addr1.address, nextTokenId)
      ).to.equal(nextTokenId);
      expect(await pokemonCenter.getNumberOfDeposits(addr1.address)).to.equal(
        2
      );
    });

    it("should update user's isDeposited to true after depositing pokemon", async () => {
      expect(await pokemonCenter.isDeposited(addr1.address)).to.equal(true);
    });

    it("should emit a Deposited event after depositing pokemon", async () => {
      await thunderDomeNFT.safeMint(addr2.address, url);

      await thunderDomeNFT
        .connect(addr2)
        .approve(pokemonCenter.address, subsequentTokenId);

      await expect(pokemonCenter.connect(addr2).deposit(subsequentTokenId))
        .to.emit(pokemonCenter, "Deposited")
        .withArgs(addr2.address, subsequentTokenId);
    });

    it("should not accept deposit if there was no approval by the owner", async () => {
      await thunderDomeNFT.safeMint(addr2.address, url);

      await expect(
        pokemonCenter.connect(addr2).deposit(subsequentTokenId)
      ).to.be.revertedWith("ERC721: caller is not token owner nor approved");
    });

    it("should not accept deposits from wallet which does not own the pokemon", async () => {
      await thunderDomeNFT.safeMint(addr2.address, url);

      await expect(
        pokemonCenter.connect(addr3).deposit(subsequentTokenId)
      ).to.be.revertedWith("You do not own that Pokemon");
    });

    it("should not accept deposits of unminted pokemons", async () => {
      await expect(
        pokemonCenter.connect(addr3).deposit(subsequentTokenId)
      ).to.be.revertedWith("ERC721: invalid token ID");
    });

    it("should not allow more than 6 pokemon to be deposited per owner", async () => {
      const fourthTokenId = 4;
      const fifthTokenId = 5;
      const sixthTokenId = 6;
      const seventhTokenId = 7;

      const mintingArray = [
        { id: subsequentTokenId },
        { id: fourthTokenId },
        { id: fifthTokenId },
        { id: sixthTokenId },
        { id: seventhTokenId },
        { id: seventhTokenId }, // Issue with seventh token not minted in promise below
      ];

      await Promise.all(
        mintingArray.map(() => thunderDomeNFT.safeMint(nftSale.address, url))
      );

      const approvingArray = [...mintingArray];
      approvingArray.pop();

      await Promise.all(
        approvingArray.map(({ id }) =>
          nftSale.connect(addr1).purchaseNFT(id, { value: NFT_TOKEN_PRICE })
        )
      );

      await Promise.all(
        approvingArray.map(({ id }) =>
          thunderDomeNFT.connect(addr1).approve(pokemonCenter.address, id)
        )
      );

      const depositingArray = [...approvingArray];
      depositingArray.pop(); // remove seventhTokenId, which will cause error

      await Promise.all(
        depositingArray.map(({ id }) =>
          pokemonCenter.connect(addr1).deposit(id)
        )
      );

      const numberOfDeposits = await pokemonCenter.getNumberOfDeposits(
        addr1.address
      );
      expect(numberOfDeposits).to.equal(6);

      await expect(
        pokemonCenter.connect(addr1).deposit(seventhTokenId)
      ).to.be.revertedWith("You can deposit only up to six pokemon");
    });
  });

  describe("withdrawing pokemon", () => {
    beforeEach(async () => {
      await thunderDomeNFT.safeMint(addr1.address, url);
      await thunderDomeNFT
        .connect(addr1)
        .approve(pokemonCenter.address, tokenId);

      await expect(pokemonCenter.connect(addr1).deposit(tokenId)).not.to
        .reverted;
      await expect(pokemonCenter.connect(addr1).withdraw(tokenId)).not.to
        .reverted;
    });

    it("should update user's pokePoints balance after withdrawing", async () => {
      expect(await pokemonCenter.getNumberOfDeposits(addr1.address)).to.equal(
        0
      );
      await expect(pokemonCenter.depositedPokemon(addr1.address, 0)).to.be
        .reverted;
    });

    it("should update user's isDeposited to false after withdrawing", async () => {
      expect(await pokemonCenter.isDeposited(addr1.address)).to.equal(false);
    });

    it("should emit an Withdraw event after staking", async () => {
      await thunderDomeNFT.safeMint(addr2.address, url);
      await thunderDomeNFT
        .connect(addr2)
        .approve(pokemonCenter.address, nextTokenId);
      await pokemonCenter.connect(addr2).deposit(nextTokenId);

      await expect(pokemonCenter.connect(addr2).withdraw(nextTokenId))
        .to.emit(pokemonCenter, "Withdrawal")
        .withArgs(addr2.address, nextTokenId);
    });

    it("should not accept withdrawal from wallets without pokemons", async () => {
      await expect(
        pokemonCenter.connect(addr3).withdraw(tokenId)
      ).to.be.revertedWith("You don't have that pokemon to withdraw");
    });

    it("should not accept withdrawal if pokemon was never deposited in the first place", async () => {
      await thunderDomeNFT.safeMint(addr2.address, url);
      await thunderDomeNFT
        .connect(addr2)
        .approve(pokemonCenter.address, nextTokenId);

      await expect(
        pokemonCenter.connect(addr2).withdraw(nextTokenId)
      ).to.be.revertedWith("You don't have that pokemon to withdraw");
    });
  });

  describe("Withdraw yield", () => {
    beforeEach(async () => {
      await pokePoint.transferOwnership(pokemonCenter.address);
      await thunderDomeNFT.safeMint(addr1.address, url);
      await thunderDomeNFT.safeMint(addr1.address, url);
      await thunderDomeNFT
        .connect(addr1)
        .approve(pokemonCenter.address, tokenId);
      await thunderDomeNFT
        .connect(addr1)
        .approve(pokemonCenter.address, nextTokenId);

      await expect(pokemonCenter.connect(addr1).deposit(tokenId)).not.to
        .reverted;
    });

    it("should return correct start block", async () => {
      const startTime = await pokemonCenter.startBlockNumber(addr1.address);
      expect(Number(startTime)).to.be.greaterThan(0);

      // https://hardhat.org/hardhat-network/docs/reference#hardhat_mine
      // mine 256 blocks
      // (256).toString(16)
      await hre.network.provider.send("hardhat_mine", ["0x100"]);

      const yieldTime = await pokemonCenter.calculateYieldBlocks(addr1.address);
      expect(yieldTime).to.equal(256);
    });

    it("should return the correct total yield", async () => {
      // https://hardhat.org/hardhat-network/docs/reference#hardhat_mine
      // mine 256 blocks
      await hre.network.provider.send("hardhat_mine", ["0x100"]);

      expect(await pokemonCenter.calculateTotalYield(addr1.address)).to.equal(
        REWARDS_RATE * 256
      );
    });

    it("should return the correct total yield after depositing extra pokemon", async () => {
      await hre.network.provider.send("hardhat_mine", ["0x100"]);

      await pokemonCenter.connect(addr1).deposit(nextTokenId);

      await hre.network.provider.send("hardhat_mine", ["0x100"]);

      // previous balance gets added to pokePointsBalance to be withdrawn at a future time
      expect(await pokemonCenter.pokePointBalance(addr1.address)).to.equal(
        REWARDS_RATE * 257 // extra block due to deposit block mined above
      );

      const depositedPokemon = await pokemonCenter.getNumberOfDeposits(
        addr1.address
      );

      // new yield is based on new yield rate with extra deposited pokemon
      expect(await pokemonCenter.calculateTotalYield(addr1.address)).to.equal(
        REWARDS_RATE * 256 * Number(depositedPokemon)
      );
    });

    it("should not revert when withdrawing yield", async () => {
      await expect(pokemonCenter.connect(addr1).withdrawYield()).not.to
        .reverted;
    });

    it("should revert if user had never had pokemon deposited", async () => {
      await expect(
        pokemonCenter.connect(addr2).withdrawYield()
      ).to.be.revertedWith("You have nothing to withdraw");
    });

    it("should revert if user does not have yield to withdraw", async () => {
      await pokemonCenter.connect(addr1).withdraw(tokenId);

      await pokemonCenter.connect(addr1).withdrawYield();

      await expect(
        pokemonCenter.connect(addr1).withdrawYield()
      ).to.be.revertedWith("You have nothing to withdraw");
    });

    it("should emit a YieldWithdrawn event after withdrawing yield", async () => {
      await thunderDomeNFT.safeMint(addr2.address, url);
      await thunderDomeNFT
        .connect(addr2)
        .approve(pokemonCenter.address, subsequentTokenId);
      await pokemonCenter.connect(addr2).deposit(subsequentTokenId);

      await expect(pokemonCenter.connect(addr2).withdrawYield()).to.emit(
        pokemonCenter,
        "YieldWithdrawal"
      );
    });

    describe("impact of yield withdrawn", () => {
      let expectedYield: number;

      beforeEach(async () => {
        await hre.network.provider.send("hardhat_mine", ["0x100"]);

        const totalYield = await pokemonCenter.calculateTotalYield(
          addr1.address
        );
        expectedYield = Number(ethers.utils.formatEther(totalYield));

        await pokemonCenter.connect(addr1).withdrawYield();
      });

      it("should safeMint the correct amount of reward tokens when withdrawing yield", async () => {
        const supply = await pokePoint.totalSupply();
        const nextSupply = Number(ethers.utils.formatEther(supply));

        expect(nextSupply).to.be.approximately(
          expectedYield,
          0.00000000000002 // 20000 wei
        );
      });

      it("should transfer the correct amount of tokens to the user who withdrew the yield", async () => {
        const balance = await pokePoint.balanceOf(addr1.address);
        const nextBalance = Number(ethers.utils.formatEther(balance));

        expect(nextBalance).to.be.approximately(
          expectedYield,
          0.00000000000002
        );
      });

      it("user balance should equal pokepoint total supply", async () => {
        const balance = await pokePoint.balanceOf(addr1.address);
        const supply = await pokePoint.totalSupply();

        expect(balance).to.equal(supply);
      });

      it("should update pokePointBalance after yield is withdrawn", async () => {
        const balance = await pokemonCenter.pokePointBalance(addr1.address);

        expect(balance).to.equal(0);
      });
    });
  });

  describe("return PokePoint contract ownership", () => {
    beforeEach(async () => {
      await pokePoint.transferOwnership(pokemonCenter.address);
      expect(await pokePoint.owner()).to.equal(pokemonCenter.address);
    });

    it("returns ownership", async () => {
      await pokemonCenter.returnPokePointsOwnership();
      expect(await pokePoint.owner()).to.equal(owner.address);
    });

    it("does not allow non-owner to return ownership", async () => {
      await expect(
        pokemonCenter.connect(addr1).returnPokePointsOwnership()
      ).to.be.revertedWith("Only owner can call this");
    });
  });
});
