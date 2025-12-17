import api from '../utils/api';

const claimService = {
  /**
   * Créer une nouvelle déclaration de sinistre
   * @param {FormData} claimData - FormData contenant les données du sinistre et le fichier
   * @returns {Promise}
   */
  create: async (claimData) => {
    try {
      const response = await api.post('/claims', claimData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.errors || error.response?.data?.message || 'Erreur lors de la déclaration du sinistre';
    }
  },

  /**
   * Récupérer tous les sinistres (filtrés selon le rôle de l'utilisateur)
   * - Admin/Expert: tous les sinistres
   * - Assuré: uniquement ses propres sinistres
   * @returns {Promise}
   */
  getAll: async () => {
    try {
      const response = await api.get('/claims');
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Erreur lors de la récupération des sinistres';
    }
  },

  /**
   * Récupérer les détails d'un sinistre spécifique
   * @param {number} id
   * @returns {Promise}
   */
  getById: async (id) => {
    try {
      const response = await api.get(`/claims/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Erreur lors de la récupération du sinistre';
    }
  },

  /**
   * Mettre à jour un sinistre (approuver, rejeter, etc.)
   * @param {number} id
   * @param {object} updateData - { status, commentaire_expert, montant_approuve }
   * @returns {Promise}
   */
  update: async (id, updateData) => {
    try {
      const response = await api.patch(`/claims/${id}`, updateData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Erreur lors de la mise à jour du sinistre';
    }
  },

  /**
   * Approuver un sinistre
   * @param {number} id
   * @param {number} montantApprouve
   * @param {string} commentaire
   * @returns {Promise}
   */
  approve: async (id, montantApprouve, commentaire = '') => {
    return claimService.update(id, {
      status: 'approuvé',
      montant_approuve: montantApprouve,
      commentaire_expert: commentaire,
    });
  },

  /**
   * Rejeter un sinistre
   * @param {number} id
   * @param {string} commentaire
   * @returns {Promise}
   */
  reject: async (id, commentaire) => {
    return claimService.update(id, {
      status: 'rejeté',
      commentaire_expert: commentaire,
    });
  },

  /**
   * Supprimer un sinistre (admin uniquement)
   * @param {number} id
   * @returns {Promise}
   */
  delete: async (id) => {
    try {
      const response = await api.delete(`/claims/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Erreur lors de la suppression du sinistre';
    }
  },

  /**
   * Formater le statut pour l'affichage
   * @param {string} status
   * @returns {object} { label, color, icon }
   */
  formatStatus: (status) => {
    const statusMap = {
      'en_attente': { label: 'En attente', color: '#ff9800', icon: '⏳' },
      'approuvé': { label: 'Approuvé', color: '#4caf50', icon: '✓' },
      'rejeté': { label: 'Rejeté', color: '#f44336', icon: '✗' },
      'payé': { label: 'Payé', color: '#2196f3', icon: '💰' },
    };
    return statusMap[status] || { label: status, color: '#666', icon: '?' };
  },
};

export default claimService;
