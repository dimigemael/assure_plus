import api from '../utils/api';

/**
 * Service pour la gestion des notifications
 */
const notificationService = {
  /**
   * Lister les notifications
   * @param {object} params - { is_read, type, from_date, per_page }
   * @returns {Promise}
   */
  list: async (params = {}) => {
    try {
      const response = await api.get('/notifications', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Erreur lors de la récupération des notifications';
    }
  },

  /**
   * Obtenir une notification par ID
   * @param {number} id
   * @returns {Promise}
   */
  getById: async (id) => {
    try {
      const response = await api.get(`/notifications/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Notification non trouvée';
    }
  },

  /**
   * Marquer une notification comme lue
   * @param {number} id
   * @returns {Promise}
   */
  markAsRead: async (id) => {
    try {
      const response = await api.post(`/notifications/${id}/read`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Erreur lors de la mise à jour';
    }
  },

  /**
   * Marquer une notification comme non lue
   * @param {number} id
   * @returns {Promise}
   */
  markAsUnread: async (id) => {
    try {
      const response = await api.post(`/notifications/${id}/unread`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Erreur lors de la mise à jour';
    }
  },

  /**
   * Marquer toutes les notifications comme lues
   * @returns {Promise}
   */
  markAllAsRead: async () => {
    try {
      const response = await api.post('/notifications/mark-all-read');
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Erreur lors de la mise à jour';
    }
  },

  /**
   * Supprimer une notification
   * @param {number} id
   * @returns {Promise}
   */
  delete: async (id) => {
    try {
      const response = await api.delete(`/notifications/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Erreur lors de la suppression';
    }
  },

  /**
   * Supprimer toutes les notifications lues
   * @returns {Promise}
   */
  deleteRead: async () => {
    try {
      const response = await api.delete('/notifications/read');
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Erreur lors de la suppression';
    }
  },

  /**
   * Obtenir le nombre de notifications non lues
   * @returns {Promise<number>}
   */
  getUnreadCount: async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      return response.data.data.count;
    } catch (error) {
      throw error.response?.data?.message || 'Erreur lors du comptage';
    }
  },

  /**
   * Obtenir les notifications récentes (24h)
   * @returns {Promise}
   */
  getRecent: async () => {
    try {
      const response = await api.get('/notifications/recent');
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Erreur lors de la récupération';
    }
  },

  /**
   * Obtenir les notifications non lues
   * @returns {Promise}
   */
  getUnread: async () => {
    try {
      const response = await api.get('/notifications', {
        params: { is_read: false },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.message || 'Erreur lors de la récupération';
    }
  },

  /**
   * Formater le type de notification pour l'affichage
   * @param {string} type
   * @returns {object} { label, color, icon }
   */
  formatType: (type) => {
    const typeMap = {
      info: {
        label: 'Info',
        color: '#2196f3',
        icon: 'ℹ️',
      },
      success: {
        label: 'Succès',
        color: '#4caf50',
        icon: '✓',
      },
      warning: {
        label: 'Attention',
        color: '#ff9800',
        icon: '⚠️',
      },
      error: {
        label: 'Erreur',
        color: '#f44336',
        icon: '✗',
      },
      contract_created: {
        label: 'Contrat créé',
        color: '#4caf50',
        icon: '📄',
      },
      contract_activated: {
        label: 'Contrat activé',
        color: '#4caf50',
        icon: '✓',
      },
      contract_cancelled: {
        label: 'Contrat résilié',
        color: '#f44336',
        icon: '✗',
      },
      premium_due: {
        label: 'Prime à payer',
        color: '#ff9800',
        icon: '💰',
      },
      premium_paid: {
        label: 'Prime payée',
        color: '#4caf50',
        icon: '✓',
      },
      premium_overdue: {
        label: 'Prime en retard',
        color: '#f44336',
        icon: '⚠️',
      },
      claim_declared: {
        label: 'Sinistre déclaré',
        color: '#2196f3',
        icon: '📋',
      },
      claim_approved: {
        label: 'Sinistre approuvé',
        color: '#4caf50',
        icon: '✓',
      },
      claim_rejected: {
        label: 'Sinistre rejeté',
        color: '#f44336',
        icon: '✗',
      },
      claim_paid: {
        label: 'Indemnité payée',
        color: '#4caf50',
        icon: '💰',
      },
      subscription_approved: {
        label: 'Souscription approuvée',
        color: '#4caf50',
        icon: '✓',
      },
      subscription_rejected: {
        label: 'Souscription rejetée',
        color: '#f44336',
        icon: '✗',
      },
    };

    return typeMap[type] || { label: type, color: '#000', icon: '•' };
  },

  /**
   * Formater la date relative
   * @param {string} date
   * @returns {string}
   */
  formatRelativeTime: (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now - notifDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;

    return notifDate.toLocaleDateString('fr-FR');
  },

  /**
   * Grouper les notifications par date
   * @param {array} notifications
   * @returns {object} { today: [], yesterday: [], older: [] }
   */
  groupByDate: (notifications) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const grouped = {
      today: [],
      yesterday: [],
      older: [],
    };

    notifications.forEach((notif) => {
      const notifDate = new Date(notif.created_at);
      const notifDay = new Date(
        notifDate.getFullYear(),
        notifDate.getMonth(),
        notifDate.getDate()
      );

      if (notifDay.getTime() === today.getTime()) {
        grouped.today.push(notif);
      } else if (notifDay.getTime() === yesterday.getTime()) {
        grouped.yesterday.push(notif);
      } else {
        grouped.older.push(notif);
      }
    });

    return grouped;
  },

  /**
   * Filtrer les notifications par type
   * @param {array} notifications
   * @param {string|string[]} types
   * @returns {array}
   */
  filterByType: (notifications, types) => {
    const typeArray = Array.isArray(types) ? types : [types];
    return notifications.filter((notif) => typeArray.includes(notif.type));
  },

  /**
   * Obtenir les notifications importantes (non lues et warning/error)
   * @param {array} notifications
   * @returns {array}
   */
  getImportant: (notifications) => {
    return notifications.filter(
      (notif) =>
        !notif.is_read &&
        ['warning', 'error', 'premium_overdue', 'claim_rejected'].includes(notif.type)
    );
  },

  /**
   * Vérifier si une notification est récente (moins de 24h)
   * @param {object} notification
   * @returns {boolean}
   */
  isRecent: (notification) => {
    const notifDate = new Date(notification.created_at);
    const now = new Date();
    const diffHours = (now - notifDate) / 3600000;
    return diffHours < 24;
  },

  /**
   * Jouer un son de notification (si autorisé par le navigateur)
   * @param {string} type - Type de notification
   */
  playSound: (type) => {
    if (!('Audio' in window)) return;

    try {
      // Sons différents selon le type
      const frequency = {
        success: 800,
        warning: 600,
        error: 400,
        info: 700,
      };

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency[type] || 700;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.warn('Impossible de jouer le son de notification:', error);
    }
  },

  /**
   * Demander la permission pour les notifications navigateur
   * @returns {Promise<boolean>}
   */
  requestBrowserPermission: async () => {
    if (!('Notification' in window)) {
      console.warn('Ce navigateur ne supporte pas les notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  },

  /**
   * Afficher une notification navigateur
   * @param {string} title
   * @param {object} options - { body, icon, tag, data }
   */
  showBrowserNotification: (title, options = {}) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    try {
      const notification = new Notification(title, {
        body: options.body || '',
        icon: options.icon || '/logo.png',
        tag: options.tag || 'notification',
        data: options.data || {},
      });

      notification.onclick = () => {
        window.focus();
        if (options.onClick) {
          options.onClick();
        }
        notification.close();
      };
    } catch (error) {
      console.warn('Erreur lors de l\'affichage de la notification:', error);
    }
  },
};

export default notificationService;
