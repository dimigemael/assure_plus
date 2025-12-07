README.md
🛡️ ASSURANCE BLOCKCHAIN API - Backend Laravel 11 / JWT / IPFS

Bienvenue à l'équipe ! Ce projet contient l'API RESTful développée avec Laravel pour gérer les fonctionnalités clés de notre application d'assurance, notamment la gestion sécurisée des Sinistres avec preuve décentralisée (IPFS).

Félicitations pour le projet ! Les tests sont finaux et tout est fonctionnel et stable.

1. Technologies & Prérequis Techniques

Pour démarrer et tester l'API, les éléments suivants doivent être installés et configurés (environnement de développement testé sur Kali Linux).

Composant	Exigence	But dans le Projet
PHP & Framework	PHP 8.x / Laravel 11	Langage backend principal.
Base de Données	MySQL / MariaDB (via XAMPP)	Stockage sécurisé des utilisateurs, contrats, et métadonnées de sinistres.
Contrôleur SGBD	\texttt{php-mysql} driver	Essentiel pour que PHP puisse se connecter à la base de données.
Outils Système	\texttt{git}, \texttt{composer}	Gestion du code source et des dépendances PHP.
Testing/Client	Postman ou Thunder Client	Envoi des requêtes API (\texttt{POST}, \texttt{GET}, \texttt{PATCH}, etc.).
Blockchain/Preuve	Kubo (Démon IPFS)	Décentralisation de l'upload du fichier preuve de sinistre (\texttt{proof_file}).
2. Guide d'Installation et Configuration de l'Environnement

Suivez ces étapes dans l'ordre pour configurer l'environnement pour la première fois :

Étape 2.1 : Configuration Système et Dépendances

Installer le Driver MySQL/PHP (Correction du bug "Driver not found") :

code
Bash
download
content_copy
expand_less
sudo apt update
sudo apt install php-mysql

Cloner le Projet et Installer les Dépendances Composer :

code
Bash
download
content_copy
expand_less
git clone https://github.com/DianeIris/assurance-blockchain.git
cd assurance-blockchain
composer install

Cloner la Configuration :

code
Bash
download
content_copy
expand_less
cp .env.example .env
Étape 2.2 : Configuration XAMPP/Base de Données

Modifiez le fichier \texttt{.env} pour la connexion locale à la base de données via XAMPP.

Clé	Valeur	Note
\texttt{DB_CONNECTION}	\texttt{mysql}	Doit rester \texttt{mysql}.
\texttt{DB_HOST}	\texttt{127.0.0.1}	IP standard pour le serveur local XAMPP.
\texttt{DB_PORT}	\texttt{3306}	Port standard de MySQL.
\texttt{DB_DATABASE}	\texttt{assurance_blockchain}	Nom de la base de données créée dans phpMyAdmin.
\texttt{DB_USERNAME}	\texttt{root}	Identifiant par défaut de XAMPP (doit être configuré).
\texttt{DB_PASSWORD}	(vide par défaut)	Laissez vide si XAMPP n'a pas de mot de passe root.
Étape 2.3 : Démarrage des Services et Initialisation de Laravel

Démarrer MySQL (XAMPP) et Laravel :

code
Bash
download
content_copy
expand_less
sudo /opt/lampp/lampp start mysql  # Démarrer la BDD
php artisan key:generate           # Générer la clé de l'application
php artisan serve                  # Lancer le serveur (URL de test : 127.0.0.1:8000)

Initialisation du Système d'Authentification (JWT) :

code
Bash
download
content_copy
expand_less
php artisan jwt:secret             # Générer la clé JWT
3. Configuration IPFS (Intégration Blockchain/Preuve)

L'intégration d'IPFS est CRUCIALE. L'API contacte un serveur IPFS pour chaque upload de fichier preuve.

Démarrer le Démon IPFS (Dans un autre Terminal, Gardez-le Ouvert) :

code
Bash
download
content_copy
expand_less
# Si le dépôt n'est pas initialisé (une seule fois):
# ipfs init 

# Démarrer le serveur (doit tourner pour que la route Claims fonctionne)
ipfs daemon
3.1. Construction et Seed (Mise à Jour Critique)

