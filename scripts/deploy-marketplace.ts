import { ethers } from "hardhat";

// NOTE: Verification
// hh verify --network goerli --constructor-args scripts/market-place-arguments.ts 0xf3f73C30C101C2B5e8aCf802160032984c96dE47

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
