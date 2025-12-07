# Makefile pour automatiser l'installation du projet Laravel

# La commande par défaut si on tape juste "make"
all: install serve

# Étape 1 : Installation complète (Dépendances + .env + Key)
install:
	@echo "🚀 Installation des dépendances (Composer)..."
	composer install
	@echo "📄 Copie du fichier de configuration (.env)..."
	cp .env.example .env
	@echo "🔑 Génération de la clé de sécurité..."
	php artisan key:generate
	@echo "✅ Installation terminée ! Tu peux lancer le serveur."

# Étape 2 : Lancer le serveur uniquement
serve:
	@echo "🌐 Démarrage du serveur Laravel..."
	php artisan serve

# Une commande pour nettoyer (si besoin de recommencer)
clean:
	rm -rf vendor
	rm .env
	@echo "🗑️ Projet nettoyé (vendor et .env supprimés)."
plus infos sur le fichier readme
