import { useState, useEffect } from 'react';
import premiumService from '../services/premiumService';
import './BlockchainTransactionHistory.css';

/**
 * Composant pour afficher l'historique des transactions blockchain
 */
const BlockchainTransactionHistory = ({ contractId }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (contractId) {
      loadTransactions();
    }
  }, [contractId]);

  const loadTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await premiumService.getContractHistory(contractId);
      setTransactions(response.data.premiums || []);
    } catch (err) {
      setError('Erreur lors du chargement des transactions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      payee: { label: 'Payée', className: 'success' },
      en_attente: { label: 'En attente', className: 'warning' },
      echouee: { label: 'Échouée', className: 'error' },
    };
    const { label, className } = statusMap[status] || { label: status, className: '' };
    return <span className={`status-badge ${className}`}>{label}</span>;
  };

  const openInExplorer = (txHash) => {
    // Pour Ganache local, on peut juste copier le hash
    // Pour un vrai réseau, on ouvrirait Etherscan
    navigator.clipboard.writeText(txHash);
    alert('Hash de transaction copié dans le presse-papier');
  };

  if (!contractId) {
    return null;
  }

  return (
    <div className="blockchain-tx-history">
      <div className="tx-history-header">
        <h3>
          <span className="tx-icon">📜</span>
          Historique des Transactions Blockchain
        </h3>
        <button onClick={loadTransactions} className="btn-refresh-tx" disabled={loading}>
          🔄 Rafraîchir
        </button>
      </div>

      {loading && (
        <div className="tx-loading">
          <div className="spinner"></div>
          <p>Chargement des transactions...</p>
        </div>
      )}

      {error && (
        <div className="tx-error">
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && transactions.length === 0 && (
        <div className="tx-empty">
          <p>Aucune transaction blockchain enregistrée</p>
        </div>
      )}

      {!loading && !error && transactions.length > 0 && (
        <div className="tx-list">
          {transactions.map((tx) => (
            <div key={tx.id} className="tx-item">
              <div className="tx-header">
                <div className="tx-amount">
                  <span className="amount-value">{tx.montant} €</span>
                  <span className="amount-label">Montant</span>
                </div>
                <div className="tx-status">
                  {getStatusBadge(tx.statut)}
                </div>
              </div>

              <div className="tx-details">
                <div className="tx-detail-item">
                  <span className="detail-label">Date</span>
                  <span className="detail-value">{formatDate(tx.date_paiement)}</span>
                </div>

                {tx.transaction_hash && (
                  <>
                    <div className="tx-detail-item">
                      <span className="detail-label">Hash</span>
                      <span
                        className="detail-value tx-hash"
                        onClick={() => openInExplorer(tx.transaction_hash)}
                        title="Cliquez pour copier"
                      >
                        {tx.transaction_hash.substring(0, 10)}...
                        {tx.transaction_hash.substring(tx.transaction_hash.length - 8)}
                      </span>
                    </div>

                    {tx.block_number && (
                      <div className="tx-detail-item">
                        <span className="detail-label">Bloc</span>
                        <span className="detail-value">#{tx.block_number}</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {tx.transaction_hash && (
                <div className="tx-footer">
                  <span className="blockchain-verified">✓ Vérifié sur la blockchain</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BlockchainTransactionHistory;
