import { useState, useEffect, useCallback } from 'react';
import notificationService from '../services/notificationService';

/**
 * Hook personnalisé pour gérer les notifications
 * @param {object} options - { autoFetch, pollingInterval }
 * @returns {object}
 */
export const useNotifications = (options = {}) => {
  const {
    autoFetch = true,
    pollingInterval = 30000, // 30 secondes par défaut
  } = options;

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Charger les notifications
   */
  const fetchNotifications = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await notificationService.list(params);
      setNotifications(response.data.data || response.data);
      return response;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Charger le compteur de notifications non lues
   */
  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
      return count;
    } catch (err) {
      console.error('Erreur lors du chargement du compteur:', err);
      return 0;
    }
  }, []);

  /**
   * Marquer une notification comme lue
   */
  const markAsRead = useCallback(async (id) => {
    try {
      await notificationService.markAsRead(id);

      // Mettre à jour localement
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === id
            ? { ...notif, is_read: true, read_at: new Date().toISOString() }
            : notif
        )
      );

      // Décrémenter le compteur
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Erreur lors du marquage comme lu:', err);
      throw err;
    }
  }, []);

  /**
   * Marquer toutes les notifications comme lues
   */
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();

      // Mettre à jour localement
      setNotifications((prev) =>
        prev.map((notif) => ({
          ...notif,
          is_read: true,
          read_at: new Date().toISOString(),
        }))
      );

      setUnreadCount(0);
    } catch (err) {
      console.error('Erreur lors du marquage global:', err);
      throw err;
    }
  }, []);

  /**
   * Supprimer une notification
   */
  const deleteNotification = useCallback(async (id) => {
    try {
      await notificationService.delete(id);

      // Mettre à jour localement
      const deletedNotif = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((notif) => notif.id !== id));

      // Décrémenter le compteur si elle n'était pas lue
      if (deletedNotif && !deletedNotif.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      throw err;
    }
  }, [notifications]);

  /**
   * Supprimer toutes les notifications lues
   */
  const deleteAllRead = useCallback(async () => {
    try {
      await notificationService.deleteRead();

      // Mettre à jour localement
      setNotifications((prev) => prev.filter((notif) => !notif.is_read));
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      throw err;
    }
  }, []);

  /**
   * Ajouter une nouvelle notification localement (pour le temps réel)
   */
  const addNotification = useCallback((notification) => {
    setNotifications((prev) => [notification, ...prev]);
    if (!notification.is_read) {
      setUnreadCount((prev) => prev + 1);
    }

    // Jouer un son si c'est important
    if (['warning', 'error', 'premium_overdue'].includes(notification.type)) {
      notificationService.playSound(notification.type);
    }

    // Afficher notification navigateur si autorisée
    if (Notification.permission === 'granted') {
      notificationService.showBrowserNotification(notification.title, {
        body: notification.message,
        tag: `notif-${notification.id}`,
        data: notification.data,
      });
    }
  }, []);

  /**
   * Obtenir les notifications non lues
   */
  const unreadNotifications = notifications.filter((n) => !n.is_read);

  /**
   * Obtenir les notifications importantes
   */
  const importantNotifications = notificationService.getImportant(notifications);

  /**
   * Grouper par date
   */
  const groupedNotifications = notificationService.groupByDate(notifications);

  /**
   * Auto-fetch initial
   */
  useEffect(() => {
    if (autoFetch) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [autoFetch, fetchNotifications, fetchUnreadCount]);

  /**
   * Polling pour les nouvelles notifications
   */
  useEffect(() => {
    if (!pollingInterval || pollingInterval <= 0) return;

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, pollingInterval);

    return () => clearInterval(interval);
  }, [pollingInterval, fetchUnreadCount]);

  return {
    notifications,
    unreadNotifications,
    importantNotifications,
    groupedNotifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead,
    addNotification,
    refresh: fetchNotifications,
  };
};
