# 🔗 Smart Contracts - Assurance Blockchain

Ce dossier contient les Smart Contracts Solidity pour le système de gestion des assurances décentralisé.

## 📁 Structure

```
blockchain/
├── contracts/              # Smart Contracts Solidity
│   └── InsuranceContract.sol
├── migrations/            # Scripts de déploiement Truffle
│   └── 1_deploy_contracts.js
├── test/                  # Tests unitaires
│   └── insurance_contract_test.js (à créer)
├── build/                 # Artifacts compilés (généré)
├── truffle-config.js      # Configuration Truffle
├── package.json           # Dépendances Node.js
└── Dockerfile             # Image Docker pour Truffle
```

## 🛠️ Développement Local

### Compilation des Contrats

```bash
# Dans le conteneur Docker
docker-compose exec truffle npx truffle compile

# Ou localement (si Truffle est installé)
cd blockchain
npm install
npx truffle compile
```

### Déploiement sur Ganache

```bash
# Déployer sur le réseau de développement (Ganache)
docker-compose exec truffle npx truffle migrate --network development

# Redéployer (reset)
docker-compose exec truffle npx truffle migrate --reset --network development
```

### Tests

```bash
# Exécuter tous les tests
docker-compose exec truffle npx truffle test

# Test spécifique
docker-compose exec truffle npx truffle test test/insurance_contract_test.js
```

### Console Truffle

```bash
# Ouvrir la console interactive
docker-compose exec truffle npx truffle console --network development

# Exemples de commandes dans la console
truffle(development)> let instance = await InsuranceContract.deployed()
truffle(development)> let accounts = await web3.eth.getAccounts()
truffle(development)> await instance.createPolicy(10000, 100, 31536000, {from: accounts[0], value: 100})
```

## 📝 InsuranceContract.sol

### Structures de Données

#### Policy (Police d'Assurance)
```solidity
struct Policy {
    address payable insured;     // Adresse de l'assuré
    uint256 coverageAmount;      // Montant de couverture
    uint256 premium;             // Prime mensuelle
    uint256 startDate;           // Date de début
    uint256 endDate;             // Date de fin
    bool isActive;               // Statut actif/inactif
    uint256 balance;             // Solde du contrat
}
```

#### Claim (Sinistre)
```solidity
struct Claim {
    uint256 policyId;            // ID de la police concernée
    address claimant;            // Adresse du déclarant
    uint256 amountClaimed;       // Montant réclamé
    string ipfsHash;             // Hash IPFS des preuves
    bool isValidated;            // Sinistre validé ?
    bool isPaid;                 // Indemnisation payée ?
    uint256 declarationDate;     // Date de déclaration
}
```

### Fonctions Principales

#### createPolicy
Crée une nouvelle police d'assurance.

```solidity
function createPolicy(
    uint256 _coverageAmount,
    uint256 _premium,
    uint256 _duration
) public payable returns (uint256)
```

**Paramètres:**
- `_coverageAmount`: Montant maximum de couverture
- `_premium`: Montant de la prime mensuelle (en Wei)
- `_duration`: Durée du contrat en secondes

**Retourne:** L'ID de la police créée

**Exemple:**
```javascript
// Créer une police avec 10 ETH de couverture, 0.1 ETH de prime, durée 1 an
await contract.createPolicy(
    web3.utils.toWei('10', 'ether'),
    web3.utils.toWei('0.1', 'ether'),
    31536000,  // 365 jours en secondes
    { from: userAddress, value: web3.utils.toWei('0.1', 'ether') }
);
```

#### payPremium
Payer une prime pour une police existante.

```solidity
function payPremium(uint256 _policyId) public payable
```

#### declareClaim
Déclarer un sinistre.

```solidity
function declareClaim(
    uint256 _policyId,
    uint256 _amount,
    string memory _ipfsHash
) public returns (uint256)
```

**Exemple:**
```javascript
await contract.declareClaim(
    1,  // policyId
    web3.utils.toWei('5', 'ether'),  // montant réclamé
    'QmXxxxxxxxxxxxxxxxxxxxxxxxxxxxx',  // Hash IPFS des preuves
    { from: userAddress }
);
```

#### validateClaim
Valider ou rejeter un sinistre (uniquement le owner).

```solidity
function validateClaim(uint256 _claimId, bool _approved) public onlyOwner
```

### Événements

```solidity
event PolicyCreated(uint256 indexed policyId, address indexed insured, uint256 coverageAmount);
event PremiumPaid(uint256 indexed policyId, uint256 amount, uint256 timestamp);
event ClaimDeclared(uint256 indexed claimId, uint256 indexed policyId, uint256 amount, string ipfsHash);
event ClaimValidated(uint256 indexed claimId, bool approved);
event IndemnityPaid(uint256 indexed claimId, address indexed beneficiary, uint256 amount);
```

