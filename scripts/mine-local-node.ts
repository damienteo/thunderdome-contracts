import hre from "hardhat";

async function mineBlocks() {
  await hre.network.provider.send("hardhat_mine", ["0x100"]);

  console.log(`Mined!`);
}

mineBlocks()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
