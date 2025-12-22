import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import subscriptionService from '../services/subscriptionService';
import premiumService from '../services/premiumService';
import currencyService from '../services/currencyService';
import useMetaMask from '../hooks/useMetaMask';
import { SmartContractService } from '../services/smartContractService';
import { useToast } from './ToastContainer';
import './PremiumPayment.css';

const PremiumPayment = () => {
  const { success: showSuccessToast, error: showErrorToast, warning: showWarningToast, info: showInfoToast } = useToast();
  const { account, signer, isConnected, connect, balance, formatAddress } = useMetaMask();
  const [myContracts, setMyContracts] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [premiumHistory, setPremiumHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [smartContractService] = useState(new SmartContractService());

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
      await handleBlockchainPayment();
    } catch (err) {
      showErrorToast(typeof err === 'string' ? err : 'Erreur lors du paiement');
    } finally {
      setLoading(false);
    }
  };

  const handleBlockchainPayment = async () => {
    // Vérifier la connexion MetaMask
    if (!isConnected) {
      showInfoToast('Connexion à MetaMask...');
      try {
        await connect();
      } catch (error) {
        throw 'Veuillez connecter MetaMask pour payer via blockchain';
      }
    }

    // Vérifier que le contrat a un blockchain_policy_id
    if (!selectedContract.blockchain_policy_id) {
      throw 'Ce contrat n\'a pas encore été enregistré sur la blockchain. Veuillez contacter un administrateur.';
    }

    // Convertir XAF en ETH
    const xafAmount = parseFloat(paymentAmount);
    const { ethWithMargin, ethAmount, gasEstimate } = currencyService.calculateETHForPayment(xafAmount);

    // Vérifier le solde
    const balanceCheck = currencyService.checkSufficientBalance(parseFloat(balance), xafAmount);
    if (!balanceCheck.sufficient) {
      throw `Solde insuffisant. Requis: ${ethWithMargin.toFixed(6)} ETH (${currencyService.formatXAF(xafAmount)}), Disponible: ${balance} ETH`;
    }

    showInfoToast(`Paiement de ${currencyService.formatXAF(xafAmount)} (${ethAmount.toFixed(6)} ETH + ${gasEstimate.toFixed(6)} ETH de gas)...`);

    // Vérifier l'adresse du contrat
    const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
    if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
      throw 'Adresse du smart contract non configurée. Vérifiez VITE_CONTRACT_ADDRESS dans .env';
    }

    // Initialiser le smart contract
    if (!smartContractService.contractAddress) {
      smartContractService.setContractAddress(contractAddress);
    }

    console.log('=== BLOCKCHAIN PAYMENT DEBUG ===');
    console.log('Contract Address:', contractAddress);
    console.log('Signer:', signer);
    console.log('Signer address:', account);
    console.log('Blockchain Policy ID:', selectedContract.blockchain_policy_id);
    console.log('ETH Amount:', ethAmount);

    // Initialiser avec le signer
    try {
      await smartContractService.initialize(signer);
      console.log('Smart contract initialisé avec succès');
    } catch (error) {
      console.error('Erreur initialisation smart contract:', error);
      throw `Erreur d'initialisation du smart contract: ${error.message}`;
    }

    // Effectuer le paiement via smart contract
    const policyId = selectedContract.blockchain_policy_id;

    console.log('Calling payPremium with:', { policyId, ethAmount });

    const txResult = await smartContractService.payPremium(policyId, ethAmount);

    // Enregistrer le paiement dans la base de données
    const paymentData = {
      contract_id: selectedContract.id,
      montant: parseFloat(paymentAmount),
      transaction_hash: txResult.transactionHash,
      block_number: txResult.blockNumber,
    };

    await premiumService.create(paymentData);

    showSuccessToast(
      `✓ Paiement blockchain réussi ! Transaction: ${txResult.transactionHash.substring(0, 10)}...`,
      7000
    );

    // Recharger les données
    await loadPremiumHistory(selectedContract.id);
    await loadMyContracts();
    setPaymentAmount(selectedContract.prime);
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
                      <span className="value">{currencyService.formatXAF(parseFloat(contract.montant_couverture))}</span>
                    </div>
                    <div className="detail-row">
                      <span className="label">Prime {premiumService.formatFrequence(contract.frequence_paiement)}:</span>
                      <span className="value highlight">{currencyService.formatXAF(parseFloat(contract.prime))}</span>
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
            <p><strong>Montant de la prime:</strong> {currencyService.formatXAF(parseFloat(selectedContract.prime))}</p>
            <p><strong>Fréquence:</strong> {premiumService.formatFrequence(selectedContract.frequence_paiement)}</p>
            {isConnected && (
              <p><strong>Wallet connecté:</strong> {formatAddress(account)} ({parseFloat(balance).toFixed(4)} ETH)</p>
            )}
          </div>

          <form onSubmit={handlePayment} className="payment-form">
            <label>Montant à payer (XAF) *</label>
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
              {!isConnected ? (
                <>
                  ⚠️ Vous devez connecter MetaMask pour payer via la blockchain.
                  Le paiement sera automatiquement validé sur la blockchain Ethereum.
                </>
              ) : (
                <>
                  💰 Paiement via blockchain Ethereum.
                  Équivalent: ~{currencyService.xafToETH(parseFloat(paymentAmount || 0)).toFixed(6)} ETH
                </>
              )}
            </div>

            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'Traitement blockchain...' : isConnected ? '🔗 Payer via Blockchain' : '🦊 Connecter MetaMask et Payer'}
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
                        <td>{currencyService.formatXAF(parseFloat(premium.montant))}</td>
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
                    {currencyService.formatXAF(premiumService.calculateTotalPaid(premiumHistory))}
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
