# ⚡ Guide de Démarrage Rapide

Ce guide vous permet de lancer le projet en **moins de 5 minutes** avec Docker.

## 🚀 Démarrage en 3 Étapes

### 1️⃣ Prérequis

Assurez-vous que **Docker Desktop** est installé et en cours d'exécution :

- **Windows/Mac** : [Télécharger Docker Desktop](https://www.docker.com/products/docker-desktop)
- **Linux** : [Installer Docker Engine](https://docs.docker.com/engine/install/)

Vérifiez l'installation :
```bash
docker --version
docker-compose --version
```

### 2️⃣ Cloner et Configurer

```bash
# Cloner le projet
git clone https://github.com/votre-repo/assurance-blockchain.git
cd assurance-blockchain

# La configuration est déjà prête !
# Aucune modification nécessaire pour un démarrage local
```

### 3️⃣ Lancer l'Environnement

#### 🪟 Sur Windows :
Double-cliquez sur `scripts/start.bat` ou exécutez :
```batch
scripts\start.bat
```

#### 🐧 Sur Linux/Mac :
```bash
chmod +x scripts/start.sh
./scripts/start.sh
```

**Attendez 30-60 secondes** que tous les services démarrent...

---

## ✅ Vérification

### 1. Vérifier que tous les services sont actifs

```bash
docker-compose ps
```

Tous les services doivent afficher `Up` ou `healthy`.

### 2. Tester l'API Backend

Ouvrez votre navigateur : http://localhost:8000

Vous devriez voir la page d'accueil Laravel.

### 3. Tester l'API avec une requête

#### Connexion avec un compte de test

```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"client@test.com","password":"password"}'
```

Vous recevrez un token JWT dans la réponse.

### 4. Vérifier Ganache (Blockchain)

```bash
curl http://localhost:7545
```

Devrait retourner une réponse JSON du nœud Ethereum.

### 5. Vérifier IPFS

```bash
curl http://localhost:5001/api/v0/id
```

Devrait retourner les informations du nœud IPFS.

---

## 🎯 Tester avec Postman

### 1. Importer la Collection

Créez une collection Postman avec ces requêtes :

#### A. Connexion (Login)
```http
POST http://localhost:8000/api/login
Content-Type: application/json

{
  "email": "client@test.com",
  "password": "password"
}
```

**Réponse :** Copiez le `access_token`

#### B. Récupérer ses infos
```http
GET http://localhost:8000/api/user
Authorization: Bearer VOTRE_TOKEN_ICI
```

#### C. Créer un contrat
```http
POST http://localhost:8000/api/contracts
Authorization: Bearer VOTRE_TOKEN_ICI
Content-Type: application/json

{
  "type_assurance": "Automobile",
  "montant_couverture": 50000,
  "prime": 500,
  "date_debut": "2025-01-01",
  "date_fin": "2026-01-01"
}
```

#### D. Déclarer un sinistre
```http
POST http://localhost:8000/api/claims
Authorization: Bearer VOTRE_TOKEN_ICI
Content-Type: multipart/form-data

contract_id: 1
description: Accident de voiture
montant_reclame: 10000
proof_file: [SÉLECTIONNER UN FICHIER IMAGE]
```

---

## 🧪 Tester les Smart Contracts

```bash
# Entrer dans le conteneur Truffle
docker-compose exec truffle sh

# Compiler les contrats
npx truffle compile

# Exécuter les tests
npx truffle test

# Ouvrir la console interactive
npx truffle console --network development
```

Dans la console Truffle :
```javascript
// Récupérer l'instance du contrat
let instance = await InsuranceContract.deployed()

// Récupérer les comptes Ganache
let accounts = await web3.eth.getAccounts()

// Créer une police (10 ETH couverture, 0.1 ETH prime, 1 an)
let tx = await instance.createPolicy(
  web3.utils.toWei('10', 'ether'),
  web3.utils.toWei('0.1', 'ether'),
  31536000,
  {from: accounts[0], value: web3.utils.toWei('0.1', 'ether')}
)

// Voir l'événement émis
tx.logs[0]

// Récupérer les détails de la police
let policy = await instance.getPolicy(1)
console.log(policy)
```

---

## 📊 Voir les Logs

### Tous les services
```bash
docker-compose logs -f
```

### Service spécifique
```bash
docker-compose logs -f backend
docker-compose logs -f ganache
docker-compose logs -f ipfs
docker-compose logs -f truffle
```

---

## 🛑 Arrêter l'Environnement

#### Windows :
```batch
scripts\stop.bat
```

#### Linux/Mac :
```bash
./scripts/stop.sh
```

---

## 🔄 Redémarrer

```bash
# Arrêter
docker-compose down

# Redémarrer
docker-compose up -d
```

---

## 🧹 Réinitialiser Complètement

⚠️ **ATTENTION** : Cela supprimera TOUTES les données (BDD, blockchain, etc.)

#### Windows :
```batch
docker-compose down -v
scripts\start.bat
```

#### Linux/Mac :
```bash
docker-compose down -v
./scripts/start.sh
```

---

## 🐛 Problèmes Courants

### Problème : Port déjà utilisé

**Solution :** Modifier les ports dans `docker-compose.yml`

```yaml
ports:
  - "8001:8000"  # Au lieu de 8000:8000
```

### Problème : Docker n'est pas en cours d'exécution

**Solution :** Démarrer Docker Desktop

### Problème : Erreur de permissions (Linux)

**Solution :**
```bash
sudo chmod -R 777 backend/storage
sudo chmod -R 777 backend/bootstrap/cache
```

### Problème : Les services ne démarrent pas

**Solution :** Vérifier les logs
```bash
docker-compose logs backend
docker-compose logs mysql
```

### Problème : Migrations échouent

**Solution :** Réinitialiser la BDD
```bash
docker-compose exec backend php artisan migrate:fresh --seed
```

---

## 📱 Comptes de Test

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| `client@test.com` | `password` | Assuré |
| `expert@test.com` | `password` | Expert |
| `admin@test.com` | `password` | Administrateur |

---

## 🎓 Prochaines Étapes

1. ✅ Tester toutes les routes API (voir [README.md](README.md))
2. ✅ Expérimenter avec les Smart Contracts (voir [blockchain/README.md](blockchain/README.md))
3. ✅ Consulter le cahier des charges pour comprendre les fonctionnalités
4. ✅ Développer le frontend React.js

---

## 🆘 Besoin d'Aide ?

- **Documentation complète** : [README.md](README.md)
- **Documentation Blockchain** : [blockchain/README.md](blockchain/README.md)
- **Backend** : Voir [backend/README.md](backend/README.md)

---

**Prêt à développer !** 🚀
