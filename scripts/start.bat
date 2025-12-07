@echo off
REM ========================================
REM Script de démarrage pour Windows
REM ========================================

echo.
echo ========================================
echo   Assurance Blockchain - Demarrage
echo ========================================
echo.

REM Vérifier que Docker est en cours d'exécution
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Docker n'est pas en cours d'execution.
    echo Veuillez demarrer Docker Desktop.
    pause
    exit /b 1
)

REM Copier .env.docker vers backend/.env si nécessaire
if not exist "backend\.env" (
    echo [INFO] Creation du fichier .env pour le backend...
    copy ".env.docker" "backend\.env"
)

echo [INFO] Construction des images Docker...
docker-compose build

echo.
echo [INFO] Demarrage des services...
docker-compose up -d

echo.
echo [INFO] Attente du demarrage des services (30 secondes)...
timeout /t 30 /nobreak >nul

echo.
echo [INFO] Etat des services :
docker-compose ps

echo.
echo ========================================
echo   Environnement demarre avec succes !
echo ========================================
echo.
echo Acces aux services :
echo   - Backend Laravel API : http://localhost:8000
echo   - Ganache (Blockchain): http://localhost:7545
echo   - IPFS API           : http://localhost:5001
echo   - IPFS Gateway       : http://localhost:8080
echo   - MySQL              : localhost:3306
echo.
echo Pour voir les logs :
echo   docker-compose logs -f [nom_service]
echo.
echo Pour arreter :
echo   scripts\stop.bat
echo.
pause