## 🔐 Sécurité

### Vulnérabilités Prévenues

✅ **Reentrancy Attack** - Pattern Checks-Effects-Interactions appliqué
✅ **Integer Overflow/Underflow** - Utilisation de Solidity 0.8+ (protections natives)
✅ **Unauthorized Access** - Modificateurs `onlyOwner` et vérifications d'identité
✅ **DoS** - Pas de boucles infinies, gas limit raisonnable

### Modificateurs de Sécurité

```solidity
modifier onlyOwner() {
    require(msg.sender == owner, "Non autorise");
    _;
}

modifier policyExists(uint256 _policyId) {
    require(_policyId > 0 && _policyId <= policyCounter, "Police inexistante");
    _;
}

modifier policyActive(uint256 _policyId) {
    require(policies[_policyId].isActive, "Police inactive");
    _;
}
```

## 📊 Optimisation du Gas

### Techniques Utilisées

- ✅ Variables `storage` vs `memory` optimisées
- ✅ Packing de variables dans les structs
- ✅ Utilisation de `uint256` (type natif EVM)
- ✅ Événements au lieu de stockage pour les logs

### Estimation du Coût

| Fonction | Gas Estimé |
|----------|------------|
| `createPolicy()` | ~150,000 |
| `payPremium()` | ~50,000 |
| `declareClaim()` | ~100,000 |
| `validateClaim()` | ~80,000 |
| `_payIndemnity()` | ~60,000 |

## 🧪 Écrire des Tests

Créez un fichier `test/insurance_contract_test.js` :

```javascript
const InsuranceContract = artifacts.require("InsuranceContract");

contract("InsuranceContract", (accounts) => {
    let instance;
    const [owner, user1, user2, expert] = accounts;

    beforeEach(async () => {
        instance = await InsuranceContract.new();
    });

    it("should create a policy", async () => {
        const coverageAmount = web3.utils.toWei('10', 'ether');
        const premium = web3.utils.toWei('0.1', 'ether');
        const duration = 31536000;

        const result = await instance.createPolicy(
            coverageAmount,
            premium,
            duration,
            { from: user1, value: premium }
        );

        assert.equal(result.logs[0].event, 'PolicyCreated');
        assert.equal(result.logs[0].args.policyId.toNumber(), 1);
    });

    it("should declare a claim", async () => {
        // Créer d'abord une police
        await instance.createPolicy(
            web3.utils.toWei('10', 'ether'),
            web3.utils.toWei('0.1', 'ether'),
            31536000,
            { from: user1, value: web3.utils.toWei('0.1', 'ether') }
        );

        // Déclarer un sinistre
        const result = await instance.declareClaim(
            1,
            web3.utils.toWei('5', 'ether'),
            'QmTest123',
            { from: user1 }
        );

        assert.equal(result.logs[0].event, 'ClaimDeclared');
    });
});
```

## 🔄 Intégration avec Laravel

Le backend Laravel interagit avec les Smart Contracts via Web3.js.

Exemple de service Laravel (à créer) :

```php
<?php

namespace App\Services;

use Web3\Web3;
use Web3\Contract;

class BlockchainService
{
    private $web3;
    private $contract;

    public function __construct()
    {
        $this->web3 = new Web3(env('BLOCKCHAIN_RPC_URL'));
        // Charger l'ABI et l'adresse du contrat
        $abi = json_decode(file_get_contents(storage_path('contracts/InsuranceContract.json')), true);
        $this->contract = new Contract($this->web3->provider, $abi['abi']);
        $this->contract->at(env('CONTRACT_ADDRESS'));
    }

    public function createPolicy($coverageAmount, $premium, $duration, $fromAddress)
    {
        // Appeler la fonction createPolicy du smart contract
        $this->contract->send('createPolicy',
            $coverageAmount,
            $premium,
            $duration,
            [
                'from' => $fromAddress,
                'value' => $premium
            ],
            function ($err, $result) {
                // Gérer le résultat
            }
        );
    }
}
```

## 📚 Ressources

- [Documentation Solidity](https://docs.soliditylang.org/)
- [Documentation Truffle](https://trufflesuite.com/docs/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Ethereum Gas Optimization](https://www.alchemy.com/overviews/solidity-gas-optimization)

## 🤝 Contribution

Pour contribuer aux Smart Contracts :

1. Créer une branche : `git checkout -b feature/nouveau-contrat`
2. Modifier les contrats
3. Compiler : `npx truffle compile`
4. Tester : `npx truffle test`
5. Commit : `git commit -m "feat: ajout de X"`
6. Push et créer une Pull Request

---

**Responsable Blockchain** : TAHUE TCHOUTCHOUA GEMAEL DIMITRI
