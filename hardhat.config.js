require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: {
        version: "0.8.16",
        settings: {
            viaIR: true,
            optimizer: {
                enabled: true,
                runs: 1000
            }
        }
    }
};
