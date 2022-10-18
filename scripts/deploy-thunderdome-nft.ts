import { ethers } from "hardhat";

async function deployThunderDomeNFT() {
  const ThunderDomeNFT = await ethers.getContractFactory("ThunderDomeNFT");

  const thunderDomeNFT = await ThunderDomeNFT.deploy();

  console.log(`Contract deployed to ${thunderDomeNFT.address}`);
}

deployThunderDomeNFT()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
