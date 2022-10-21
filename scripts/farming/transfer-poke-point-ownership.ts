import { ethers } from "hardhat";

import hre from "hardhat";

const {
  LOCAL_PRIVATE_KEY = "",
  POKEMON_CENTER_ADDRESS = "",
  POKEPOINT_ADDRESS = "",
} = process.env;

async function transferPokePointOwnership() {
  const contract = require("../../artifacts/contracts/Farming/PokePoint.sol/PokePoint.json");
  const provider = hre.ethers.provider;
  const signer = new ethers.Wallet(LOCAL_PRIVATE_KEY, provider);

  const pokePointContract = new ethers.Contract(
    POKEPOINT_ADDRESS,
    contract.abi,
    signer
  );

  const tx = await pokePointContract.transferOwnership(POKEMON_CENTER_ADDRESS);

  const receipt = await tx.wait();

  console.log({ receipt });
}

transferPokePointOwnership()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
