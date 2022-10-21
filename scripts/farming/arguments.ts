require("dotenv").config();

const { POKEPOINT_ADDRESS, THUNDERDOME_NFT_ADDRESS } = process.env;

module.exports = [POKEPOINT_ADDRESS, THUNDERDOME_NFT_ADDRESS];
