# 🎉 Intégration Blockchain Complétée !

## ✅ Ce qui a été réalisé

### 1. Infrastructure Docker
- ✅ MySQL (port 3307)
- ✅ Ganache - Blockchain Ethereum locale (port 7545)
- ✅ IPFS - Stockage décentralisé (ports 5001, 8080)
- ✅ Backend Laravel (port 8000)
- ✅ Truffle - Déploiement des Smart Contracts

### 2. Smart Contract
- ✅ **InsuranceContract.sol** déployé sur Ganache
- ✅ Adresse : `0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab`
- ✅ Network ID : 5777
- ✅ Fonctions : createPolicy, payPremium, declareClaim, validateClaim

### 3. Services Laravel
- ✅ **Web3Service** - Communication avec Ganache via JSON-RPC
- ✅ **InsuranceBlockchainService** - Gestion des polices et sinistres sur blockchain
- ✅ **BlockchainTestController** - Endpoints de test

### 4. Contrôleurs mis à jour
- ✅ **ContractController** - Création de polices sur blockchain
- ✅ **ClaimController** - Déclaration et validation de sinistres sur blockchain

### 5. Base de données
- ✅ Ajout de `blockchain_policy_id` dans `contracts`
- ✅ Ajout de `blockchain_claim_id` dans `claims`
- ✅ Champs `transaction_hash` et `smart_contract_address` pour traçabilité

---

## 🧪 Comment tester

### Test 1 : Connexion Blockchain

```bash
curl http://localhost:8000/api/blockchain/test
```

**Résultat attendu :**
```json
{
  "status": "success",
  "message": "Connexion blockchain réussie",
  "blockchain": {
    "connected": true,
    "rpc_url": "http://ganache:8545",
    "network_id": "5777",
    "contract_address": "0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab",
    "client_version": "Ganache/v7.9.2/EthereumJS TestRPC/v7.9.2/ethereum-js"
  }
}
```

### Test 2 : Créer une police d'assurance sur blockchain

**Étape 1 : Se connecter**
```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"client@test.com","password":"password"}'
```

**Étape 2 : Récupérer un compte Ganache**

Les comptes de test Ganache disponibles :
- `0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1` (100 ETH)
- `0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0` (100 ETH)
- `0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b` (100 ETH)

**Étape 3 : Créer un contrat sur blockchain**
```bash
curl -X POST http://localhost:8000/api/contracts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_TOKEN_JWT" \
  -d '{
    "type_assurance": "Automobile",
    "montant_couverture": 50000,
    "prime_mensuelle": 500,
    "date_debut": "2025-01-01",
    "date_fin": "2026-01-01",
    "ethereum_address": "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1"
  }'
```

**Résultat attendu :**
```json
{
  "message": "Contrat créé avec succès et enregistré sur la blockchain",
  "contrat": {
    "id": 1,
    "blockchain_policy_id": 1,
    "transaction_hash": "0x...",
    "smart_contract_address": "0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab",
    "status": "actif"
  },
  "blockchain": {
    "policy_id": 1,
    "transaction_hash": "0x...",
    "contract_address": "0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab"
  }
}
```

### Test 3 : Déclarer un sinistre sur blockchain

**Étape 1 : Uploader un fichier de preuve et déclarer le sinistre**
```bash
curl -X POST http://localhost:8000/api/claims \
  -H "Authorization: Bearer VOTRE_TOKEN_JWT" \
  -F "contract_id=1" \
  -F "description=Accident de voiture" \
  -F "montant_reclame=10000" \
  -F "ethereum_address=0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1" \
  -F "proof_file=@/chemin/vers/preuve.jpg"
```

### Test 4 : Valider un sinistre (Admin/Expert uniquement)

**Connexion en tant qu'expert :**
```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"expert@test.com","password":"password"}'
```

**Valider le sinistre :**
```bash
curl -X PATCH http://localhost:8000/api/claims/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_EXPERT" \
  -d '{
    "status": "approuvé",
    "commentaire_expert": "Sinistre validé après vérification",
    "montant_approuve": 10000,
    "ethereum_address": "0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0"
  }'
```

---

## 📋 Comptes de test

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| `client@test.com` | `password` | Client |
| `expert@test.com` | `password` | Expert |
| `admin@test.com` | `password` | Admin |

## 🔗 URLs importantes

- **Backend API** : http://localhost:8000/api
- **Ganache RPC** : http://localhost:7545
- **IPFS Gateway** : http://localhost:8080/ipfs/{hash}
- **IPFS API** : http://localhost:5001

---

## 🛠️ Commandes utiles

### Voir les logs

```bash
# Tous les services
docker-compose logs -f

# Backend seulement
docker-compose logs -f backend

# Blockchain Ganache
docker-compose logs -f ganache

# Truffle (déploiement)
docker-compose logs truffle
```

### Redémarrer un service

```bash
docker-compose restart backend
docker-compose restart ganache
```

### Accéder à la console Truffle

```bash
docker-compose exec truffle npx truffle console --network development
```

Puis dans la console :
```javascript
let instance = await InsuranceContract.deployed()
let accounts = await web3.eth.getAccounts()
let policy = await instance.getPolicy(1)
console.log(policy)
```

---

## 🎯 Prochaines étapes

1. **Frontend React** (assigné à MAHACHU)
   - Intégrer Web3.js ou Ethers.js
   - Connecter MetaMask
   - Créer les interfaces utilisateur

2. **Tests automatisés**
   - Tests unitaires du Smart Contract (Truffle Test)
   - Tests d'intégration Laravel + Blockchain

3. **Sécurité**
   - Audit du Smart Contract
   - Gestion des clés privées
   - Rate limiting sur les endpoints blockchain

4. **Optimisations**
   - Cache des appels RPC
   - Queue pour les transactions blockchain asynchrones
   - Gestion des erreurs de transaction

---

## 📝 Notes importantes

1. **Adresses Ethereum** : Pour interagir avec la blockchain, chaque utilisateur doit fournir son adresse Ethereum Ganache ou MetaMask.

2. **Gas et transactions** : Les transactions blockchain consomment du gas (ETH). En développement, Ganache fournit des comptes avec 100 ETH chacun.

3. **IPFS** : Les preuves de sinistres sont stockées sur IPFS et seul le hash est enregistré sur la blockchain.

4. **Synchronisation** : Les données sont stockées à la fois en BDD MySQL (pour les requêtes rapides) et sur la blockchain (pour l'immuabilité).

---

**Projet réalisé par :**
- TAHUE TCHOUTCHOUA GEMAEL DIMITRI (Blockchain)
- FOTSING KENGNE DIANE IRIS (Backend)
- MAHACHU FONGANG AURELIE GRACIANE (Frontend)

**Université de Yaoundé I - Master 1 Sécurité Des Systèmes Informatiques**
