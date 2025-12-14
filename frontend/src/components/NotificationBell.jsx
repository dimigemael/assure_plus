import { useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import notificationService from '../services/notificationService';
import './NotificationBell.css';

/**
 * Composant cloche de notifications avec dropdown
 */
const NotificationBell = () => {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications({
    autoFetch: true,
    pollingInterval: 30000, // Vérifier toutes les 30s
  });

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' ou 'unread'

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleNotificationClick = async (notification) => {
    // Marquer comme lue
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Naviguer vers l'action si présente
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }

    setIsOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleDelete = async (e, notificationId) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
  };

  // Filtrer selon l'onglet actif
  const displayedNotifications =
    activeTab === 'unread'
      ? notifications.filter((n) => !n.is_read)
      : notifications;

  // Limiter à 10 notifications
  const limitedNotifications = displayedNotifications.slice(0, 10);

  return (
    <div className="notification-bell-container">
      {/* Cloche avec badge */}
      <button className="notification-bell-button" onClick={toggleDropdown}>
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div className="notification-backdrop" onClick={() => setIsOpen(false)} />
          <div className="notification-dropdown">
            {/* Header */}
            <div className="notification-header">
              <h3>Notifications</h3>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllAsRead} className="mark-all-read-btn">
                  Tout marquer comme lu
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className="notification-tabs">
              <button
                className={`tab ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                Toutes ({notifications.length})
              </button>
              <button
                className={`tab ${activeTab === 'unread' ? 'active' : ''}`}
                onClick={() => setActiveTab('unread')}
              >
                Non lues ({unreadCount})
              </button>
            </div>

            {/* Liste des notifications */}
            <div className="notification-list">
              {loading && <div className="notification-loading">Chargement...</div>}

              {!loading && limitedNotifications.length === 0 && (
                <div className="notification-empty">
                  {activeTab === 'unread'
                    ? 'Aucune notification non lue'
                    : 'Aucune notification'}
                </div>
              )}

              {!loading &&
                limitedNotifications.map((notification) => {
                  const typeInfo = notificationService.formatType(notification.type);
                  const relativeTime = notificationService.formatRelativeTime(
                    notification.created_at
                  );

                  return (
                    <div
                      key={notification.id}
                      className={`notification-item ${
                        notification.is_read ? 'read' : 'unread'
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      {/* Indicateur non lu */}
                      {!notification.is_read && <span className="unread-dot" />}

                      {/* Icon */}
                      <div
                        className="notification-icon"
                        style={{ backgroundColor: typeInfo.color }}
                      >
                        {typeInfo.icon}
                      </div>

                      {/* Contenu */}
                      <div className="notification-content">
                        <div className="notification-title">{notification.title}</div>
                        <div className="notification-message">{notification.message}</div>
                        <div className="notification-time">{relativeTime}</div>
                      </div>

                      {/* Actions */}
                      <button
                        className="notification-delete"
                        onClick={(e) => handleDelete(e, notification.id)}
                        title="Supprimer"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
            </div>

            {/* Footer */}
            {limitedNotifications.length > 0 && (
              <div className="notification-footer">
                <a href="/notifications" className="view-all-link">
                  Voir toutes les notifications
                </a>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
