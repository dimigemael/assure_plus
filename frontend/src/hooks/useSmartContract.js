import { useState, useEffect, useCallback } from 'react';
import { useMetaMask } from './useMetaMask';
import smartContractService from '../services/smartContractService';

/**
 * Hook personnalisé pour interagir avec le Smart Contract
 */
export const useSmartContract = () => {
  const { signer, provider, account, isConnected } = useMetaMask();
  const [contract, setContract] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Initialiser le contrat quand le signer est disponible
  useEffect(() => {
    const initContract = async () => {
      if (signer && isConnected) {
        try {
          const contractInstance = await smartContractService.initialize(signer);
          setContract(contractInstance);
          setIsInitialized(true);
          setError(null);
        } catch (err) {
          console.error('Erreur initialisation contrat:', err);
          setError(err.message);
          setIsInitialized(false);
        }
      } else {
        setContract(null);
        setIsInitialized(false);
      }
    };

    initContract();
  }, [signer, isConnected]);

  // Créer une police d'assurance
  const createPolicy = useCallback(async (coverageAmount, premium, duration, initialPremium) => {
    setLoading(true);
    setError(null);

    try {
      const result = await smartContractService.createPolicy(
        coverageAmount,
        premium,
        duration,
        initialPremium
      );
      setLoading(false);
      return result;
    } catch (err) {
      console.error('Erreur création police:', err);
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, []);

  // Payer une prime
  const payPremium = useCallback(async (policyId, amount) => {
    setLoading(true);
    setError(null);

    try {
      const result = await smartContractService.payPremium(policyId, amount);
      setLoading(false);
      return result;
    } catch (err) {
      console.error('Erreur paiement prime:', err);
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, []);

  // Déclarer un sinistre
  const declareClaim = useCallback(async (policyId, amount, ipfsHash) => {
    setLoading(true);
    setError(null);

    try {
      const result = await smartContractService.declareClaim(policyId, amount, ipfsHash);
      setLoading(false);
      return result;
    } catch (err) {
      console.error('Erreur déclaration sinistre:', err);
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, []);

  // Valider un sinistre (admin/expert)
  const validateClaim = useCallback(async (claimId, approved) => {
    setLoading(true);
    setError(null);

    try {
      const result = await smartContractService.validateClaim(claimId, approved);
      setLoading(false);
      return result;
    } catch (err) {
      console.error('Erreur validation sinistre:', err);
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, []);

  // Récupérer une police
  const getPolicy = useCallback(async (policyId) => {
    setError(null);

    try {
      return await smartContractService.getPolicy(policyId);
    } catch (err) {
      console.error('Erreur récupération police:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // Récupérer un sinistre
  const getClaim = useCallback(async (claimId) => {
    setError(null);

    try {
      return await smartContractService.getClaim(claimId);
    } catch (err) {
      console.error('Erreur récupération sinistre:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // Obtenir les compteurs
  const getCounters = useCallback(async () => {
    setError(null);

    try {
      const [policyCounter, claimCounter, contractBalance] = await Promise.all([
        smartContractService.getPolicyCounter(),
        smartContractService.getClaimCounter(),
        smartContractService.getContractBalance(),
      ]);

      return {
        policyCounter,
        claimCounter,
        contractBalance,
      };
    } catch (err) {
      console.error('Erreur récupération compteurs:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // Vérifier si l'utilisateur est le propriétaire
  const isOwner = useCallback(async () => {
    if (!account) return false;

    try {
      const ownerAddress = await smartContractService.getOwner();
      return ownerAddress.toLowerCase() === account.toLowerCase();
    } catch (err) {
      console.error('Erreur vérification propriétaire:', err);
      return false;
    }
  }, [account]);

  return {
    contract,
    isInitialized,
    error,
    loading,

    // Actions
    createPolicy,
    payPremium,
    declareClaim,
    validateClaim,

    // Queries
    getPolicy,
    getClaim,
    getCounters,
    isOwner,

    // Service direct (pour fonctions avancées)
    smartContractService,
  };
};
