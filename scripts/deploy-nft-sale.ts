import { ethers } from "hardhat";

const { THUNDERDOME_NFT_ADDRESS } = process.env;

async function deployNFTSale() {
  const NFTSale = await ethers.getContractFactory("NFTSale");

  const nftSale = await NFTSale.deploy(5, THUNDERDOME_NFT_ADDRESS || "");

  console.log(`Contract deployed to ${nftSale.address}`);
}

deployNFTSale()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
