# 🛡️ Système de Gestion des Assurances Décentralisé - Blockchain

[![Laravel](https://img.shields.io/badge/Laravel-11.x-red)](https://laravel.com)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.19-blue)](https://soliditylang.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://www.docker.com)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

> Projet de Master 1 - Sécurité Des Systèmes Informatiques
> Université de Yaoundé I - Faculté des Sciences - Département d'Informatique

## 👥 Équipe de Développement

| Nom | Matricule | Responsabilité |
|-----|-----------|----------------|
| **TAHUE TCHOUTCHOUA GEMAEL DIMITRI** | 25G2032 | Blockchain & Intégration Backend |
| **FOTSING KENGNE DIANE IRIS** | 17T2631 | Backend Laravel API |
| **MAHACHU FONGANG AURELIE GRACIANE** | 22T2924 | Frontend React.js |

---

## 📋 Table des Matières

- [Description du Projet](#-description-du-projet)
- [Architecture](#-architecture)
- [Technologies Utilisées](#-technologies-utilisées)
- [Prérequis](#-prérequis)
- [Installation avec Docker](#-installation-avec-docker)
- [Utilisation](#-utilisation)
- [Structure du Projet](#-structure-du-projet)
- [API Endpoints](#-api-endpoints)
- [Smart Contracts](#-smart-contracts)
- [Tests](#-tests)
- [Contribuer](#-contribuer)

---

## 📖 Description du Projet

Ce projet vise à **décentraliser et automatiser la gestion des assurances** en utilisant la technologie **Blockchain Ethereum**. Il résout les problèmes de :

- ❌ **Manque de transparence** dans les processus d'indemnisation
- ❌ **Fraude à l'assurance** via la falsification de documents
- ❌ **Délais de traitement** longs et processus manuels
- ❌ **Centralisation** des données exposant le système à des risques

### ✅ Solutions Apportées

- ✅ **Smart Contracts** pour l'automatisation des indemnisations
- ✅ **IPFS** pour le stockage décentralisé et immuable des preuves
- ✅ **Blockchain** pour la traçabilité complète et la transparence
- ✅ **API REST** pour l'intégration avec les systèmes existants

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   COUCHE FRONTEND                       │
│  ┌──────────────┐         ┌──────────────┐            │
│  │  React.js    │ <-----> │   Web3.js    │            │
│  └──────────────┘         └──────────────┘            │
│         │                        │                      │
│         │                 ┌──────▼───────┐             │
│         │                 │   MetaMask   │             │
│         │                 └──────────────┘             │
└─────────┼────────────────────────┼────────────────────┘
          │                        │
          ▼                        ▼
┌─────────────────────┐   ┌──────────────────────────┐
│   BACKEND (API)     │   │   BLOCKCHAIN LAYER       │
│  ┌───────────────┐  │   │  ┌──────────────────┐   │
│  │  Laravel API  │◄─┼───┼─►│ Ganache/Ethereum │   │
│  └───────┬───────┘  │   │  └────────┬─────────┘   │
│          │          │   │           │              │
│          ▼          │   │           ▼              │
│  ┌───────────────┐  │   │  ┌──────────────────┐   │
│  │    MySQL      │  │   │  │ Smart Contracts  │   │
│  │  (Off-chain)  │  │   │  │   (Solidity)     │   │
│  └───────────────┘  │   │  └──────────────────┘   │
└─────────────────────┘   └──────────────────────────┘
          │
          ▼
┌──────────────────────────┐
│   IPFS (Stockage)        │
│   Documents & Preuves    │
└──────────────────────────┘
```

---

## 🛠️ Technologies Utilisées

### Backend
- **Laravel 11** - Framework PHP moderne
- **MySQL 8.0** - Base de données relationnelle
- **JWT** - Authentification sécurisée
- **IPFS** - Stockage décentralisé

### Blockchain
- **Solidity 0.8.19** - Langage des Smart Contracts
- **Truffle 5.11** - Framework de développement
- **Ganache** - Blockchain Ethereum locale
- **Web3.js** - Bibliothèque d'interaction Ethereum

### Frontend (à venir)
- **React.js** - Interface utilisateur
- **Ethers.js** - Alternative à Web3.js
- **MetaMask** - Wallet crypto

### DevOps
- **Docker & Docker Compose** - Conteneurisation
- **Git & GitHub** - Versioning

---

## 📦 Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Docker Desktop** (Windows/Mac) ou **Docker Engine** (Linux)
  - [Télécharger Docker](https://docs.docker.com/get-docker/)
- **Docker Compose** (généralement inclus avec Docker Desktop)
- **Git** pour cloner le projet
- **Au moins 4 GB de RAM** disponible pour Docker

---

## 🚀 Installation avec Docker

### 1️⃣ Cloner le Projet

```bash
git clone https://github.com/votre-repo/assurance-blockchain.git
cd assurance-blockchain
```

### 2️⃣ Configuration

Les fichiers de configuration sont déjà prêts ! Docker s'occupera de tout.

### 3️⃣ Démarrer l'Environnement

#### Sur Windows :
```batch
scripts\start.bat
```

#### Sur Linux/Mac :
```bash
chmod +x scripts/start.sh
./scripts/start.sh
```

**C'est tout !** 🎉 Docker va :
- ✅ Construire toutes les images
- ✅ Démarrer MySQL, Ganache, IPFS, Laravel
- ✅ Créer la base de données et exécuter les migrations
- ✅ Compiler et déployer les Smart Contracts
- ✅ Insérer les données de test (seed)

### 4️⃣ Vérifier que Tout Fonctionne

Attendez environ 30-60 secondes, puis testez :

```bash
# Vérifier l'état des services
docker-compose ps

# Tous les services doivent être "Up" et "healthy"
```

---

## 🎯 Utilisation

### Accès aux Services

Une fois démarré, vous pouvez accéder à :

| Service | URL | Description |
|---------|-----|-------------|
| **Backend API** | http://localhost:8000 | API REST Laravel |
| **Ganache** | http://localhost:7545 | Blockchain Ethereum locale |
| **IPFS API** | http://localhost:5001 | API IPFS |
| **IPFS Gateway** | http://localhost:8080 | Gateway IPFS |
| **MySQL** | localhost:3306 | Base de données |

### Comptes de Test

Le système crée automatiquement ces comptes :

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| `client@test.com` | `password` | Assuré |
| `expert@test.com` | `password` | Expert |
| `admin@test.com` | `password` | Administrateur |

### Tester l'API avec Postman/Thunder Client

#### 1. Connexion
```http
POST http://localhost:8000/api/login
Content-Type: application/json

{
  "email": "client@test.com",
  "password": "password"
}
```

Réponse : Vous recevrez un `access_token` JWT

#### 2. Créer un Contrat
```http
POST http://localhost:8000/api/contracts
Authorization: Bearer VOTRE_TOKEN
Content-Type: application/json

{
  "type_assurance": "Automobile",
  "montant_couverture": 50000,
  "prime": 500,
  "date_debut": "2025-01-01",
  "date_fin": "2026-01-01"
}
```

#### 3. Déclarer un Sinistre
```http
POST http://localhost:8000/api/claims
Authorization: Bearer VOTRE_TOKEN
Content-Type: multipart/form-data

contract_id: 1
description: "Accident de voiture"
montant_reclame: 10000
proof_file: [FICHIER_IMAGE]
```

### Commandes Docker Utiles

```bash
# Voir les logs d'un service
docker-compose logs -f backend
docker-compose logs -f ganache

# Arrêter tous les services
scripts\stop.bat  # Windows
./scripts/stop.sh # Linux/Mac

# Redémarrer un service spécifique
docker-compose restart backend

# Réinitialiser complètement (ATTENTION: supprime toutes les données)
scripts\reset.bat  # Windows
./scripts/reset.sh # Linux/Mac

# Exécuter une commande dans un conteneur
docker-compose exec backend php artisan migrate
docker-compose exec truffle npx truffle test
```

---

## 📁 Structure du Projet

```
assure_plus/
├── backend/                    # API Laravel
│   ├── app/
│   │   ├── Http/Controllers/  # Contrôleurs
│   │   ├── Models/            # Modèles Eloquent
│   │   └── Services/          # Services (Web3, IPFS)
│   ├── database/
│   │   ├── migrations/        # Migrations BDD
│   │   └── seeders/           # Données de test
│   ├── routes/api.php         # Routes API
│   └── Dockerfile
│
├── blockchain/                 # Smart Contracts
│   ├── contracts/
│   │   └── InsuranceContract.sol
│   ├── migrations/            # Migrations Truffle
│   ├── test/                  # Tests des contrats
│   ├── truffle-config.js      # Config Truffle
│   └── Dockerfile
│
├── frontend/                   # React.js (à venir)
│
├── scripts/                    # Scripts d'automatisation
│   ├── start.bat/sh           # Démarrage
│   ├── stop.bat/sh            # Arrêt
│   └── reset.bat/sh           # Réinitialisation
│
├── docker-compose.yml          # Orchestration Docker
├── .env.docker                 # Variables d'environnement
└── README.md                   # Ce fichier
```

---

## 🔗 API Endpoints

### Authentication

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/register` | Créer un compte |
| POST | `/api/login` | Se connecter |
| POST | `/api/logout` | Se déconnecter |
| GET | `/api/user` | Infos utilisateur |

### Contrats

| Méthode | Endpoint | Description | Rôle |
|---------|----------|-------------|------|
| GET | `/api/contracts` | Liste des contrats | Tous |
| POST | `/api/contracts` | Créer un contrat | Assuré |

### Sinistres (Claims)

| Méthode | Endpoint | Description | Rôle |
|---------|----------|-------------|------|
| GET | `/api/claims` | Liste des sinistres | Tous |
| GET | `/api/claims/{id}` | Détails d'un sinistre | Tous |
| POST | `/api/claims` | Déclarer un sinistre | Assuré |
| PATCH | `/api/claims/{id}` | Valider/Rejeter | Expert/Admin |
| DELETE | `/api/claims/{id}` | Supprimer | Admin |

---

## 📜 Smart Contracts

### InsuranceContract.sol

Le contrat principal gère :

#### Fonctions Principales

- `createPolicy()` - Créer une nouvelle police d'assurance
- `payPremium()` - Payer une prime mensuelle
- `declareClaim()` - Déclarer un sinistre
- `validateClaim()` - Valider/rejeter un sinistre (Expert)
- `_payIndemnity()` - Payer automatiquement l'indemnisation

#### Événements

- `PolicyCreated` - Police créée
- `PremiumPaid` - Prime payée
- `ClaimDeclared` - Sinistre déclaré
- `ClaimValidated` - Sinistre validé
- `IndemnityPaid` - Indemnisation payée

### Déployer les Contrats

```bash
# Entrer dans le conteneur Truffle
docker-compose exec truffle sh

# Compiler
npx truffle compile

# Migrer (déployer)
npx truffle migrate --network development

# Tester
npx truffle test
```

---

## 🧪 Tests

### Tests Backend (Laravel)

```bash
docker-compose exec backend php artisan test
```

### Tests Smart Contracts (Truffle)

```bash
docker-compose exec truffle npx truffle test
```

---

## 🤝 Contribuer

### Workflow Git

```bash
# Créer une branche pour votre fonctionnalité
git checkout -b feature/nom-de-la-feature

# Faire vos modifications
git add .
git commit -m "Description des changements"

# Pousser vers GitHub
git push origin feature/nom-de-la-feature

# Créer une Pull Request sur GitHub
```

### Règles de Commit

- ✅ `feat:` Nouvelle fonctionnalité
- ✅ `fix:` Correction de bug
- ✅ `docs:` Documentation
- ✅ `test:` Ajout de tests
- ✅ `refactor:` Refactorisation de code

---

## 📚 Documentation Complémentaire

- [Cahier des Charges (PDF)](docs/CAHIER_DE_CHARGES_SECURITE_INFORMATIQUE.pdf)
- [Documentation Laravel](https://laravel.com/docs)
- [Documentation Solidity](https://docs.soliditylang.org)
- [Documentation Truffle](https://trufflesuite.com/docs)
- [Documentation IPFS](https://docs.ipfs.tech)

---

## 📞 Support

Pour toute question ou problème :

1. Vérifiez que Docker est bien démarré
2. Consultez les logs : `docker-compose logs -f`
3. Contactez l'équipe de développement

---

## 📝 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

## 🎓 Contexte Académique

**Projet réalisé dans le cadre du Master 1 - Sécurité Des Systèmes Informatiques**

- **Université** : Université de Yaoundé I
- **Faculté** : Faculté des Sciences
- **Département** : Informatique
- **Date** : Novembre 2025

---

**Fait avec ❤️ par l'équipe Assurance Blockchain**
