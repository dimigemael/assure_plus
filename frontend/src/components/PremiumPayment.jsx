import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import subscriptionService from '../services/subscriptionService';
import premiumService from '../services/premiumService';
import { useToast } from './ToastContainer';
import './PremiumPayment.css';

const PremiumPayment = () => {
  const { success: showSuccessToast, error: showErrorToast, warning: showWarningToast } = useToast();
  const [myContracts, setMyContracts] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [premiumHistory, setPremiumHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  // Charger les contrats de l'utilisateur
  useEffect(() => {
    loadMyContracts();
  }, []);

  const loadMyContracts = async () => {
    setLoading(true);
    try {
      const response = await subscriptionService.getMySubscriptions();
      // Filtrer uniquement les contrats actifs
      const activeContracts = response.filter(contract => contract.status === 'actif');
      setMyContracts(activeContracts);
    } catch (err) {
      console.error('Erreur chargement contrats:', err);
      showErrorToast('Erreur lors du chargement de vos contrats');
    } finally {
      setLoading(false);
    }
  };

  const loadPremiumHistory = async (contractId) => {
    try {
      const response = await premiumService.getContractHistory(contractId);
      setPremiumHistory(response.data.premiums || []);
    } catch (err) {
      console.error('Erreur chargement historique:', err);
    }
  };

  const handleSelectContract = async (contract) => {
    setSelectedContract(contract);
    setPaymentAmount(contract.prime);
    setShowPaymentForm(true);
    await loadPremiumHistory(contract.id);
  };

  const handlePayment = async (e) => {
    e.preventDefault();

    if (!selectedContract) {
      showErrorToast('Veuillez sélectionner un contrat');
      return;
    }

    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      showErrorToast('Veuillez entrer un montant valide');
      return;
    }

    setLoading(true);

    try {
      const paymentData = {
        contract_id: selectedContract.id,
        montant: parseFloat(paymentAmount),
      };

      await premiumService.create(paymentData);
      showSuccessToast('Paiement enregistré avec succès ! Votre prime sera validée par un administrateur.', 5000);

      // Recharger l'historique et la liste des contrats
      await loadPremiumHistory(selectedContract.id);
      await loadMyContracts();

      // Réinitialiser le formulaire
      setPaymentAmount(selectedContract.prime);
    } catch (err) {
      showErrorToast(typeof err === 'string' ? err : 'Erreur lors du paiement');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (statut) => {
    const statusInfo = premiumService.formatStatus(statut);
    return (
      <span
        className="status-badge"
        style={{
          backgroundColor: statusInfo.color,
          color: 'white',
          padding: '4px 12px',
          borderRadius: '12px',
          fontSize: '1.2rem',
          fontWeight: '500'
        }}
      >
        {statusInfo.icon} {statusInfo.label}
      </span>
    );
  };

  const getOverdueWarning = (contract) => {
    if (premiumService.hasOverdue(contract)) {
      const days = premiumService.daysOverdue(contract);
      const level = premiumService.getOverdueLevel(contract);

      return (
        <div className={`overdue-warning overdue-${level}`}>
          ⚠ Échéance dépassée de {days} jour{days > 1 ? 's' : ''}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="premium-payment-container">
      {!showPaymentForm ? (
        <div className="contracts-list">
          <h3>Mes Contrats d'Assurance</h3>
          <hr className="title-line" />

          {loading ? (
            <p style={{ textAlign: 'center', padding: '20px' }}>Chargement...</p>
          ) : myContracts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <p style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Aucun contrat actif</p>
              <p style={{ fontSize: '1.3rem' }}>Vous devez d'abord souscrire à un produit d'assurance</p>
            </div>
          ) : (
            <div className="contracts-grid">
              {myContracts.map((contract) => (
                <div key={contract.id} className="contract-card">
                  {getOverdueWarning(contract)}

                  <div className="contract-header">
                    <h4>{contract.type_assurance}</h4>
                    <span className="contract-number">{contract.numero_police}</span>
                  </div>

                  <div className="contract-details">
                    <div className="detail-row">
                      <span className="label">Couverture:</span>
                      <span className="value">{parseFloat(contract.montant_couverture).toLocaleString()} €</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Prime {premiumService.formatFrequence(contract.frequence_paiement)}:</span>
                      <span className="value highlight">{parseFloat(contract.prime).toLocaleString()} €</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Prochaine échéance:</span>
                      <span className="value">{formatDate(contract.prochaine_echeance)}</span>
                    </div>
                    {contract.derniere_prime_payee_le && (
                      <div className="detail-row">
                        <span className="label">Dernier paiement:</span>
                        <span className="value">{formatDate(contract.derniere_prime_payee_le)}</span>
                      </div>
                    )}
                  </div>

                  <button
                    className="pay-button"
                    onClick={() => handleSelectContract(contract)}
                  >
                    Payer ma prime
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="payment-form-container">
          <div className="payment-header">
            <button
              className="back-button"
              onClick={() => {
                setShowPaymentForm(false);
                setSelectedContract(null);
              }}
            >
              ← Retour
            </button>
            <h3>Paiement de Prime</h3>
          </div>
          <hr className="title-line" />

          <div className="contract-summary">
            <h4>Contrat: {selectedContract.numero_police}</h4>
            <p><strong>Type:</strong> {selectedContract.type_assurance}</p>
            <p><strong>Montant de la prime:</strong> {parseFloat(selectedContract.prime).toLocaleString()} €</p>
            <p><strong>Fréquence:</strong> {premiumService.formatFrequence(selectedContract.frequence_paiement)}</p>
          </div>

          <form onSubmit={handlePayment} className="payment-form">
            <label>Montant à payer (€) *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="Montant"
              required
            />

            <div className="form-note">
              Note: Le paiement sera validé par un administrateur après vérification.
            </div>

            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'Traitement...' : 'Confirmer le paiement'}
            </button>
          </form>

          {premiumHistory.length > 0 && (
            <div className="premium-history">
              <h4>Historique des paiements</h4>
              <div className="history-table">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Montant</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {premiumHistory.map((premium) => (
                      <tr key={premium.id}>
                        <td>{formatDate(premium.date_paiement)}</td>
                        <td>{parseFloat(premium.montant).toLocaleString()} €</td>
                        <td>{getStatusBadge(premium.statut)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="history-stats">
                <div className="stat-item">
                  <span className="stat-label">Total payé:</span>
                  <span className="stat-value">
                    {premiumService.calculateTotalPaid(premiumHistory).toLocaleString()} €
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Nombre de paiements:</span>
                  <span className="stat-value">
                    {premiumService.countSuccessful(premiumHistory)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

PremiumPayment.propTypes = {};

export default PremiumPayment;
