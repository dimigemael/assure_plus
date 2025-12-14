import api from '../utils/api';

const subscriptionService = {
  /**
   * Créer une nouvelle souscription (demande de contrat)
   * @param {object} subscriptionData
   * @returns {Promise}
   */
  create: async (subscriptionData) => {
    try {
      const response = await api.post('/subscriptions', subscriptionData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.errors || error.response?.data?.message || 'Erreur lors de la souscription';
    }
  },

  /**
   * Récupérer toutes les souscriptions de l'utilisateur connecté
   * @returns {Promise}
   */
  getMySubscriptions: async () => {
    try {
      const response = await api.get('/subscriptions/my');
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Erreur lors de la récupération des souscriptions';
    }
  },

  /**
   * Récupérer toutes les souscriptions en attente (pour admin)
   * @returns {Promise}
   */
  getPending: async () => {
    try {
      const response = await api.get('/subscriptions/pending');
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Erreur lors de la récupération des souscriptions en attente';
    }
  },

  /**
   * Approuver une souscription (pour admin)
   * @param {number} id
   * @returns {Promise}
   */
  approve: async (id) => {
    try {
      const response = await api.post(`/subscriptions/${id}/approve`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Erreur lors de l\'approbation';
    }
  },

  /**
   * Rejeter une souscription (pour admin)
   * @param {number} id
   * @param {string} reason
   * @returns {Promise}
   */
  reject: async (id, reason) => {
    try {
      const response = await api.post(`/subscriptions/${id}/reject`, { reason });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Erreur lors du rejet';
    }
  },
};

export default subscriptionService;
