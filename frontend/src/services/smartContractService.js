import { ethers } from 'ethers';
import contractABI from '../contracts/InsuranceContract.json';

/**
 * Service pour interagir avec le Smart Contract InsuranceContract.sol
 */
class SmartContractService {
  constructor() {
    // Adresse du contrat déployé (sera mise à jour après déploiement)
    this.contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || null;
    this.contract = null;
    this.provider = null;
    this.signer = null;
  }

  /**
   * Initialiser la connexion au contrat
   * @param {object} signer - Ethers signer (depuis MetaMask)
   */
  async initialize(signer) {
    if (!this.contractAddress) {
      throw new Error('Adresse du contrat non configurée. Vérifiez VITE_CONTRACT_ADDRESS dans .env');
    }

    this.signer = signer;
    this.provider = signer.provider;

    // Créer l'instance du contrat avec l'ABI
    this.contract = new ethers.Contract(
      this.contractAddress,
      contractABI.abi,
      signer
    );

    return this.contract;
  }

  /**
   * Obtenir l'instance du contrat (lecture seule)
   * @param {object} provider - Ethers provider
   */
  async getContractReadOnly(provider) {
    if (!this.contractAddress) {
      throw new Error('Adresse du contrat non configurée');
    }

    return new ethers.Contract(
      this.contractAddress,
      contractABI.abi,
      provider
    );
  }

  /**
   * Définir l'adresse du contrat manuellement
   * @param {string} address - Adresse du contrat
   */
  setContractAddress(address) {
    this.contractAddress = address;
  }

  // ==========================================
  // FONCTIONS DE LECTURE (VIEW)
  // ==========================================

  /**
   * Récupérer les détails d'une police
   * @param {number} policyId - ID de la police
   * @returns {Promise<object>}
   */
  async getPolicy(policyId) {
    if (!this.contract) {
      throw new Error('Contrat non initialisé');
    }

    const policy = await this.contract.getPolicy(policyId);

    return {
      insured: policy.insured,
      coverageAmount: ethers.formatEther(policy.coverageAmount),
      premium: ethers.formatEther(policy.premium),
      startDate: new Date(Number(policy.startDate) * 1000),
      endDate: new Date(Number(policy.endDate) * 1000),
      isActive: policy.isActive,
      balance: ethers.formatEther(policy.balance),
    };
  }

  /**
   * Récupérer les détails d'un sinistre
   * @param {number} claimId - ID du sinistre
   * @returns {Promise<object>}
   */
  async getClaim(claimId) {
    if (!this.contract) {
      throw new Error('Contrat non initialisé');
    }

    const claim = await this.contract.getClaim(claimId);

    return {
      policyId: Number(claim.policyId),
      claimant: claim.claimant,
      amountClaimed: ethers.formatEther(claim.amountClaimed),
      ipfsHash: claim.ipfsHash,
      isValidated: claim.isValidated,
      isPaid: claim.isPaid,
    };
  }

  /**
   * Obtenir le nombre total de polices
   * @returns {Promise<number>}
   */
  async getPolicyCounter() {
    if (!this.contract) {
      throw new Error('Contrat non initialisé');
    }

    const counter = await this.contract.policyCounter();
    return Number(counter);
  }

  /**
   * Obtenir le nombre total de sinistres
   * @returns {Promise<number>}
   */
  async getClaimCounter() {
    if (!this.contract) {
      throw new Error('Contrat non initialisé');
    }

    const counter = await this.contract.claimCounter();
    return Number(counter);
  }

  /**
   * Obtenir le solde du contrat
   * @returns {Promise<string>}
   */
  async getContractBalance() {
    if (!this.contract) {
      throw new Error('Contrat non initialisé');
    }

    const balance = await this.contract.getContractBalance();
    return ethers.formatEther(balance);
  }

  /**
   * Obtenir l'adresse du propriétaire
   * @returns {Promise<string>}
   */
  async getOwner() {
    if (!this.contract) {
      throw new Error('Contrat non initialisé');
    }

    return await this.contract.owner();
  }

  // ==========================================
  // FONCTIONS D'ÉCRITURE (TRANSACTIONS)
  // ==========================================

