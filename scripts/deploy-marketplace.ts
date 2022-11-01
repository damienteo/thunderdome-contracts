import { ethers } from "hardhat";

const { THUNDERDOME_NFT_ADDRESS } = process.env;

const COMMISSION = 5;

async function deployMarketPlace() {
  const MarketPlace = await ethers.getContractFactory("MarketPlace");

  const marketPlace = await MarketPlace.deploy(
    THUNDERDOME_NFT_ADDRESS || "",
    COMMISSION
  );

  console.log(`Contract deployed to ${marketPlace.address}`);
}

deployMarketPlace()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
