# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a script that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.ts
```

## sample env

```
STAGING_QUICKNODE_KEY=<YOUR_QUICKNODE_API>
INFURA_API=<YOUR_INFURA_API>
ETHERSCAN_API=<YOUR_ETHERSCAN_API>
PRIVATE_KEY='0x0000000000000000000000000000000000000000'
LOCAL_PRIVATE_KEY='0x0000000000000000000000000000000000000000'

THUNDERDOME_NFT_ADDRESS='0x16377628d5c50aE40951D63134572AB32395677C'
# https://goerli.etherscan.io/address/0x16377628d5c50aE40951D63134572AB32395677C#code
NFT_SALE_ADDRESS='0xfF0Cc93e85150e18BA66102469d6e3613dC8Ef9B'
# https://goerli.etherscan.io/address/0xfF0Cc93e85150e18BA66102469d6e3613dC8Ef9B#code
NFT_BACKEND='localhost:8000/api/v1/products/json'

```
