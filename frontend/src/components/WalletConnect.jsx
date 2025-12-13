import { useMetaMask } from '../hooks/useMetaMask';
import PropTypes from 'prop-types';
import { useEffect } from 'react';

const WalletConnect = ({ onConnect, showBalance = true }) => {
  const {
    account,
    balance,
    chainId,
    isConnecting,
    error,
    isConnected,
    isMetaMaskInstalled,
    connect,
    disconnect,
  } = useMetaMask();

  // Formater l'adresse (afficher seulement début et fin)
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Obtenir le nom du réseau
  const getNetworkName = (chainId) => {
    const networks = {
      '1': 'Ethereum Mainnet',
      '5': 'Goerli Testnet',
      '11155111': 'Sepolia Testnet',
      '137': 'Polygon Mainnet',
      '80001': 'Mumbai Testnet',
      '1337': 'Ganache Local',
      '5777': 'Ganache Local (5777)',
    };
    return networks[chainId] || `Chain ID: ${chainId}`;
  };

  // Appeler le callback parent quand on se connecte
  const handleConnect = async () => {
    await connect();
  };

  // Déclencher le callback quand account change (après connexion réussie)
  useEffect(() => {
    if (account && onConnect) {
      onConnect(account);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account]); // On surveille uniquement account, pas onConnect

  if (!isMetaMaskInstalled) {
    return (
      <div style={{
        padding: '15px',
        backgroundColor: '#fff3cd',
        border: '1px solid #ffc107',
        borderRadius: '8px',
        marginBottom: '15px'
      }}>
        <p style={{ margin: 0, fontWeight: 'bold', marginBottom: '8px' }}>
          ⚠️ MetaMask n'est pas installé
        </p>
        <p style={{ margin: 0, fontSize: '14px', marginBottom: '10px' }}>
          Vous devez installer MetaMask pour utiliser cette fonctionnalité.
        </p>
        <a
          href="https://metamask.io/download/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            padding: '8px 16px',
            backgroundColor: '#f6851b',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        >
          Installer MetaMask
        </a>
      </div>
    );
  }

  return (
    <div style={{
      padding: '15px',
      backgroundColor: isConnected ? '#e8f5e9' : '#f5f5f5',
      border: `1px solid ${isConnected ? '#4caf50' : '#ddd'}`,
      borderRadius: '8px',
      marginBottom: '15px'
    }}>
      {error && (
        <div style={{
          padding: '10px',
          backgroundColor: '#ffebee',
          color: '#d32f2f',
          borderRadius: '4px',
          marginBottom: '10px',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      {!isConnected ? (
        <div>
          <p style={{ margin: 0, marginBottom: '10px', fontWeight: 'bold' }}>
            🦊 Connecter votre Wallet MetaMask
          </p>
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            style={{
              padding: '10px 20px',
              backgroundColor: '#f6851b',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isConnecting ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            {isConnecting ? 'Connexion...' : 'Connecter MetaMask'}
          </button>
        </div>
      ) : (
        <div>
          <p style={{ margin: 0, marginBottom: '8px', fontWeight: 'bold' }}>
            ✅ Wallet connecté
          </p>

          <div style={{ fontSize: '14px', color: '#666' }}>
            <p style={{ margin: '5px 0' }}>
              <strong>Adresse:</strong> {formatAddress(account)}
            </p>

            {showBalance && balance && (
              <p style={{ margin: '5px 0' }}>
                <strong>Solde:</strong> {parseFloat(balance).toFixed(4)} ETH
              </p>
            )}

            <p style={{ margin: '5px 0' }}>
              <strong>Réseau:</strong> {getNetworkName(chainId)}
            </p>
          </div>

          <button
            onClick={disconnect}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '13px',
              marginTop: '10px'
            }}
          >
            Déconnecter
          </button>
        </div>
      )}
    </div>
  );
};

WalletConnect.propTypes = {
  onConnect: PropTypes.func,
  showBalance: PropTypes.bool,
};

export default WalletConnect;
