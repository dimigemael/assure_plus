import { ethers } from 'ethers';

/**
 * Service pour les interactions avec la blockchain
 */
const blockchainService = {
  /**
   * Obtenir le provider (connexion à la blockchain)
   */
  getProvider: () => {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask n\'est pas installé');
    }
    return new ethers.BrowserProvider(window.ethereum);
  },

  /**
   * Obtenir le signer (compte connecté)
   */
  getSigner: async () => {
    const provider = blockchainService.getProvider();
    return await provider.getSigner();
  },

  /**
   * Payer une prime d'assurance en ETH
   * @param {string} toAddress - Adresse de réception (assureur)
   * @param {number} amountInEther - Montant en ETH
   * @returns {Promise} Transaction receipt
   */
  payPremium: async (toAddress, amountInEther) => {
    try {
      const signer = await blockchainService.getSigner();

      const tx = await signer.sendTransaction({
        to: toAddress,
        value: ethers.parseEther(amountInEther.toString()),
      });

      console.log('Transaction envoyée:', tx.hash);

      // Attendre la confirmation
      const receipt = await tx.wait();
      console.log('Transaction confirmée:', receipt);

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        from: receipt.from,
        to: receipt.to,
        value: ethers.formatEther(receipt.value || 0),
      };

    } catch (error) {
      console.error('Erreur paiement:', error);
      throw {
        success: false,
        error: error.message,
        code: error.code,
      };
    }
  },

  /**
   * Récupérer le solde d'une adresse
   * @param {string} address - Adresse à vérifier
   * @returns {Promise<string>} Solde en ETH
   */
  getBalance: async (address) => {
    try {
      const provider = blockchainService.getProvider();
      const balance = await provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Erreur récupération solde:', error);
      throw error;
    }
  },

  /**
   * Vérifier si une adresse est valide
   * @param {string} address
   * @returns {boolean}
   */
  isValidAddress: (address) => {
    return ethers.isAddress(address);
  },

  /**
   * Convertir Wei en ETH
   * @param {string|BigInt} wei
   * @returns {string}
   */
  weiToEth: (wei) => {
    return ethers.formatEther(wei);
  },

  /**
   * Convertir ETH en Wei
   * @param {string|number} eth
   * @returns {BigInt}
   */
  ethToWei: (eth) => {
    return ethers.parseEther(eth.toString());
  },

  /**
   * Récupérer les informations d'une transaction
   * @param {string} txHash - Hash de la transaction
   * @returns {Promise}
   */
  getTransaction: async (txHash) => {
    try {
      const provider = blockchainService.getProvider();
      const tx = await provider.getTransaction(txHash);
      return tx;
    } catch (error) {
      console.error('Erreur récupération transaction:', error);
      throw error;
    }
  },

  /**
   * Récupérer le receipt d'une transaction
   * @param {string} txHash - Hash de la transaction
   * @returns {Promise}
   */
  getTransactionReceipt: async (txHash) => {
    try {
      const provider = blockchainService.getProvider();
      const receipt = await provider.getTransactionReceipt(txHash);
      return receipt;
    } catch (error) {
      console.error('Erreur récupération receipt:', error);
      throw error;
    }
  },

  /**
   * Signer un message avec le wallet
   * @param {string} message - Message à signer
   * @returns {Promise<string>} Signature
   */
  signMessage: async (message) => {
    try {
      const signer = await blockchainService.getSigner();
      const signature = await signer.signMessage(message);
      return signature;
    } catch (error) {
      console.error('Erreur signature:', error);
      throw error;
    }
  },

  /**
   * Vérifier une signature
   * @param {string} message - Message original
   * @param {string} signature - Signature à vérifier
   * @returns {string} Adresse du signataire
   */
  verifyMessage: (message, signature) => {
    try {
      return ethers.verifyMessage(message, signature);
    } catch (error) {
      console.error('Erreur vérification:', error);
      throw error;
    }
  },

  /**
   * Obtenir le réseau actuel
   * @returns {Promise}
   */
  getNetwork: async () => {
    try {
      const provider = blockchainService.getProvider();
      const network = await provider.getNetwork();
      return {
        chainId: network.chainId.toString(),
        name: network.name,
      };
    } catch (error) {
      console.error('Erreur réseau:', error);
      throw error;
    }
  },

  /**
   * Calculer le montant d'une prime selon la fréquence
   * @param {number} primeAnnuelle - Prime annuelle en ETH
   * @param {string} frequence - mensuelle, trimestrielle, semestrielle, annuelle
   * @returns {number}
   */
  calculatePremiumAmount: (primeAnnuelle, frequence) => {
    const diviseurs = {
      mensuelle: 12,
      trimestrielle: 4,
      semestrielle: 2,
      annuelle: 1,
    };

    const diviseur = diviseurs[frequence] || 1;
    return primeAnnuelle / diviseur;
  },

  /**
   * Formater une adresse (afficher début et fin)
   * @param {string} address
   * @returns {string}
   */
  formatAddress: (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  },

  /**
   * Récupérer le prix du gas actuel
   * @returns {Promise}
   */
  getGasPrice: async () => {
    try {
      const provider = blockchainService.getProvider();
      const feeData = await provider.getFeeData();
      return {
        gasPrice: ethers.formatUnits(feeData.gasPrice || 0, 'gwei'),
        maxFeePerGas: ethers.formatUnits(feeData.maxFeePerGas || 0, 'gwei'),
        maxPriorityFeePerGas: ethers.formatUnits(feeData.maxPriorityFeePerGas || 0, 'gwei'),
      };
    } catch (error) {
      console.error('Erreur gas price:', error);
      throw error;
    }
  },
};

export default blockchainService;
