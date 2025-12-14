import { useState, useEffect } from 'react';
import { useMetaMask } from '../hooks/useMetaMask';
import { useSmartContract } from '../hooks/useSmartContract';
import './BlockchainInfo.css';

/**
 * Composant pour afficher les informations blockchain
 */
const BlockchainInfo = ({ contractId, policyId }) => {
  const { isConnected, account, chainId, connectWallet } = useMetaMask();
  const { isInitialized, getPolicy, getCounters } = useSmartContract();

  const [policyData, setPolicyData] = useState(null);
  const [counters, setCounters] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isInitialized && policyId) {
      loadPolicyData();
    }
  }, [isInitialized, policyId]);

  useEffect(() => {
    if (isInitialized) {
      loadCounters();
    }
  }, [isInitialized]);

  const loadPolicyData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPolicy(policyId);
      setPolicyData(data);
    } catch (err) {
      setError('Erreur lors du chargement des données blockchain');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCounters = async () => {
    try {
      const data = await getCounters();
      setCounters(data);
    } catch (err) {
      console.error('Erreur chargement compteurs:', err);
    }
  };

  if (!isConnected) {
    return (
      <div className="blockchain-info-card">
        <div className="blockchain-header">
          <span className="blockchain-icon">🔗</span>
          <h3>Informations Blockchain</h3>
        </div>
        <div className="blockchain-connect">
          <p>Connectez votre wallet MetaMask pour voir les informations blockchain</p>
          <button onClick={connectWallet} className="btn-connect-wallet">
            Connecter MetaMask
          </button>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="blockchain-info-card">
        <div className="blockchain-header">
          <span className="blockchain-icon">🔗</span>
          <h3>Informations Blockchain</h3>
        </div>
        <div className="blockchain-loading">
          <div className="spinner"></div>
          <p>Initialisation du Smart Contract...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="blockchain-info-card">
      <div className="blockchain-header">
        <span className="blockchain-icon">🔗</span>
        <h3>Informations Blockchain</h3>
        <span className="blockchain-status connected">Connecté</span>
      </div>

      {/* Informations du wallet */}
      <div className="blockchain-section">
        <h4>Wallet</h4>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Adresse</span>
            <span className="info-value address">
              {account.substring(0, 6)}...{account.substring(account.length - 4)}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Réseau</span>
            <span className="info-value">
              {chainId === 5777 ? 'Ganache Local' : `Chain ID: ${chainId}`}
            </span>
          </div>
        </div>
      </div>

      {/* Statistiques globales */}
      {counters && (
        <div className="blockchain-section">
          <h4>Statistiques du Contrat</h4>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-icon">📋</span>
              <div className="stat-content">
                <span className="stat-value">{counters.policyCounter}</span>
                <span className="stat-label">Polices totales</span>
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">🚨</span>
              <div className="stat-content">
                <span className="stat-value">{counters.claimCounter}</span>
                <span className="stat-label">Sinistres totaux</span>
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">💰</span>
              <div className="stat-content">
                <span className="stat-value">{counters.contractBalance}</span>
                <span className="stat-label">ETH (Solde contrat)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Informations de la police */}
      {policyId && (
        <div className="blockchain-section">
          <h4>Police #{policyId}</h4>
          {loading && <div className="blockchain-loading"><div className="spinner"></div></div>}
          {error && <div className="blockchain-error">{error}</div>}
          {policyData && (
            <div className="policy-details">
              <div className="info-item">
                <span className="info-label">Assuré</span>
                <span className="info-value address">
                  {policyData.insured.substring(0, 6)}...{policyData.insured.substring(policyData.insured.length - 4)}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Couverture</span>
                <span className="info-value">{policyData.coverageAmount} ETH</span>
              </div>
              <div className="info-item">
                <span className="info-label">Prime mensuelle</span>
                <span className="info-value">{policyData.premium} ETH</span>
              </div>
              <div className="info-item">
                <span className="info-label">Solde</span>
                <span className="info-value">{policyData.balance} ETH</span>
              </div>
              <div className="info-item">
                <span className="info-label">Statut</span>
                <span className={`info-value status ${policyData.isActive ? 'active' : 'inactive'}`}>
                  {policyData.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Début</span>
                <span className="info-value">{new Date(policyData.startDate).toLocaleDateString('fr-FR')}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Fin</span>
                <span className="info-value">{new Date(policyData.endDate).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bouton de rafraîchissement */}
      <div className="blockchain-actions">
        <button
          onClick={() => {
            if (policyId) loadPolicyData();
            loadCounters();
          }}
          className="btn-refresh"
          disabled={loading}
        >
          🔄 Rafraîchir
        </button>
      </div>
    </div>
  );
};

export default BlockchainInfo;
