require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();  

const { LISK_SEPOLIA_RPC_URL, PRIVATE_KEY } = process.env;

module.exports = {
  solidity: "0.8.28",
  networks: {
    'lisk-sepolia': {
      url: LISK_SEPOLIA_RPC_URL || "",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
};