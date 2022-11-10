import { ethers } from "hardhat";

const MINTER_ROLE = ethers.utils.keccak256(
  ethers.utils.toUtf8Bytes("MINTER_ROLE")
);

async function deployArena() {
  const ExperiencePoints = await ethers.getContractFactory("ExperiencePoints");
  const Arena = await ethers.getContractFactory("Arena");

  const experiencePoints = await ExperiencePoints.deploy();
  await experiencePoints.deployed();

  console.log(
    `ExperiencePoints Contract deployed to ${experiencePoints.address}`
  );

  const arena = await Arena.deploy(experiencePoints.address);
  await arena.deployed();

  console.log(`Arena Contract deployed to ${arena.address}`);

  const approveTxn = await experiencePoints.grantRole(
    MINTER_ROLE,
    arena.address
  );
  approveTxn.wait();

  console.log("Success");
}

deployArena()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
