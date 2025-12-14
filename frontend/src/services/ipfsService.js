import api from '../utils/api';

/**
 * Service pour les interactions avec IPFS via l'API backend
 */
const ipfsService = {
  /**
   * Upload un ou plusieurs fichiers vers IPFS
   * @param {File|File[]} files - Fichier(s) à uploader
   * @returns {Promise}
   */
  upload: async (files) => {
    try {
      const formData = new FormData();

      // Si c'est un seul fichier, le mettre dans un tableau
      const fileArray = Array.isArray(files) ? files : [files];

      // Ajouter chaque fichier au FormData
      fileArray.forEach((file) => {
        formData.append('files[]', file);
      });

      const response = await api.post('/ipfs/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Erreur lors de l\'upload vers IPFS';
    }
  },

  /**
   * Récupérer un fichier depuis IPFS
   * @param {string} hash - Hash IPFS
   * @returns {Promise}
   */
  getFile: async (hash) => {
    try {
      const response = await api.get(`/ipfs/${hash}`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Erreur lors de la récupération du fichier IPFS';
    }
  },

  /**
   * Obtenir l'URL du gateway IPFS pour un hash
   * @param {string} hash - Hash IPFS
   * @returns {Promise<string>}
   */
  getUrl: async (hash) => {
    try {
      const response = await api.get(`/ipfs/${hash}/url`);
      return response.data.data.gateway_url;
    } catch (error) {
      throw error.response?.data?.message || 'Erreur lors de la récupération de l\'URL IPFS';
    }
  },

  /**
   * Pin un fichier IPFS
   * @param {string} hash - Hash IPFS
   * @returns {Promise}
   */
  pin: async (hash) => {
    try {
      const response = await api.post('/ipfs/pin', { hash });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Erreur lors du pinning du fichier';
    }
  },

  /**
   * Vérifier le statut d'IPFS
   * @returns {Promise}
   */
  getStatus: async () => {
    try {
      const response = await api.get('/ipfs/status');
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.message || 'Erreur lors de la vérification du statut IPFS';
    }
  },

  /**
   * Créer une URL de prévisualisation pour un fichier
   * @param {File} file - Fichier local
   * @returns {string} URL de prévisualisation
   */
  createPreviewUrl: (file) => {
    return URL.createObjectURL(file);
  },

  /**
   * Révoquer une URL de prévisualisation
   * @param {string} url - URL à révoquer
   */
  revokePreviewUrl: (url) => {
    URL.revokeObjectURL(url);
  },

  /**
   * Vérifier si un fichier est une image
   * @param {File} file
   * @returns {boolean}
   */
  isImage: (file) => {
    return file.type.startsWith('image/');
  },

  /**
   * Vérifier si un fichier est un PDF
   * @param {File} file
   * @returns {boolean}
   */
  isPDF: (file) => {
    return file.type === 'application/pdf';
  },

  /**
   * Formater la taille d'un fichier en format lisible
   * @param {number} bytes
   * @returns {string}
   */
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  },

  /**
   * Valider un fichier avant upload
   * @param {File} file
   * @param {object} options - Options de validation { maxSize, allowedTypes }
   * @returns {object} { valid: boolean, error: string|null }
   */
  validateFile: (file, options = {}) => {
    const {
      maxSize = 10 * 1024 * 1024, // 10MB par défaut
      allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
    } = options;

    // Vérifier la taille
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `Le fichier est trop volumineux. Maximum: ${ipfsService.formatFileSize(maxSize)}`,
      };
    }

    // Vérifier le type MIME
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Type de fichier non autorisé. Types acceptés: ${allowedTypes.join(', ')}`,
      };
    }

    return { valid: true, error: null };
  },

  /**
   * Upload avec progression
   * @param {File|File[]} files
   * @param {Function} onProgress - Callback pour la progression (0-100)
   * @returns {Promise}
   */
  uploadWithProgress: async (files, onProgress) => {
    try {
      const formData = new FormData();
      const fileArray = Array.isArray(files) ? files : [files];

      fileArray.forEach((file) => {
        formData.append('files[]', file);
      });

      const response = await api.post('/ipfs/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          if (onProgress) {
            onProgress(percentCompleted);
          }
        },
      });

      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Erreur lors de l\'upload vers IPFS';
    }
  },
};

export default ipfsService;
