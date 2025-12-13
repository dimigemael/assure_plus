import api from '../utils/api';

const authService = {
  /**
   * Connexion de l'utilisateur
   * @param {string} email
   * @param {string} password
   * @returns {Promise} Données de l'utilisateur et token
   */
  login: async (email, password) => {
    try {
      const response = await api.post('/login', { email, password });

      // L'API retourne 'token' et non 'access_token'
      const token = response.data.token || response.data.access_token;

      if (token) {
        // Stocker le token et les infos utilisateur
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }

      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Erreur lors de la connexion';
    }
  },

  /**
   * Inscription d'un nouvel utilisateur
   * @param {object} userData
   * @returns {Promise}
   */
  register: async (userData) => {
    try {
      const response = await api.post('/register', userData);

      // L'API retourne 'token' et non 'access_token'
      const token = response.data.token || response.data.access_token;

      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }

      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Erreur lors de l\'inscription';
    }
  },

  /**
   * Déconnexion de l'utilisateur
   * @returns {Promise}
   */
  logout: async () => {
    try {
      await api.post('/logout');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      // Nettoyer le localStorage même en cas d'erreur
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  /**
   * Récupérer l'utilisateur actuellement connecté
   * @returns {object|null}
   */
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  /**
   * Vérifier si l'utilisateur est connecté
   * @returns {boolean}
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  /**
   * Vérifier si l'utilisateur a un rôle spécifique
   * @param {string} role
   * @returns {boolean}
   */
  hasRole: (role) => {
    const user = authService.getCurrentUser();
    return user?.role === role;
  },

  /**
   * Vérifier si l'utilisateur est admin
   * @returns {boolean}
   */
  isAdmin: () => {
    return authService.hasRole('admin');
  },

  /**
   * Vérifier si l'utilisateur est assuré
   * @returns {boolean}
   */
  isAssure: () => {
    return authService.hasRole('assure');
  },

  /**
   * Vérifier si l'utilisateur est expert
   * @returns {boolean}
   */
  isExpert: () => {
    return authService.hasRole('expert');
  },

  /**
   * Récupérer le token
   * @returns {string|null}
   */
  getToken: () => {
    return localStorage.getItem('token');
  }
};

export default authService;
