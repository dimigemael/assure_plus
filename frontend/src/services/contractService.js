import api from '../utils/api';

const contractService = {
  /**
   * Récupérer tous les contrats avec filtres optionnels
   * @param {object} filters - Filtres { user_id, status, type_assurance }
   * @returns {Promise}
   */
  getAll: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await api.get(`/contracts?${params}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Erreur lors de la récupération des contrats';
    }
  },

  /**
   * Récupérer un contrat par son ID
   * @param {number} id
   * @returns {Promise}
   */
  getById: async (id) => {
    try {
      const response = await api.get(`/contracts/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Erreur lors de la récupération du contrat';
    }
  },

  /**
   * Créer un nouveau contrat
   * @param {object} contractData
   * @returns {Promise}
   */
  create: async (contractData) => {
    try {
      const response = await api.post('/contracts', contractData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.errors || error.response?.data?.message || 'Erreur lors de la création du contrat';
    }
  },

  /**
   * Mettre à jour un contrat
   * @param {number} id
   * @param {object} contractData
   * @returns {Promise}
   */
  update: async (id, contractData) => {
    try {
      const response = await api.put(`/contracts/${id}`, contractData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Erreur lors de la mise à jour du contrat';
    }
  },

  /**
   * Supprimer un contrat (brouillon seulement)
   * @param {number} id
   * @returns {Promise}
   */
  delete: async (id) => {
    try {
      const response = await api.delete(`/contracts/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Erreur lors de la suppression du contrat';
    }
  },

  /**
   * Activer un contrat (déployer sur la blockchain)
   * @param {number} id
   * @returns {Promise}
   */
  activate: async (id) => {
    try {
      const response = await api.post(`/contracts/${id}/activate`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Erreur lors de l\'activation du contrat';
    }
  },

  /**
   * Résilier un contrat
   * @param {number} id
   * @param {string} motif
   * @returns {Promise}
   */
  cancel: async (id, motif) => {
    try {
      const response = await api.post(`/contracts/${id}/cancel`, { motif_resiliation: motif });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Erreur lors de la résiliation du contrat';
    }
  },

  /**
   * Récupérer la liste des utilisateurs assurés
   * @returns {Promise}
   */
  getAssures: async () => {
    try {
      const response = await api.get('/assures');
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Erreur lors de la récupération des assurés';
    }
  },

  /**
   * Obtenir les types d'assurance disponibles
   * @returns {array}
   */
  getTypesAssurance: () => {
    return [
      { value: 'Auto', label: 'Assurance Automobile' },
      { value: 'Habitation', label: 'Assurance Habitation' },
      { value: 'Santé', label: 'Assurance Santé' },
      { value: 'Vie', label: 'Assurance Vie' },
      { value: 'Voyage', label: 'Assurance Voyage' },
      { value: 'Responsabilité Civile', label: 'Responsabilité Civile' },
      { value: 'Autre', label: 'Autre' },
    ];
  },

  /**
   * Obtenir les fréquences de paiement
   * @returns {array}
   */
  getFrequencesPaiement: () => {
    return [
      { value: 'mensuelle', label: 'Mensuelle' },
      { value: 'trimestrielle', label: 'Trimestrielle' },
      { value: 'semestrielle', label: 'Semestrielle' },
      { value: 'annuelle', label: 'Annuelle' },
    ];
  },

  /**
   * Garanties prédéfinies par type d'assurance
   * @param {string} typeAssurance
   * @returns {array}
   */
  getGarantiesParType: (typeAssurance) => {
    const garanties = {
      'Auto': [
        { nom: 'Responsabilité Civile', obligatoire: true },
        { nom: 'Vol', obligatoire: false },
        { nom: 'Incendie', obligatoire: false },
        { nom: 'Bris de glace', obligatoire: false },
        { nom: 'Dommages tous accidents', obligatoire: false },
      ],
      'Habitation': [
        { nom: 'Responsabilité Civile', obligatoire: true },
        { nom: 'Incendie', obligatoire: true },
        { nom: 'Dégâts des eaux', obligatoire: false },
        { nom: 'Vol et vandalisme', obligatoire: false },
        { nom: 'Catastrophes naturelles', obligatoire: false },
      ],
      'Santé': [
        { nom: 'Hospitalisation', obligatoire: true },
        { nom: 'Soins courants', obligatoire: false },
        { nom: 'Optique', obligatoire: false },
        { nom: 'Dentaire', obligatoire: false },
        { nom: 'Médecines douces', obligatoire: false },
      ],
      'Vie': [
        { nom: 'Décès', obligatoire: true },
        { nom: 'Invalidité permanente', obligatoire: false },
        { nom: 'Invalidité temporaire', obligatoire: false },
      ],
    };

    return garanties[typeAssurance] || [];
  },
};

export default contractService;
