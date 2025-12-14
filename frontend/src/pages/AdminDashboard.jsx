import { useState, useEffect } from "react";
import "./AdminDashboard.css";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastContainer';
import productService from '../services/productService';
import subscriptionService from '../services/subscriptionService';
import CreateProductForm from '../components/CreateProductForm';

export default function AdminDashboard() {
  const [activePage, setActivePage] = useState("create");
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { success: showSuccessToast, error: showErrorToast } = useToast();

  // États pour la gestion des produits
  const [products, setProducts] = useState([]);
  const [pendingSubscriptions, setPendingSubscriptions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Charger les produits ou souscriptions selon la page active
  useEffect(() => {
    if (activePage === "products") {
      loadProducts();
    } else if (activePage === "subscriptions") {
      loadPendingSubscriptions();
    }
  }, [activePage]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await productService.getAll();
      setProducts(data);
    } catch (err) {
      console.error('Erreur chargement produits:', err);
      showErrorToast('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  const loadPendingSubscriptions = async () => {
    setLoading(true);
    try {
      const data = await subscriptionService.getPending();
      setPendingSubscriptions(data);
    } catch (err) {
      console.error('Erreur chargement souscriptions:', err);
      showErrorToast('Erreur lors du chargement des souscriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (window.confirm('Approuver cette souscription ?')) {
      try {
        await subscriptionService.approve(id);
        showSuccessToast('Souscription approuvée avec succès !');
        loadPendingSubscriptions();
      } catch (err) {
        showErrorToast('Erreur lors de l\'approbation');
      }
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Raison du rejet (optionnel):');
    if (reason !== null) {
      try {
        await subscriptionService.reject(id, reason);
        showSuccessToast('Souscription rejetée');
        loadPendingSubscriptions();
      } catch (err) {
        showErrorToast('Erreur lors du rejet');
      }
    }
  };

  const handleProductCreated = () => {
    // Recharger les produits après création
    loadProducts();
    // Passer à l'onglet produits
    setActivePage("products");
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">

      {/* --- SIDEBAR --- */}
      <div className="sidebar">

        <div className="profile">
          <div className="avatar">👤</div>
          <h3>{user?.nom} {user?.prenom}</h3>
          <p>{user?.email}</p>
        </div>

        <ul className="menu">
          <li
            className={activePage === "create" ? "active" : ""}
            onClick={() => setActivePage("create")}
          >
            Créer un produit d'assurance
          </li>

          <li
            className={activePage === "products" ? "active" : ""}
            onClick={() => setActivePage("products")}
          >
            Mes produits
          </li>

          <li
            className={activePage === "subscriptions" ? "active" : ""}
            onClick={() => setActivePage("subscriptions")}
          >
            Valider les souscriptions
          </li>

          <li
            className={activePage === "stats" ? "active" : ""}
            onClick={() => setActivePage("stats")}
          >
            Statistiques globales
          </li>

          <li
            onClick={handleLogout}
            style={{ marginTop: 'auto', color: '#ff4444', cursor: 'pointer' }}
          >
            🚪 Déconnexion
          </li>
        </ul>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="main">
        <div className="header">
          <h2>Dashboard Admin/Assureur</h2>
          <span style={{ fontSize: '14px', color: '#666' }}>
            Rôle: {user?.role}
          </span>
        </div>

        {/* --- PAGE CONTENT --- */}

        {activePage === "create" && (
          <div className="card_container">
            <CreateProductForm onSuccess={handleProductCreated} />
          </div>
        )}

        {activePage === "products" && (
          <div className="card_container">
            <div className="card">
              <h3>Mes produits d'assurance</h3>
              <hr className="title-line" />

            {loading ? (
              <p style={{ textAlign: 'center', padding: '20px' }}>Chargement...</p>
            ) : products.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                Aucun produit créé pour le moment.
              </p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Nom</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Type</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Couverture</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Prime</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Fréquence</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Statut</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Souscriptions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product.id} style={{ borderBottom: '1px solid #ddd' }}>
                      <td style={{ padding: '12px' }}>{product.nom_produit}</td>
                      <td style={{ padding: '12px' }}>{product.type_assurance}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{product.montant_couverture_base} €</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{product.prime_base} €</td>
                      <td style={{ padding: '12px', textAlign: 'center', textTransform: 'capitalize' }}>
                        {product.frequence_paiement}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          backgroundColor: product.status === 'actif' ? '#e8f5e9' : '#ffebee',
                          color: product.status === 'actif' ? '#2e7d32' : '#c62828'
                        }}>
                          {product.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {product.contracts_count || product.nombre_souscriptions || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            </div>
          </div>
        )}

        {activePage === "subscriptions" && (
          <div className="card">
            <h3>Valider les souscriptions</h3>
            <hr className="title-line" />

            {loading ? (
              <p style={{ textAlign: 'center', padding: '20px' }}>Chargement...</p>
            ) : pendingSubscriptions.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                Aucune souscription en attente
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5' }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>N° Police</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Assuré</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Produit</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Type</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Couverture</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Date début</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Date fin</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingSubscriptions.map(subscription => (
                      <tr key={subscription.id} style={{ borderBottom: '1px solid #ddd' }}>
                        <td style={{ padding: '12px' }}>{subscription.numero_police}</td>
                        <td style={{ padding: '12px' }}>
                          {subscription.user?.nom} {subscription.user?.prenom}
                          <br />
                          <span style={{ fontSize: '1.1rem', color: '#666' }}>
                            {subscription.user?.email}
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          {subscription.insurance_product?.nom_produit || 'N/A'}
                        </td>
                        <td style={{ padding: '12px' }}>{subscription.type_assurance}</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          {parseFloat(subscription.montant_couverture).toLocaleString()} €
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          {new Date(subscription.date_debut).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          {new Date(subscription.date_fin).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleApprove(subscription.id)}
                              style={{
                                padding: '5px 10px',
                                backgroundColor: '#4caf50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '1.2rem'
                              }}
                            >
                              ✓ Approuver
                            </button>
                            <button
                              onClick={() => handleReject(subscription.id)}
                              style={{
                                padding: '5px 10px',
                                backgroundColor: '#f44336',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '1.2rem'
                              }}
                            >
                              ✗ Rejeter
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activePage === "stats" && (
          <div className="card">
            <h3>Statistiques globales</h3>
            <p>Graphiques, chiffres, etc.</p>
          </div>
        )}
      </div>
    </div>
    
  );
}
