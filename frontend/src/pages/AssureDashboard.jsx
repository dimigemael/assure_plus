import { useState, useEffect } from "react";
import "./AssureDashboard.css";
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastContainer';
import productService from '../services/productService';
import subscriptionService from '../services/subscriptionService';
import currencyService from '../services/currencyService';
import claimService from '../services/claimService';
import SubscriptionForm from '../components/SubscriptionForm';
import PremiumPayment from '../components/PremiumPayment';

export default function AssureDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  const [activePage, setActivePage] = useState("suscribe");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showSubscriptionForm, setShowSubscriptionForm] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // États pour les produits disponibles et les contrats actifs
  const [products, setProducts] = useState([]);
  const [myContracts, setMyContracts] = useState([]);
  const [allMySubscriptions, setAllMySubscriptions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Charger les produits disponibles et les contrats actifs au montage
  useEffect(() => {
    loadAvailableProducts();
    loadMyContracts();
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

  const loadMyContracts = async () => {
    try {
      const data = await subscriptionService.getMySubscriptions();
      // Stocker toutes les souscriptions pour vérifier les statuts
      setAllMySubscriptions(data);
      // Filtrer uniquement les contrats actifs
      const activeContracts = data.filter(contract => contract.status === 'actif');
      setMyContracts(activeContracts);
    } catch (err) {
      console.error('Erreur chargement contrats:', err);
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
      // Recharger les souscriptions pour mettre à jour le statut
      await loadMyContracts();
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

  const handleSinisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Créer un FormData pour envoyer le fichier
      const formData = new FormData();
      formData.append('contract_id', selectedProduct.id);
      formData.append('description', sinisterDetails.description);
      formData.append('montant_reclame', sinisterDetails.claimedAmount);

      if (sinisterDetails.proofs) {
        formData.append('proof_file', sinisterDetails.proofs);
      }

      await claimService.create(formData);

      showSuccessToast('Déclaration de sinistre envoyée avec succès ! Elle sera examinée par un expert.', 5000);

      // Réinitialiser le formulaire
      setSinisterDetails({ description: '', claimedAmount: '', proofs: null });
      setShowForm(false);
      setSelectedProduct(null);
    } catch (err) {
      showErrorToast(typeof err === 'string' ? err : 'Erreur lors de la déclaration du sinistre');
    } finally {
      setLoading(false);
    }
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
            className={activePage === "pay_premium" ? "active" : ""}
            onClick={() => setActivePage("pay_premium")}
          >
            💳 Payer mes primes
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
              products.map((product, index) => {
                // Vérifier si l'utilisateur a déjà souscrit à ce produit
                const existingSubscription = allMySubscriptions.find(
                  sub => sub.insurance_product_id === product.id
                );

                return (
                  <div key={index} className="card">
                    <h3>{product.nom_produit}</h3>
                    <hr className="title-line" />

                    <p><strong>Type :</strong> {product.type_assurance}</p>
                    <p><strong>Description :</strong> {product.description || 'Non spécifiée'}</p>
                    <p><strong>Montant couverture :</strong> {currencyService.formatXAF(parseFloat(product.montant_couverture_base))}</p>
                    <p><strong>Prime {product.frequence_paiement} :</strong> {currencyService.formatXAF(parseFloat(product.prime_base))}</p>
                    <p><strong>Franchise :</strong> {currencyService.formatXAF(parseFloat(product.franchise_base))}</p>

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

                    {existingSubscription ? (
                      // Afficher le statut si déjà souscrit
                      <div style={{
                        marginTop: '15px',
                        padding: '12px',
                        borderRadius: '6px',
                        textAlign: 'center',
                        backgroundColor:
                          existingSubscription.status === 'actif' ? '#e8f5e9' :
                          existingSubscription.status === 'brouillon' ? '#fff3e0' :
                          existingSubscription.status === 'resilie' ? '#ffebee' : '#f5f5f5',
                        color:
                          existingSubscription.status === 'actif' ? '#2e7d32' :
                          existingSubscription.status === 'brouillon' ? '#f57c00' :
                          existingSubscription.status === 'resilie' ? '#c62828' : '#666'
                      }}>
                        <strong style={{ fontSize: '1.4rem' }}>
                          {existingSubscription.status === 'actif' && '✓ Souscription active'}
                          {existingSubscription.status === 'brouillon' && '⏳ En attente de validation'}
                          {existingSubscription.status === 'resilie' && '✗ Souscription résiliée'}
                          {!['actif', 'brouillon', 'resilie'].includes(existingSubscription.status) &&
                            `Statut: ${existingSubscription.status}`
                          }
                        </strong>
                        {existingSubscription.status === 'brouillon' && (
                          <p style={{ margin: '5px 0 0 0', fontSize: '1.2rem' }}>
                            Votre demande est en cours de traitement par un administrateur
                          </p>
                        )}
                        {existingSubscription.status === 'actif' && (
                          <p style={{ margin: '5px 0 0 0', fontSize: '1.2rem' }}>
                            N° Police: {existingSubscription.numero_police}
                          </p>
                        )}
                      </div>
                    ) : (
                      // Afficher le bouton souscrire si pas encore souscrit
                      <button
                        onClick={() => {
                          setSelectedProduct(product);
                          setShowSubscriptionForm(true);
                        }}
                      >
                        Souscrire
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* --- DÉCLARER UN SINISTRE --- */}
        {activePage === "declare" && (
          <div className="card_container">

            {/* === ÉTAPE 1 : AFFICHER LISTE DES CONTRATS ACTIFS === */}
            {!showForm && (
              <>
                {loading ? (
                  <div className="card">
                    <p style={{ textAlign: 'center', padding: '20px' }}>Chargement...</p>
                  </div>
                ) : myContracts.length === 0 ? (
                  <div className="card">
                    <h3>Aucun contrat actif</h3>
                    <hr className="title-line" />
                    <p style={{ textAlign: 'center', color: '#666' }}>
                      Vous n'avez pas de contrats actifs pour déclarer un sinistre.
                    </p>
                  </div>
                ) : (
                  myContracts.map((contract, index) => (
                    <div key={index} className="card">
                      <h3>{contract.type_assurance}</h3>
                      <hr className="title-line" />

                      <p><strong>N° Police :</strong> {contract.numero_police}</p>
                      <p><strong>Montant couverture :</strong> {currencyService.formatXAF(parseFloat(contract.montant_couverture))}</p>
                      <p><strong>Date début :</strong> {new Date(contract.date_debut).toLocaleDateString('fr-FR')}</p>
                      <p><strong>Date fin :</strong> {new Date(contract.date_fin).toLocaleDateString('fr-FR')}</p>

                      <button
                        onClick={() => {
                          setSelectedProduct(contract);
                          setShowForm(true);
                        }}
                      >
                        Déclarer un sinistre<br/> pour ce contrat
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

        {/* --- PAIEMENT DE PRIMES --- */}
        {activePage === "pay_premium" && (
          <div className="card_container">
            <div className="card">
              <PremiumPayment />
            </div>
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
