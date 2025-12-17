import { useState, useEffect } from "react";
import "./ExpertDashboard.css";
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastContainer';
import claimService from '../services/claimService';
import currencyService from '../services/currencyService';

export default function ExpertDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  const [activePage, setActivePage] = useState("en-attente");
  const [sinistres, setSinistres] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadClaims();
  }, []);

  const loadClaims = async () => {
    setLoading(true);
    try {
      const data = await claimService.getAll();
      setSinistres(data);
    } catch (err) {
      console.error('Erreur chargement sinistres:', err);
      showErrorToast('Erreur lors du chargement des sinistres');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleDecision = async (id, decision) => {
    setLoading(true);
    try {
      if (decision === 'valide') {
        const claim = sinistres.find(s => s.id === id);
        await claimService.approve(id, claim.montant_reclame, 'Sinistre approuvé par l\'expert');
        showSuccessToast('Sinistre validé avec succès');
      } else if (decision === 'rejete') {
        await claimService.reject(id, 'Sinistre rejeté après évaluation');
        showSuccessToast('Sinistre rejeté');
      }
      await loadClaims();
    } catch (err) {
      showErrorToast(typeof err === 'string' ? err : 'Erreur lors de la mise à jour du sinistre');
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
          <span style={{ fontSize: '12px', color: '#666' }}>Expert - {user?.specialite}</span>
        </div>

        <h3 className="sidebar-title">Liste des sinistres</h3>
        <ul className="sinister-status-list">
          <li
            className={activePage === "en-attente" ? "active" : ""}
            onClick={() => setActivePage("en-attente")}
          >
            <span className="bullet bullet-orange"></span> En attente
          </li>
          <li
            className={activePage === "rejete" ? "active" : ""}
            onClick={() => setActivePage("rejete")}
          >
            <span className="bullet bullet-red"></span> Rejeté
          </li>
          <li
            className={activePage === "valide" ? "active" : ""}
            onClick={() => setActivePage("valide")}
          >
            <span className="bullet bullet-green"></span> Validé / indemnisé
          </li>

          <li
            onClick={handleLogout}
            style={{ marginTop: 'auto', color: '#ff4444', cursor: 'pointer', paddingTop: '20px' }}
          >
            🚪 Déconnexion
          </li>
        </ul>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="main">
        <div className="header">
          <h2>Dashboard Expert</h2>
          <Link to="/login" className="link-home">Accueil</Link>
        </div>

        {/* --- SINISTRES --- */}
        {activePage === "en-attente" && (
          <div className="card_container">
            {loading ? (
              <div className="card">
                <p style={{ textAlign: 'center', padding: '20px' }}>Chargement des sinistres...</p>
              </div>
            ) : sinistres.filter((s) => s.status === "en_attente").length === 0 ? (
              <div className="card">
                <h3>Aucun sinistre en attente</h3>
                <hr className="title-line" />
                <p style={{ textAlign: 'center', color: '#666' }}>
                  Aucun sinistre en attente de traitement.
                </p>
              </div>
            ) : (
              sinistres
                .filter((s) => s.status === "en_attente")
                .map((sinistre) => (
                  <div key={sinistre.id} className="card sinister-card">
                    <h3>{sinistre.description}</h3>
                    <hr className="title-line" />
                    <p><strong>Montant réclamé :</strong> {currencyService.formatXAF(parseFloat(sinistre.montant_reclame))}</p>
                    {sinistre.proof_file && (
                      <>
                        <p><strong>Preuve :</strong></p>
                        <div className="proofs-container">
                          <span className="proof-item">{sinistre.proof_file}</span>
                          {sinistre.ipfs_hash && (
                            <span className="proof-item" style={{ fontSize: '1.1rem', color: '#666' }}>
                              IPFS: {sinistre.ipfs_hash.substring(0, 10)}...
                            </span>
                          )}
                        </div>
                      </>
                    )}
                    {sinistre.user && (
                      <p style={{ fontSize: '1.2rem', color: '#666', marginTop: '10px' }}>
                        <strong>Assuré :</strong> {sinistre.user.nom} {sinistre.user.prenom}
                      </p>
                    )}
                    <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                      <button
                        onClick={() => handleDecision(sinistre.id, "valide")}
                        disabled={loading}
                      >
                        Valider
                      </button>
                      <button
                        onClick={() => handleDecision(sinistre.id, "rejete")}
                        disabled={loading}
                      >
                        Rejeter
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {activePage === "rejete" && (
          <div className="card_container">
            {loading ? (
              <div className="card">
                <p style={{ textAlign: 'center', padding: '20px' }}>Chargement...</p>
              </div>
            ) : sinistres.filter((s) => s.status === "rejeté").length === 0 ? (
              <div className="card">
                <h3>Aucun sinistre rejeté</h3>
                <hr className="title-line" />
                <p style={{ textAlign: 'center', color: '#666' }}>
                  Aucun sinistre rejeté pour le moment.
                </p>
              </div>
            ) : (
              sinistres
                .filter((s) => s.status === "rejeté")
                .map((sinistre) => (
                  <div key={sinistre.id} className="card sinister-card">
                    <h3>{sinistre.description}</h3>
                    <hr className="title-line" />
                    <p><strong>Montant réclamé :</strong> {currencyService.formatXAF(parseFloat(sinistre.montant_reclame))}</p>
                    {sinistre.commentaire_expert && (
                      <p><strong>Commentaire :</strong> {sinistre.commentaire_expert}</p>
                    )}
                    {sinistre.user && (
                      <p style={{ fontSize: '1.2rem', color: '#666' }}>
                        <strong>Assuré :</strong> {sinistre.user.nom} {sinistre.user.prenom}
                      </p>
                    )}
                    <p style={{ color: '#f44336', fontWeight: 'bold', marginTop: '10px' }}>Status : Rejeté</p>
                  </div>
                ))
            )}
          </div>
        )}

        {activePage === "valide" && (
          <div className="card_container">
            {loading ? (
              <div className="card">
                <p style={{ textAlign: 'center', padding: '20px' }}>Chargement...</p>
              </div>
            ) : sinistres.filter((s) => s.status === "approuvé" || s.status === "payé").length === 0 ? (
              <div className="card">
                <h3>Aucun sinistre validé</h3>
                <hr className="title-line" />
                <p style={{ textAlign: 'center', color: '#666' }}>
                  Aucun sinistre validé ou indemnisé pour le moment.
                </p>
              </div>
            ) : (
              sinistres
                .filter((s) => s.status === "approuvé" || s.status === "payé")
                .map((sinistre) => (
                  <div key={sinistre.id} className="card sinister-card">
                    <h3>{sinistre.description}</h3>
                    <hr className="title-line" />
                    <p><strong>Montant réclamé :</strong> {currencyService.formatXAF(parseFloat(sinistre.montant_reclame))}</p>
                    {sinistre.montant_approuve && (
                      <p><strong>Montant approuvé :</strong> {currencyService.formatXAF(parseFloat(sinistre.montant_approuve))}</p>
                    )}
                    {sinistre.commentaire_expert && (
                      <p><strong>Commentaire :</strong> {sinistre.commentaire_expert}</p>
                    )}
                    {sinistre.user && (
                      <p style={{ fontSize: '1.2rem', color: '#666' }}>
                        <strong>Assuré :</strong> {sinistre.user.nom} {sinistre.user.prenom}
                      </p>
                    )}
                    <p style={{ color: sinistre.status === "payé" ? '#2196f3' : '#4caf50', fontWeight: 'bold', marginTop: '10px' }}>
                      Status : {sinistre.status === "payé" ? "Payé" : "Validé / En attente de paiement"}
                    </p>
                  </div>
                ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
