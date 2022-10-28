import { ethers } from "hardhat";

const { THUNDERDOME_NFT_ADDRESS } = process.env;

const CURRENT_PRIZE_TOKEN_ID = 336;

async function deployLuckyDraw() {
  const LuckyDraw = await ethers.getContractFactory("LuckyDraw");

  const luckyDraw = await LuckyDraw.deploy(
    THUNDERDOME_NFT_ADDRESS || "",
    CURRENT_PRIZE_TOKEN_ID
  );

  console.log(`Contract deployed to ${luckyDraw.address}`);
}

deployLuckyDraw()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
