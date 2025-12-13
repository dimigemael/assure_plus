import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PropTypes from 'prop-types';

/**
 * Composant pour protéger les routes qui nécessitent une authentification
 * @param {object} props
 * @param {React.ReactNode} props.children - Contenu à afficher si autorisé
 * @param {string|string[]} props.allowedRoles - Rôle(s) autorisé(s) à accéder à la route
 */
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  // Attendre le chargement de l'authentification
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px'
      }}>
        Chargement...
      </div>
    );
  }

  // Si l'utilisateur n'est pas connecté, rediriger vers login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si des rôles sont spécifiés, vérifier que l'utilisateur a le bon rôle
  if (allowedRoles.length > 0) {
    const userHasRequiredRole = Array.isArray(allowedRoles)
      ? allowedRoles.includes(user.role)
      : allowedRoles === user.role;

    if (!userHasRequiredRole) {
      // Rediriger vers le dashboard approprié selon le rôle
      switch (user.role) {
        case 'admin':
          return <Navigate to="/admin_dashboard" replace />;
        case 'expert':
          return <Navigate to="/expert_dashboard" replace />;
        case 'assure':
          return <Navigate to="/assure_dashboard" replace />;
        default:
          return <Navigate to="/login" replace />;
      }
    }
  }

  // L'utilisateur est autorisé, afficher le contenu
  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  allowedRoles: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string)
  ]),
};

export default ProtectedRoute;
