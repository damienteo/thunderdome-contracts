import { ethers } from "hardhat";

import hre from "hardhat";

const {
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

  const tx = await thunderdomeNFTContract.safeMint(
    NFT_SALE_ADDRESS,
    `${NFT_BACKEND}/charmander`
  );

  const receipt = await tx.wait();

  console.log({ receipt: receipt.events });

  const uri = await thunderdomeNFTContract.tokenURI(32);
  console.log({ uri });
}

runThunderDomeNFT()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
