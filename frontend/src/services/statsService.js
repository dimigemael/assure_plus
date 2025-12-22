import api from '../utils/api';

const statsService = {
  /**
   * Récupérer les statistiques du dashboard admin
   */
  getDashboardStats: async () => {
    try {
      const response = await api.get('/stats/dashboard');
      return response.data;
    } catch (error) {
      console.error('Erreur getDashboardStats:', error);
      throw error.response?.data?.message || 'Erreur lors de la récupération des statistiques';
    }
  },
};

export default statsService;
