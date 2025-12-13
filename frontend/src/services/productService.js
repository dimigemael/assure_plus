import api from '../utils/api';

const productService = {
  /**
   * Récupérer tous les produits d'assurance avec filtres optionnels
   * @param {object} filters - Filtres { type_assurance, status }
   * @returns {Promise}
   */
  getAll: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await api.get(`/products?${params}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Erreur lors de la récupération des produits';
    }
  },

  /**
   * Récupérer un produit par son ID
   * @param {number} id
   * @returns {Promise}
   */
  getById: async (id) => {
    try {
      const response = await api.get(`/products/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Erreur lors de la récupération du produit';
    }
  },

  /**
   * Récupérer les produits disponibles pour souscription
   * @returns {Promise}
   */
  getAvailable: async () => {
    try {
      const response = await api.get('/products/available');
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Erreur lors de la récupération des produits disponibles';
    }
  },

  /**
   * Créer un nouveau produit d'assurance
   * @param {object} productData
   * @returns {Promise}
   */
  create: async (productData) => {
    try {
      const response = await api.post('/products', productData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.errors || error.response?.data?.message || 'Erreur lors de la création du produit';
    }
  },

  /**
   * Mettre à jour un produit
   * @param {number} id
   * @param {object} productData
   * @returns {Promise}
   */
  update: async (id, productData) => {
    try {
      const response = await api.put(`/products/${id}`, productData);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Erreur lors de la mise à jour du produit';
    }
  },

  /**
   * Archiver un produit
   * @param {number} id
   * @returns {Promise}
   */
  archive: async (id) => {
    try {
      const response = await api.post(`/products/${id}/archive`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Erreur lors de l\'archivage du produit';
    }
  },

  /**
   * Supprimer un produit (seulement si aucune souscription)
   * @param {number} id
   * @returns {Promise}
   */
  delete: async (id) => {
    try {
      const response = await api.delete(`/products/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Erreur lors de la suppression du produit';
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

export default productService;
