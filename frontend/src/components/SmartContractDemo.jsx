import { useState, useEffect } from 'react';
import { useMetaMask } from '../hooks/useMetaMask';
import { useSmartContract } from '../hooks/useSmartContract';

/**
 * Composant de démonstration pour les interactions Smart Contract
 */
const SmartContractDemo = () => {
  const { isConnected, account } = useMetaMask();
  const {
    isInitialized,
    error,
    loading,
    createPolicy,
    declareClaim,
    getCounters,
    isOwner: checkIsOwner,
  } = useSmartContract();

  const [counters, setCounters] = useState(null);
  const [isOwner, setIsOwner] = useState(false);

  // Formulaire création police
  const [policyForm, setPolicyForm] = useState({
    coverageAmount: '10',
    premium: '0.1',
    duration: 365,
    initialPremium: '0.1',
  });

  // Formulaire déclaration sinistre
  const [claimForm, setClaimForm] = useState({
    policyId: 1,
    amount: '5',
    ipfsHash: '',
  });

  // Charger les compteurs au montage
  useEffect(() => {
    if (isInitialized) {
      loadCounters();
      checkOwner();
    }
  }, [isInitialized]);

  const loadCounters = async () => {
    try {
      const data = await getCounters();
      setCounters(data);
    } catch (err) {
      console.error('Erreur chargement compteurs:', err);
    }
  };

  const checkOwner = async () => {
    const result = await checkIsOwner();
    setIsOwner(result);
  };

  const handleCreatePolicy = async (e) => {
    e.preventDefault();

    try {
      const result = await createPolicy(
        parseFloat(policyForm.coverageAmount),
        parseFloat(policyForm.premium),
        parseInt(policyForm.duration),
        parseFloat(policyForm.initialPremium)
      );

      alert(`Police créée avec succès!\nID: ${result.policyId}\nTx: ${result.transactionHash}`);
      loadCounters();
    } catch (err) {
      alert(`Erreur: ${err.message}`);
    }
  };

  const handleDeclareClaim = async (e) => {
    e.preventDefault();

    if (!claimForm.ipfsHash) {
      alert('Veuillez fournir un hash IPFS');
      return;
    }

    try {
      const result = await declareClaim(
        parseInt(claimForm.policyId),
        parseFloat(claimForm.amount),
        claimForm.ipfsHash
      );

      alert(`Sinistre déclaré!\nID: ${result.claimId}\nTx: ${result.transactionHash}`);
      loadCounters();
    } catch (err) {
      alert(`Erreur: ${err.message}`);
    }
  };

  if (!isConnected) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Connectez-vous avec MetaMask pour interagir avec le Smart Contract</p>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Initialisation du Smart Contract...</p>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>🔗 Interaction Smart Contract</h2>

      {/* Statut */}
      <div style={{
        padding: '15px',
        backgroundColor: '#e8f5e9',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <p><strong>Compte:</strong> {account}</p>
        <p><strong>Rôle:</strong> {isOwner ? '👑 Propriétaire' : '👤 Utilisateur'}</p>
        {counters && (
          <>
            <p><strong>Polices totales:</strong> {counters.policyCounter}</p>
            <p><strong>Sinistres totaux:</strong> {counters.claimCounter}</p>
            <p><strong>Solde contrat:</strong> {counters.contractBalance} ETH</p>
          </>
        )}
      </div>

      {/* Formulaire création police */}
      <div style={{
        padding: '20px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3>📋 Créer une Police</h3>
        <form onSubmit={handleCreatePolicy}>
          <div style={{ marginBottom: '10px' }}>
            <label>Montant couverture (ETH):</label>
            <input
              type="number"
              step="0.01"
              value={policyForm.coverageAmount}
              onChange={(e) => setPolicyForm({ ...policyForm, coverageAmount: e.target.value })}
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label>Prime mensuelle (ETH):</label>
            <input
              type="number"
              step="0.01"
              value={policyForm.premium}
              onChange={(e) => setPolicyForm({ ...policyForm, premium: e.target.value })}
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label>Durée (jours):</label>
            <input
              type="number"
              value={policyForm.duration}
              onChange={(e) => setPolicyForm({ ...policyForm, duration: e.target.value })}
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label>Prime initiale à payer (ETH):</label>
            <input
              type="number"
              step="0.01"
              value={policyForm.initialPremium}
              onChange={(e) => setPolicyForm({ ...policyForm, initialPremium: e.target.value })}
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'En cours...' : 'Créer Police'}
          </button>
        </form>
      </div>

      {/* Formulaire déclaration sinistre */}
      <div style={{
        padding: '20px',
        border: '1px solid #ddd',
        borderRadius: '8px'
      }}>
        <h3>🚨 Déclarer un Sinistre</h3>
        <form onSubmit={handleDeclareClaim}>
          <div style={{ marginBottom: '10px' }}>
            <label>ID Police:</label>
            <input
              type="number"
              value={claimForm.policyId}
              onChange={(e) => setClaimForm({ ...claimForm, policyId: e.target.value })}
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label>Montant réclamé (ETH):</label>
            <input
              type="number"
              step="0.01"
              value={claimForm.amount}
              onChange={(e) => setClaimForm({ ...claimForm, amount: e.target.value })}
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>

          <div style={{ marginBottom: '10px' }}>
            <label>Hash IPFS des preuves:</label>
            <input
              type="text"
              value={claimForm.ipfsHash}
              onChange={(e) => setClaimForm({ ...claimForm, ipfsHash: e.target.value })}
              placeholder="Qm..."
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '10px 20px',
              backgroundColor: '#ff9800',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'En cours...' : 'Déclarer Sinistre'}
          </button>
        </form>
      </div>

      {error && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#ffebee',
          color: '#d32f2f',
          borderRadius: '8px'
        }}>
          <strong>Erreur:</strong> {error}
        </div>
      )}
    </div>
  );
};

export default SmartContractDemo;
