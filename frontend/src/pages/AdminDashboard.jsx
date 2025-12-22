import { useState, useEffect } from "react";
import "./AdminDashboard.css";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastContainer';
import productService from '../services/productService';
import subscriptionService from '../services/subscriptionService';
import currencyService from '../services/currencyService';
import statsService from '../services/statsService';
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
  const [stats, setStats] = useState(null);

  // Charger les produits ou souscriptions selon la page active
  useEffect(() => {
    if (activePage === "products") {
      loadProducts();
    } else if (activePage === "subscriptions") {
      loadPendingSubscriptions();
    } else if (activePage === "stats") {
      loadStats();
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

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await statsService.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Erreur chargement statistiques:', err);
      showErrorToast('Erreur lors du chargement des statistiques');
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
          <CreateProductForm onSuccess={handleProductCreated} />
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
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        {currencyService.formatXAF(parseFloat(product.montant_couverture_base))}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        {currencyService.formatXAF(parseFloat(product.prime_base))}
                      </td>
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
                          {currencyService.formatXAF(parseFloat(subscription.montant_couverture))}
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
          <div>
            <h3 style={{ marginBottom: '20px' }}>Statistiques globales</h3>

            {loading ? (
              <p style={{ textAlign: 'center', padding: '40px' }}>Chargement des statistiques...</p>
            ) : !stats ? (
              <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
                Erreur lors du chargement des statistiques
              </p>
            ) : (
              <>
                {/* Résumé */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                  <div className="card" style={{ padding: '20px', textAlign: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                    <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>{stats.summary.total_contracts}</div>
                    <div style={{ fontSize: '1.4rem', marginTop: '8px' }}>Contrats Total</div>
                  </div>

                  <div className="card" style={{ padding: '20px', textAlign: 'center', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                    <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>{stats.summary.active_contracts}</div>
                    <div style={{ fontSize: '1.4rem', marginTop: '8px' }}>Contrats Actifs</div>
                  </div>

                  <div className="card" style={{ padding: '20px', textAlign: 'center', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
                    <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>{stats.summary.total_users}</div>
                    <div style={{ fontSize: '1.4rem', marginTop: '8px' }}>Utilisateurs</div>
                  </div>

                  <div className="card" style={{ padding: '20px', textAlign: 'center', background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
                    <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>{stats.summary.total_products}</div>
                    <div style={{ fontSize: '1.4rem', marginTop: '8px' }}>Produits</div>
                  </div>
                </div>

                {/* Finances */}
                <div className="card" style={{ marginBottom: '30px', padding: '25px' }}>
                  <h4 style={{ marginBottom: '20px', fontSize: '1.8rem' }}>Finances</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                    <div>
                      <div style={{ color: '#666', fontSize: '1.3rem' }}>Couverture totale</div>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2196F3', marginTop: '5px' }}>
                        {currencyService.formatXAF(stats.finances.total_coverage)}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#666', fontSize: '1.3rem' }}>Primes totales</div>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4CAF50', marginTop: '5px' }}>
                        {currencyService.formatXAF(stats.finances.total_premiums)}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#666', fontSize: '1.3rem' }}>Revenus mensuels</div>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#FF9800', marginTop: '5px' }}>
                        {currencyService.formatXAF(stats.finances.monthly_revenue)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sinistres */}
                <div className="card" style={{ marginBottom: '30px', padding: '25px' }}>
                  <h4 style={{ marginBottom: '20px', fontSize: '1.8rem' }}>Sinistres</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px' }}>
                    <div>
                      <div style={{ color: '#666', fontSize: '1.3rem' }}>Total</div>
                      <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginTop: '5px' }}>{stats.claims.total_claims}</div>
                    </div>
                    <div>
                      <div style={{ color: '#666', fontSize: '1.3rem' }}>En attente</div>
                      <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#FF9800', marginTop: '5px' }}>{stats.claims.pending_claims}</div>
                    </div>
                    <div>
                      <div style={{ color: '#666', fontSize: '1.3rem' }}>Approuvés</div>
                      <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#4CAF50', marginTop: '5px' }}>{stats.claims.approved_claims}</div>
                    </div>
                    <div>
                      <div style={{ color: '#666', fontSize: '1.3rem' }}>Rejetés</div>
                      <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#F44336', marginTop: '5px' }}>{stats.claims.rejected_claims}</div>
                    </div>
                  </div>
                </div>

                {/* Blockchain */}
                <div className="card" style={{ marginBottom: '30px', padding: '25px', background: 'linear-gradient(135deg, #667eea20 0%, #764ba220 100%)' }}>
                  <h4 style={{ marginBottom: '20px', fontSize: '1.8rem' }}>Blockchain</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#666', fontSize: '1.3rem' }}>Contrats sur la blockchain</div>
                      <div style={{ fontSize: '3.5rem', fontWeight: 'bold', color: '#667eea', marginTop: '5px' }}>
                        {stats.blockchain.contracts_on_blockchain}
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#666', fontSize: '1.3rem' }}>Pourcentage</div>
                      <div style={{ fontSize: '3.5rem', fontWeight: 'bold', color: '#764ba2', marginTop: '5px' }}>
                        {stats.blockchain.blockchain_percentage}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contrats par type */}
                <div className="card" style={{ marginBottom: '30px', padding: '25px' }}>
                  <h4 style={{ marginBottom: '20px', fontSize: '1.8rem' }}>Répartition par type</h4>
                  {stats.contracts_by_type.length === 0 ? (
                    <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>Aucun contrat</p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                      {stats.contracts_by_type.map((item, index) => (
                        <div key={index} style={{
                          padding: '15px',
                          borderLeft: '4px solid #2196F3',
                          backgroundColor: '#f5f5f5',
                          borderRadius: '4px'
                        }}>
                          <div style={{ fontSize: '1.2rem', color: '#666', textTransform: 'capitalize' }}>
                            {item.type_assurance}
                          </div>
                          <div style={{ fontSize: '2.2rem', fontWeight: 'bold', marginTop: '5px' }}>
                            {item.total}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Activité récente */}
                <div className="card" style={{ padding: '25px' }}>
                  <h4 style={{ marginBottom: '20px', fontSize: '1.8rem' }}>Activité récente</h4>
                  {stats.recent_activity.length === 0 ? (
                    <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>Aucune activité récente</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {stats.recent_activity.map((activity, index) => (
                        <div key={index} style={{
                          padding: '15px',
                          backgroundColor: '#f9f9f9',
                          borderRadius: '8px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          borderLeft: '4px solid ' + (
                            activity.statut === 'actif' ? '#4CAF50' :
                            activity.statut === 'en_attente' ? '#FF9800' : '#999'
                          )
                        }}>
                          <div>
                            <div style={{ fontSize: '1.4rem', fontWeight: '500' }}>
                              Police {activity.numero_police}
                            </div>
                            <div style={{ fontSize: '1.2rem', color: '#666', marginTop: '4px' }}>
                              {activity.type_assurance} - {activity.user_name}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{
                              fontSize: '1.2rem',
                              padding: '4px 12px',
                              borderRadius: '12px',
                              backgroundColor:
                                activity.statut === 'actif' ? '#e8f5e9' :
                                activity.statut === 'en_attente' ? '#fff3e0' : '#f5f5f5',
                              color:
                                activity.statut === 'actif' ? '#2e7d32' :
                                activity.statut === 'en_attente' ? '#ef6c00' : '#666'
                            }}>
                              {activity.statut.replace('_', ' ')}
                            </div>
                            <div style={{ fontSize: '1.1rem', color: '#999', marginTop: '4px' }}>
                              {new Date(activity.date_debut).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
    
  );
}
