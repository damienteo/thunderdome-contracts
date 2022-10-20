import { ethers } from "hardhat";

import hre from "hardhat";

import { POKEMON_URLS } from "../constants/constants";

const {
  PRIVATE_KEY = "",
  LOCAL_PRIVATE_KEY = "",
  THUNDERDOME_NFT_ADDRESS = "",
  NFT_SALE_ADDRESS = "",
  NFT_BACKEND = "",
} = process.env;

async function runThunderDomeNFT() {
  const contract = require("../artifacts/contracts/ThunderDomeNFT.sol/ThunderDomeNFT.json");
  const provider = hre.ethers.provider;
  const signer = new ethers.Wallet(LOCAL_PRIVATE_KEY, provider);

  const thunderdomeNFTContract = new ethers.Contract(
    THUNDERDOME_NFT_ADDRESS,
    contract.abi,
    signer
  );

  const nextArray = [...POKEMON_URLS];

  nextArray.splice(-2, 2); // don't mint mew and mewtwo

  const mint = async () => {
    for (const element of nextArray) {
      const url = `${NFT_BACKEND}/${element.name}`;

      const tx = await thunderdomeNFTContract.safeMint(NFT_SALE_ADDRESS, url);

      await tx.wait();
    }
  };

  await mint();
}

runThunderDomeNFT()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
