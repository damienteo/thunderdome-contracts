import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

require("dotenv").config();

const { STAGING_QUICKNODE_KEY, INFURA_API, PRIVATE_KEY, ETHERSCAN_API } =
  process.env;

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  defaultNetwork: "localhost",
  networks: {
    goerli: {
      url: INFURA_API,
      accounts: [PRIVATE_KEY || ""],
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API,
  },
  paths: { tests: "tests" },
};

export default config;
