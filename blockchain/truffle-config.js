module.exports = {
  networks: {
    development: {
      host: "ganache",     // Dans Docker, on utilise le nom du service
      port: 8545,
      network_id: "5777",
      gas: 6721975,
      gasPrice: 20000000000
    },
    // Pour utilisation locale (sans Docker)
    local: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "5777",
    }
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.8.19",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  },

  // Plugin pour la couverture de code
  plugins: ["solidity-coverage"]
};
