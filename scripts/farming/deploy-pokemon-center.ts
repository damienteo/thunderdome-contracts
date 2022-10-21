import { ethers } from "hardhat";

const { THUNDERDOME_NFT_ADDRESS = "" } = process.env;

async function deployPokemonCenter() {
  const PokePoint = await ethers.getContractFactory("PokePoint");
  const PokemonCenter = await ethers.getContractFactory("PokemonCenter");

  const pokePoint = await PokePoint.deploy();
  await pokePoint.deployed();

  console.log(`PokePoint Contract deployed to ${pokePoint.address}`);

  const pokemonCenter = await PokemonCenter.deploy(
    pokePoint.address,
    THUNDERDOME_NFT_ADDRESS
  );
  await pokemonCenter.deployed();

  console.log(`Pokemon Center Contract deployed to ${pokemonCenter.address}`);
}

deployPokemonCenter()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
