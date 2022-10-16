import { ethers } from "hardhat";

async function deployThunderDomeNFT() {
  const ThunderDomeNFT = await ethers.getContractFactory("ThunderDomeNFT");

  const basic721Token = await ThunderDomeNFT.deploy();

  console.log(`Contract deployed to ${basic721Token.address}`);
}

deployThunderDomeNFT()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
