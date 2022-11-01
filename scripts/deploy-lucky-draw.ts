import { ethers } from "hardhat";

// NOTE: Verification
// hh verify --network goerli --constructor-args scripts/lucky-draw-arguments.ts 0xf3f73C30C101C2B5e8aCf802160032984c96dE47

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
