/**
 * Service de conversion et formatage des devises
 * ETH ↔ XAF (Franc CFA)
 */

// Taux de conversion fixes (peuvent être mis à jour via API externe)
const CONVERSION_RATES = {
  // 1 ETH = ~2,500,000 XAF (à ajuster selon le taux réel)
  ETH_TO_XAF: 2500000,
  // Taux USD → XAF (1 USD = ~600 XAF)
  USD_TO_XAF: 600,
  // Taux EUR → XAF (1 EUR = ~655 XAF)
  EUR_TO_XAF: 655,
};

const currencyService = {
  /**
   * Convertir ETH vers XAF
   * @param {number} ethAmount - Montant en ETH
   * @returns {number} Montant en XAF
   */
  ethToXAF: (ethAmount) => {
    return ethAmount * CONVERSION_RATES.ETH_TO_XAF;
  },

  /**
   * Convertir XAF vers ETH
   * @param {number} xafAmount - Montant en XAF
   * @returns {number} Montant en ETH
   */
  xafToETH: (xafAmount) => {
    return xafAmount / CONVERSION_RATES.ETH_TO_XAF;
  },

  /**
   * Convertir EUR vers XAF
   * @param {number} eurAmount - Montant en EUR
   * @returns {number} Montant en XAF
   */
  eurToXAF: (eurAmount) => {
    return eurAmount * CONVERSION_RATES.EUR_TO_XAF;
  },

  /**
   * Convertir XAF vers EUR
   * @param {number} xafAmount - Montant en XAF
   * @returns {number} Montant en EUR
   */
  xafToEUR: (xafAmount) => {
    return xafAmount / CONVERSION_RATES.EUR_TO_XAF;
  },

  /**
   * Convertir USD vers XAF
   * @param {number} usdAmount - Montant en USD
   * @returns {number} Montant en XAF
   */
  usdToXAF: (usdAmount) => {
    return usdAmount * CONVERSION_RATES.USD_TO_XAF;
  },

  /**
   * Convertir XAF vers USD
   * @param {number} xafAmount - Montant en XAF
   * @returns {number} Montant en USD
   */
  xafToUSD: (xafAmount) => {
    return xafAmount / CONVERSION_RATES.USD_TO_XAF;
  },

  /**
   * Formater un montant en XAF
   * @param {number} amount - Montant à formater
   * @param {boolean} withSymbol - Inclure le symbole XAF
   * @returns {string} Montant formaté
   */
  formatXAF: (amount, withSymbol = true) => {
    const formatted = new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

    return withSymbol ? `${formatted} XAF` : formatted;
  },

  /**
   * Formater un montant en ETH
   * @param {number} amount - Montant à formater
   * @param {number} decimals - Nombre de décimales
   * @returns {string} Montant formaté
   */
  formatETH: (amount, decimals = 6) => {
    return `${parseFloat(amount).toFixed(decimals)} ETH`;
  },

  /**
   * Obtenir les taux de conversion actuels
   * @returns {object} Taux de conversion
   */
  getRates: () => {
    return { ...CONVERSION_RATES };
  },

  /**
   * Mettre à jour les taux de conversion (pour intégration future avec API)
   * @param {object} newRates - Nouveaux taux
   */
  updateRates: (newRates) => {
    Object.assign(CONVERSION_RATES, newRates);
  },

  /**
   * Récupérer les taux depuis une API externe (CoinGecko par exemple)
   * @returns {Promise<object>} Taux mis à jour
   */
  fetchLiveRates: async () => {
    try {
      // API CoinGecko pour ETH price
      const ethResponse = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd,eur'
      );
      const ethData = await ethResponse.json();

      // API pour USD/XAF (peut utiliser exchangerate-api.com)
      const fxResponse = await fetch(
        'https://api.exchangerate-api.com/v4/latest/USD'
      );
      const fxData = await fxResponse.json();

      // Le XAF n'est pas toujours disponible, on utilise un taux fixe
      const usdToXaf = 600; // Taux approximatif
      const ethToUsd = ethData.ethereum.usd;
      const ethToXaf = ethToUsd * usdToXaf;

      const newRates = {
        ETH_TO_XAF: ethToXaf,
        USD_TO_XAF: usdToXaf,
        EUR_TO_XAF: ethData.ethereum.eur * (usdToXaf / ethToUsd),
      };

      currencyService.updateRates(newRates);

      return newRates;
    } catch (error) {
      console.error('Erreur récupération taux:', error);
      // Retourner les taux par défaut en cas d'erreur
      return CONVERSION_RATES;
    }
  },

  /**
   * Calculer le montant ETH nécessaire pour un montant XAF donné
   * Avec une marge de sécurité pour couvrir les frais de gas
   * @param {number} xafAmount - Montant en XAF
   * @param {number} gasMargin - Marge en pourcentage (par défaut 5%)
   * @returns {object} { ethAmount, ethWithMargin, gasEstimate }
   */
  calculateETHForPayment: (xafAmount, gasMargin = 0.05) => {
    const ethAmount = currencyService.xafToETH(xafAmount);
    const gasEstimate = ethAmount * gasMargin;
    const ethWithMargin = ethAmount + gasEstimate;

    return {
      ethAmount: parseFloat(ethAmount.toFixed(8)),
      ethWithMargin: parseFloat(ethWithMargin.toFixed(8)),
      gasEstimate: parseFloat(gasEstimate.toFixed(8)),
      xafAmount: xafAmount,
    };
  },

  /**
   * Vérifier si le solde ETH est suffisant pour un paiement en XAF
   * @param {number} ethBalance - Solde en ETH
   * @param {number} xafAmount - Montant à payer en XAF
   * @returns {object} { sufficient, required, available, deficit }
   */
  checkSufficientBalance: (ethBalance, xafAmount) => {
    const { ethWithMargin } = currencyService.calculateETHForPayment(xafAmount);
    const sufficient = ethBalance >= ethWithMargin;

    return {
      sufficient,
      required: ethWithMargin,
      available: ethBalance,
      deficit: sufficient ? 0 : ethWithMargin - ethBalance,
    };
  },
};

export default currencyService;
