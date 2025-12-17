import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export const useMetaMask = () => {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);

  // Vérifier si MetaMask est installé
  const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  };

  // Connecter MetaMask
  const connect = async () => {
    if (!isMetaMaskInstalled()) {
      setError('MetaMask n\'est pas installé. Veuillez installer MetaMask pour continuer.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Demander l'accès au compte
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      const account = accounts[0];
      setAccount(account);

      // Créer le provider et le signer
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const web3Signer = await web3Provider.getSigner();

      setProvider(web3Provider);
      setSigner(web3Signer);

      // Récupérer le solde
      const balance = await web3Provider.getBalance(account);
      setBalance(ethers.formatEther(balance));

      // Récupérer le chainId
      const network = await web3Provider.getNetwork();
      setChainId(network.chainId.toString());

    } catch (err) {
      console.error('Erreur lors de la connexion:', err);
      setError(err.message || 'Erreur lors de la connexion à MetaMask');
    } finally {
      setIsConnecting(false);
    }
  };

  // Déconnecter (juste réinitialiser l'état local)
  const disconnect = () => {
    setAccount(null);
    setBalance(null);
    setChainId(null);
    setProvider(null);
    setSigner(null);
  };

  // Changer de réseau
  const switchNetwork = async (targetChainId) => {
    if (!isMetaMaskInstalled()) {
      setError('MetaMask n\'est pas installé');
      return;
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${Number(targetChainId).toString(16)}` }],
      });
    } catch (err) {
      // Si le réseau n'existe pas, proposer de l'ajouter
      if (err.code === 4902) {
        console.error('Ce réseau n\'est pas configuré dans MetaMask');
        // Vous pouvez ajouter une logique pour ajouter le réseau ici
      }
      setError(err.message);
    }
  };

  // Envoyer une transaction
  const sendTransaction = async (to, amountInEther) => {
    if (!signer) {
      throw new Error('Wallet non connecté');
    }

    try {
      const tx = await signer.sendTransaction({
        to: to,
        value: ethers.parseEther(amountInEther.toString())
      });

      // Attendre la confirmation
      const receipt = await tx.wait();
      return receipt;

    } catch (err) {
      console.error('Erreur transaction:', err);
      throw err;
    }
  };

  // Signer un message
  const signMessage = async (message) => {
    if (!signer) {
      throw new Error('Wallet non connecté');
    }

    try {
      const signature = await signer.signMessage(message);
      return signature;
    } catch (err) {
      console.error('Erreur signature:', err);
      throw err;
    }
  };

  // Écouter les changements de compte
  useEffect(() => {
    if (!isMetaMaskInstalled()) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAccount(accounts[0]);
        // Recharger le balance
        if (provider) {
          provider.getBalance(accounts[0]).then((balance) => {
            setBalance(ethers.formatEther(balance));
          });
        }
      }
    };

    const handleChainChanged = (chainId) => {
      setChainId(parseInt(chainId, 16).toString());
      // Recharger la page recommandé par MetaMask
      window.location.reload();
    };

    window.ethereum?.on('accountsChanged', handleAccountsChanged);
    window.ethereum?.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, [provider]);

  // Vérifier si déjà connecté au chargement
  useEffect(() => {
    if (!isMetaMaskInstalled()) return;

    window.ethereum
      .request({ method: 'eth_accounts' })
      .then((accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          // Initialiser le provider
          const web3Provider = new ethers.BrowserProvider(window.ethereum);
          setProvider(web3Provider);

          web3Provider.getSigner().then(setSigner);

          web3Provider.getBalance(accounts[0]).then((balance) => {
            setBalance(ethers.formatEther(balance));
          });

          web3Provider.getNetwork().then((network) => {
            setChainId(network.chainId.toString());
          });
        }
      })
      .catch(console.error);
  }, []);

  // Formater une adresse Ethereum (0x1234...5678)
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return {
    account,
    balance,
    chainId,
    isConnecting,
    error,
    provider,
    signer,
    isConnected: !!account,
    isMetaMaskInstalled: isMetaMaskInstalled(),
    connect,
    disconnect,
    switchNetwork,
    sendTransaction,
    signMessage,
    formatAddress,
  };
};

export default useMetaMask;
