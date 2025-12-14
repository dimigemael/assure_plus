import { useState, useEffect } from "react";
import "./AssureDashboard.css";
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastContainer';
import productService from '../services/productService';
import subscriptionService from '../services/subscriptionService';
import SubscriptionForm from '../components/SubscriptionForm';

export default function AssureDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  const [activePage, setActivePage] = useState("suscribe");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showSubscriptionForm, setShowSubscriptionForm] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // États pour les produits disponibles
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Charger les produits disponibles au montage
  useEffect(() => {
    loadAvailableProducts();
  }, []);

  const loadAvailableProducts = async () => {
    setLoading(true);
    try {
      const data = await productService.getAvailable();
      setProducts(data);
    } catch (err) {
      console.error('Erreur chargement produits:', err);
      showErrorToast('Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Gérer la soumission de la souscription
  const handleSubscriptionSubmit = async (subscriptionData) => {
    setLoading(true);

    try {
      await subscriptionService.create(subscriptionData);
      showSuccessToast('Demande de souscription envoyée avec succès ! Elle sera validée par un administrateur.', 5000);
      setShowSubscriptionForm(false);
      setSelectedProduct(null);
    } catch (err) {
      showErrorToast(typeof err === 'string' ? err : 'Erreur lors de la souscription');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscriptionCancel = () => {
    setShowSubscriptionForm(false);
    setSelectedProduct(null);
  };

  // --- NOUVEAUX ÉTATS POUR LE FORMULAIRE DE SINISTRE ---
  const [sinisterDetails, setSinisterDetails] = useState({
    description: '',
    claimedAmount: '',
    proofs: null, // pour le fichier
  });

  const handleSinisterChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'proofs') {
        setSinisterDetails({ ...sinisterDetails, [name]: files[0] });
    } else {
        setSinisterDetails({ ...sinisterDetails, [name]: value });
    }
  };

  const handleSinisterSubmit = (e) => {
    e.preventDefault();
    // Ici, vous ajouteriez la logique de soumission à une API
    console.log("Sinistre à déclarer :", sinisterDetails);
    showSuccessToast(`Déclaration de sinistre reçue : ${sinisterDetails.description}. Montant réclamé : ${sinisterDetails.claimedAmount} FCFA.`, 5000);

    // Réinitialiser le formulaire
    setSinisterDetails({ description: '', claimedAmount: '', proofs: null });
    setShowForm(false);
    setSelectedProduct(null);
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
            className={activePage === "suscribe" ? "active" : ""}
            onClick={() => setActivePage("suscribe")}
          >
           Consulter/souscrire à un produit d'assurance
          </li>

          <li 
            className={activePage === "declare" ? "active" : ""}
            onClick={() => setActivePage("declare")}
          >
            Déclarer un sinistre
          </li>

          <li
            className={activePage === "list" ? "active" : ""}
            onClick={() => setActivePage("list")}
          >
           Historique des  contrats et transactions
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
          <h2>Dashboard Assuré</h2>
          <Link to="/login" className="link-home">Accueil</Link>
        </div>

        {/* --- PAGE CONTENT --- */}
        {activePage === "suscribe" && (
          <div className="card_container">
            {showSubscriptionForm && selectedProduct ? (
              <SubscriptionForm
                product={selectedProduct}
                onSubmit={handleSubscriptionSubmit}
                onCancel={handleSubscriptionCancel}
              />
            ) : loading ? (
              <div className="card">
                <p style={{ textAlign: 'center', padding: '20px' }}>Chargement des produits...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="card">
                <h3>Aucun produit disponible</h3>
                <hr className="title-line" />
                <p style={{ textAlign: 'center', color: '#666' }}>
                  Aucun produit d'assurance n'est actuellement disponible.
                </p>
              </div>
            ) : (
              products.map((product, index) => (
                <div key={index} className="card">
                  <h3>{product.nom_produit}</h3>
                  <hr className="title-line" />

                  <p><strong>Type :</strong> {product.type_assurance}</p>
                  <p><strong>Description :</strong> {product.description || 'Non spécifiée'}</p>
                  <p><strong>Montant couverture :</strong> {parseFloat(product.montant_couverture_base).toLocaleString()} €</p>
                  <p><strong>Prime {product.frequence_paiement} :</strong> {parseFloat(product.prime_base).toLocaleString()} €</p>
                  <p><strong>Franchise :</strong> {parseFloat(product.franchise_base).toLocaleString()} €</p>

                  {product.garanties_incluses && product.garanties_incluses.length > 0 && (
                    <div style={{ marginTop: '15px', fontSize: '1.3rem' }}>
                      <strong>Garanties incluses :</strong>
                      <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                        {product.garanties_incluses.map((garantie, idx) => (
                          <li key={idx}>
                            {garantie.nom} {garantie.obligatoire && <strong>(Obligatoire)</strong>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setSelectedProduct(product);
                      setShowSubscriptionForm(true);
                    }}
                  >
                    Souscrire
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* --- DÉCLARER UN SINISTRE --- */}
        {activePage === "declare" && (
          <div className="card_container">

            {/* === ÉTAPE 1 : AFFICHER LISTE DES PRODUITS === */}
            {!showForm && (
              <>
                {loading ? (
                  <div className="card">
                    <p style={{ textAlign: 'center', padding: '20px' }}>Chargement...</p>
                  </div>
                ) : products.length === 0 ? (
                  <div className="card">
                    <h3>Aucun produit disponible</h3>
                    <hr className="title-line" />
                    <p style={{ textAlign: 'center', color: '#666' }}>
                      Vous n'avez pas de contrats actifs pour déclarer un sinistre.
                    </p>
                  </div>
                ) : (
                  products.map((product, index) => (
                    <div key={index} className="card">
                      <h3>{product.nom_produit}</h3>
                      <hr className="title-line" />

                      <p><strong>Type :</strong> {product.type_assurance}</p>
                      <p><strong>Montant couverture :</strong> {parseFloat(product.montant_couverture_base).toLocaleString()} €</p>
                      <p><strong>Prime {product.frequence_paiement} :</strong> {parseFloat(product.prime_base).toLocaleString()} €</p>

                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setShowForm(true);
                        }}
                      >
                        Déclarer un sinistre<br/> pour ce produit
                      </button>
                    </div>
                  ))
                )}
              </>
            )}

            {/* === ÉTAPE 2 : AFFICHER LE FORMULAIRE === */}
            {showForm && selectedProduct && (
              <div className="card sinister-card">

                <h3 className="sinister-title">
                  Déclaration de sinistre
                </h3>
                <hr className="title-line2" />

                <form onSubmit={handleSinisterSubmit}>

                  <textarea 
                    name="description" 
                    placeholder="Description"
                    rows="3"
                    value={sinisterDetails.description}
                    onChange={handleSinisterChange}
                    required
                  />

                  <input 
                    name="claimedAmount"
                    type="number"
                    placeholder="Montant réclamé"
                    value={sinisterDetails.claimedAmount}
                    onChange={handleSinisterChange}
                    required
                  />

                  <label className="proofs-label">Téléverser des preuves</label>
                  <div 
                    className="file-upload-zone"
                    onClick={() => document.getElementById('proofs-input').click()} 
                  >
                    <input 
                      name="proofs"
                      type="file"
                      id="proofs-input"
                      onChange={handleSinisterChange}
                      style={{ display: 'none' }}
                    />

                    {sinisterDetails.proofs ? (
                      <p className="file-name">{sinisterDetails.proofs.name}</p>
                    ) : (
                      <p>Cliquez pour importer un fichier</p>
                    )}
                  </div>

                  <button type="submit" className="sinister-submit-btn">Envoyer</button>
                </form>

                {/*Bouton retour */}
                <button
                  className="go-back-btn"
                  onClick={() => {
                    setShowForm(false);
                    setSelectedProduct(null);
                  }}
                >
                  ← Retour aux produits
                </button>
              </div>
            )}

          </div>
        )}


        {activePage === "list" && (
          <div className="card">
            <h3>Historique des  contrats et transactions</h3>
          </div>
        )}
      </div>
    </div>
  );
}