Cette commande est la seule requise pour initialiser la BDD avec le schéma final (incluant le fix de la colonne status en \texttt{ENUM} et la création des comptes de test).

code
Bash
download
content_copy
expand_less
# Détruit l'ancien schéma, recrée et remplit avec les données de test (seed)
php artisan migrate:fresh --seed
4. Guide des Tests API (Procédure Pas-à-Pas)

Toutes les routes sont testées ci-dessous en utilisant Postman. \textbf{Le TON\_TOKEN\_... doit être collé dans le Header : \texttt{Authorization: Bearer TON_TOKEN}}

Seq	Méthode	Route	Action/Body	Rôle	Succès Attendu
1.	\texttt{POST}	\texttt{/api/register}	Créer : nom, prenom, email:\texttt{client@test.com}, role:\texttt{assure}	\texttt{Client}	\texttt{201 Created}
2.	\texttt{POST}	\texttt{/api/login}	\texttt{email:client@test.com, password:password}	\texttt{Client}	\texttt{200 OK} et Récupération du TON_TOKEN_CLIENT.
3.	\texttt{POST}	\texttt{/api/contracts}	\texttt{Auth: Bearer Client}, \texttt{Body(JSON): type_assurance, montant, prime...}	\texttt{Client}	\texttt{201 Created}. Contrat créé.
4.	\texttt{POST}	\texttt{/api/claims}	\texttt{Auth: Client}, \texttt{Body(Form-Data): contract_id, description, proof_file}	\texttt{Client}	\texttt{201 Created} avec un \texttt{ipfs_hash} (Test de l'Intégration IPFS).
5.	\texttt{POST}	\texttt{/api/login}	\texttt{email:admin@test.com, password:password}	\texttt{Admin}	\texttt{200 OK} et Récupération du TON_TOKEN_ADMIN.
6.	\texttt{GET}	\texttt{/api/claims}	\texttt{Auth: Admin}, (Liste complète)	\texttt{Admin}	\texttt{200 OK} (Affiche TOUS les sinistres).
7.	\texttt{PATCH}	\texttt{/api/claims/1}	\texttt{Auth: Admin}, \texttt{Body(JSON): status: "approuvé", commentaire_expert}	\texttt{Admin}	\texttt{200 OK}. Statut passe de en_attente à approuvé (Test de l'Update et des Permissions !).
8.	\texttt{DELETE}	\texttt{/api/claims/1}	\texttt{Auth: Admin}	\texttt{Admin}	\texttt{200 OK} (Finalisation du cycle CRUD).
5. Architecture du Projet et Fonctionnalités Clés

Le projet respecte les spécifications par un développement rigoureux incluant la résolution de plusieurs problèmes critiques d'environnement et de logique :

Full CRUD sur les Sinistres : Les routes (\texttt{store}, \texttt{index}, \texttt{show}, \texttt{update}, \texttt{destroy}) sont opérationnelles, y compris la lecture filtrée et la suppression par rôle.

Sécurité RBAC (Rôles) : Les Contrôleurs implémentent des règles de sécurité stricte : seuls les rôles \texttt{admin} et \texttt{expert} ont les permissions d'écrire ou d'approuver un sinistre.

Résolution Critique (BDD) : La stabilité du système a été garantie par le passage du statut de la colonne Sinistre au type de données \textbf{ENUM} (\texttt{'en_attente', 'approuvé', ...}), réglant l'erreur persistante \texttt{Data truncated for column 'status'}.

6. Prochaines Étapes Essentielles

\textbf{Finalisation CRUD : Primes} - Développement du module de gestion des paiements (\texttt{premiums}).

\textbf{Qualité de Code :} Migration des règles de validation (actuellement dans les Contrôleurs) vers les \texttt{Form Requests} (dossier \texttt{app/Http/Requests}).

\textbf{Tests Automatiques :} Écriture des \texttt{Tests Unitaires/Feature} dans \texttt{tests/Feature/SinistreTest.php} (en utilisant \texttt{Http::fake()} pour le déport de l'intégration IPFS).