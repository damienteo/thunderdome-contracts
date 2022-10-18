require("dotenv").config();

const { THUNDERDOME_NFT_ADDRESS } = process.env;

module.exports = [5, THUNDERDOME_NFT_ADDRESS];