  /**
   * Créer une nouvelle police d'assurance
   * @param {number} coverageAmountEth - Montant de couverture en ETH
   * @param {number} premiumEth - Prime mensuelle en ETH
   * @param {number} durationDays - Durée en jours
   * @param {number} initialPremiumEth - Prime initiale à payer
   * @returns {Promise<object>} Transaction receipt
   */
  async createPolicy(coverageAmountEth, premiumEth, durationDays, initialPremiumEth) {
    if (!this.contract) {
      throw new Error('Contrat non initialisé');
    }

    const durationSeconds = durationDays * 24 * 60 * 60;

    const tx = await this.contract.createPolicy(
      ethers.parseEther(coverageAmountEth.toString()),
      ethers.parseEther(premiumEth.toString()),
      durationSeconds,
      {
        value: ethers.parseEther(initialPremiumEth.toString()),
      }
    );

    const receipt = await tx.wait();

    // Extraire le policyId depuis les événements
    const event = receipt.logs.find(log => {
      try {
        return this.contract.interface.parseLog(log)?.name === 'PolicyCreated';
      } catch {
        return false;
      }
    });

    const policyId = event ? this.contract.interface.parseLog(event).args.policyId : null;

    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      policyId: policyId ? Number(policyId) : null,
      gasUsed: receipt.gasUsed.toString(),
    };
  }

  /**
   * Payer une prime pour une police existante
   * @param {number} policyId - ID de la police
   * @param {number} amountEth - Montant en ETH
   * @returns {Promise<object>}
   */
  async payPremium(policyId, amountEth) {
    if (!this.contract) {
      throw new Error('Contrat non initialisé');
    }

    const tx = await this.contract.payPremium(policyId, {
      value: ethers.parseEther(amountEth.toString()),
    });

    const receipt = await tx.wait();

    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
    };
  }

  /**
   * Déclarer un sinistre
   * @param {number} policyId - ID de la police
   * @param {number} amountEth - Montant réclamé en ETH
   * @param {string} ipfsHash - Hash IPFS des preuves
   * @returns {Promise<object>}
   */
  async declareClaim(policyId, amountEth, ipfsHash) {
    if (!this.contract) {
      throw new Error('Contrat non initialisé');
    }

    const tx = await this.contract.declareClaim(
      policyId,
      ethers.parseEther(amountEth.toString()),
      ipfsHash
    );

    const receipt = await tx.wait();

    // Extraire le claimId depuis les événements
    const event = receipt.logs.find(log => {
      try {
        return this.contract.interface.parseLog(log)?.name === 'ClaimDeclared';
      } catch {
        return false;
      }
    });

    const claimId = event ? this.contract.interface.parseLog(event).args.claimId : null;

    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      claimId: claimId ? Number(claimId) : null,
      gasUsed: receipt.gasUsed.toString(),
    };
  }

  /**
   * Valider un sinistre (réservé au propriétaire)
   * @param {number} claimId - ID du sinistre
   * @param {boolean} approved - Approuvé ou rejeté
   * @returns {Promise<object>}
   */
  async validateClaim(claimId, approved) {
    if (!this.contract) {
      throw new Error('Contrat non initialisé');
    }

    const tx = await this.contract.validateClaim(claimId, approved);
    const receipt = await tx.wait();

    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
    };
  }

  // ==========================================
  // ÉVÉNEMENTS
  // ==========================================

  /**
   * Écouter les événements PolicyCreated
   * @param {function} callback - Fonction appelée lors de l'événement
   */
  onPolicyCreated(callback) {
    if (!this.contract) {
      throw new Error('Contrat non initialisé');
    }

    this.contract.on('PolicyCreated', (policyId, insured, coverageAmount, event) => {
      callback({
        policyId: Number(policyId),
        insured,
        coverageAmount: ethers.formatEther(coverageAmount),
        event,
      });
    });
  }

  /**
   * Écouter les événements ClaimDeclared
   * @param {function} callback
   */
  onClaimDeclared(callback) {
    if (!this.contract) {
      throw new Error('Contrat non initialisé');
    }

    this.contract.on('ClaimDeclared', (claimId, policyId, amount, ipfsHash, event) => {
      callback({
        claimId: Number(claimId),
        policyId: Number(policyId),
        amount: ethers.formatEther(amount),
        ipfsHash,
        event,
      });
    });
  }

  /**
   * Écouter les événements IndemnityPaid
   * @param {function} callback
   */
  onIndemnityPaid(callback) {
    if (!this.contract) {
      throw new Error('Contrat non initialisé');
    }

    this.contract.on('IndemnityPaid', (claimId, beneficiary, amount, event) => {
      callback({
        claimId: Number(claimId),
        beneficiary,
        amount: ethers.formatEther(amount),
        event,
      });
    });
  }

  /**
   * Arrêter d'écouter tous les événements
   */
  removeAllListeners() {
    if (this.contract) {
      this.contract.removeAllListeners();
    }
  }
}

// Export singleton
const smartContractService = new SmartContractService();
export default smartContractService;
