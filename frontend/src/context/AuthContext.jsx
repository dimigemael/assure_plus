import { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService';
import PropTypes from 'prop-types';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté au chargement
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  /**
   * Connexion
   */
  const login = async (email, password) => {
    try {
      const data = await authService.login(email, password);
      setUser(data.user);
      return data;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Inscription
   */
  const register = async (userData) => {
    try {
      const data = await authService.register(userData);
      setUser(data.user);
      return data;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Déconnexion
   */
  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  /**
   * Vérifier si l'utilisateur est admin
   */
  const isAdmin = () => {
    return user?.role === 'admin';
  };

  /**
   * Vérifier si l'utilisateur est assuré
   */
  const isAssure = () => {
    return user?.role === 'assure';
  };

  /**
   * Vérifier si l'utilisateur est expert
   */
  const isExpert = () => {
    return user?.role === 'expert';
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAdmin,
    isAssure,
    isExpert,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Hook personnalisé pour utiliser le contexte d'authentification
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
};

export default AuthContext;
