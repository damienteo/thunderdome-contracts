import { ethers } from "hardhat";

import hre from "hardhat";

const {
  LOCAL_PRIVATE_KEY = "",
  PRIVATE_KEY = "",
  THUNDERDOME_NFT_ADDRESS = "",
  NFT_SALE_ADDRESS = "",
  NFT_BACKEND = "",
  LUCKY_DRAW_ADDRESS = "",
} = process.env;

async function runThunderDomeNFT() {
  const contract = require("../artifacts/contracts/ThunderDomeNFT.sol/ThunderDomeNFT.json");
  const provider = hre.ethers.provider;
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);

  const thunderdomeNFTContract = new ethers.Contract(
    THUNDERDOME_NFT_ADDRESS,
    contract.abi,
    signer
  );

  console.log({ LUCKY_DRAW_ADDRESS });

  const tx = await thunderdomeNFTContract.safeMint(
    LUCKY_DRAW_ADDRESS,
    `${NFT_BACKEND}/mew`
  );

  await tx.wait();
}

runThunderDomeNFT()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
