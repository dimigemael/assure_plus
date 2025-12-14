import api from '../utils/api';

/**
 * Service pour la gestion des paiements de primes
 */
const premiumService = {
  /**
   * Lister les paiements de primes
   * @param {object} params - Paramètres de filtrage { contract_id, user_id, statut, per_page }
   * @returns {Promise}
   */
  list: async (params = {}) => {
    try {
      const response = await api.get('/premiums', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Erreur lors de la récupération des primes';
    }
  },

  /**
   * Enregistrer un paiement de prime
   * @param {object} data - { contract_id, montant, transaction_hash, block_number }
   * @returns {Promise}
   */
  create: async (data) => {
    try {
      const response = await api.post('/premiums', data);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Erreur lors de l\'enregistrement du paiement';
    }
  },

  /**
   * Obtenir les détails d'un paiement
   * @param {number} id - ID du paiement
   * @returns {Promise}
   */
  getById: async (id) => {
    try {
      const response = await api.get(`/premiums/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Erreur lors de la récupération du paiement';
    }
  },

  /**
   * Mettre à jour le statut d'un paiement
   * @param {number} id - ID du paiement
   * @param {object} data - { statut, transaction_hash, block_number }
   * @returns {Promise}
   */
  update: async (id, data) => {
    try {
      const response = await api.put(`/premiums/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Erreur lors de la mise à jour du paiement';
    }
  },

  /**
   * Obtenir l'historique des primes pour un contrat
   * @param {number} contractId - ID du contrat
   * @returns {Promise}
   */
  getContractHistory: async (contractId) => {
    try {
      const response = await api.get(`/premiums/contract/${contractId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Erreur lors de la récupération de l\'historique';
    }
  },

  /**
   * Vérifier les primes impayées
   * @returns {Promise}
   */
  checkOverdue: async () => {
    try {
      const response = await api.get('/premiums/overdue');
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Erreur lors de la vérification des impayés';
    }
  },

  /**
   * Obtenir les statistiques des primes
   * @param {object} params - { start_date, end_date, user_id }
   * @returns {Promise}
   */
  getStats: async (params = {}) => {
    try {
      const response = await api.get('/premiums/stats', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Erreur lors du calcul des statistiques';
    }
  },

  /**
   * Payer une prime via Smart Contract
   * @param {number} contractId - ID du contrat
   * @param {number} policyId - ID de la police blockchain
   * @param {number} amountEth - Montant en ETH
   * @param {object} smartContractService - Instance du service Smart Contract
   * @returns {Promise} { transactionHash, blockNumber }
   */
  payViaBlockchain: async (contractId, policyId, amountEth, smartContractService) => {
    try {
      // 1. Payer via Smart Contract
      const txResult = await smartContractService.payPremium(policyId, amountEth);

      // 2. Enregistrer dans la base de données
      const premiumData = {
        contract_id: contractId,
        montant: amountEth,
        transaction_hash: txResult.transactionHash,
        block_number: txResult.blockNumber,
      };

      const dbResult = await premiumService.create(premiumData);

      return {
        blockchain: txResult,
        database: dbResult,
      };
    } catch (error) {
      throw error.message || 'Erreur lors du paiement de la prime';
    }
  },

  /**
   * Formater le statut pour l'affichage
   * @param {string} statut
   * @returns {object} { label, color, icon }
   */
  formatStatus: (statut) => {
    const statusMap = {
      payee: {
        label: 'Payée',
        color: '#4caf50',
        icon: '✓',
      },
      en_attente: {
        label: 'En attente',
        color: '#ff9800',
        icon: '⏳',
      },
      echouee: {
        label: 'Échouée',
        color: '#f44336',
        icon: '✗',
      },
      en_attente_resiliation: {
        label: 'En attente de résiliation',
        color: '#9e9e9e',
        icon: '⚠',
      },
    };

    return statusMap[statut] || { label: statut, color: '#000', icon: '?' };
  },

  /**
   * Calculer le montant total payé
   * @param {array} premiums - Liste des primes
   * @returns {number}
   */
  calculateTotalPaid: (premiums) => {
    return premiums
      .filter((p) => p.statut === 'payee')
      .reduce((sum, p) => sum + parseFloat(p.montant), 0);
  },

  /**
   * Calculer le nombre de paiements réussis
   * @param {array} premiums - Liste des primes
   * @returns {number}
   */
  countSuccessful: (premiums) => {
    return premiums.filter((p) => p.statut === 'payee').length;
  },

  /**
   * Obtenir la dernière prime payée
   * @param {array} premiums - Liste des primes
   * @returns {object|null}
   */
  getLastPaid: (premiums) => {
    const paid = premiums.filter((p) => p.statut === 'payee');
    if (paid.length === 0) return null;

    return paid.reduce((latest, current) => {
      const latestDate = new Date(latest.date_paiement);
      const currentDate = new Date(current.date_paiement);
      return currentDate > latestDate ? current : latest;
    });
  },

  /**
   * Vérifier si un contrat a des impayés
   * @param {object} contract - Contrat avec prochaine_echeance
   * @returns {boolean}
   */
  hasOverdue: (contract) => {
    if (!contract.prochaine_echeance) return false;
    const echeance = new Date(contract.prochaine_echeance);
    return echeance < new Date() && contract.status === 'actif';
  },

  /**
   * Calculer le nombre de jours de retard
   * @param {object} contract - Contrat avec prochaine_echeance
   * @returns {number}
   */
  daysOverdue: (contract) => {
    if (!premiumService.hasOverdue(contract)) return 0;

    const echeance = new Date(contract.prochaine_echeance);
    const now = new Date();
    const diffTime = Math.abs(now - echeance);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },

  /**
   * Obtenir le niveau d'urgence d'un impayé
   * @param {object} contract - Contrat
   * @returns {string} 'urgent' | 'warning' | 'recent' | 'ok'
   */
  getOverdueLevel: (contract) => {
    const days = premiumService.daysOverdue(contract);

    if (days === 0) return 'ok';
    if (days > 30) return 'urgent';
    if (days >= 7) return 'warning';
    return 'recent';
  },

  /**
   * Formater la fréquence de paiement
   * @param {string} frequence
   * @returns {string}
   */
  formatFrequence: (frequence) => {
    const frequenceMap = {
      mensuelle: 'Mensuelle',
      trimestrielle: 'Trimestrielle',
      semestrielle: 'Semestrielle',
      annuelle: 'Annuelle',
    };

    return frequenceMap[frequence] || frequence;
  },
};

export default premiumService;
