@echo off
REM ========================================
REM Script d'arrêt pour Windows
REM ========================================

echo.
echo ========================================
echo   Assurance Blockchain - Arret
echo ========================================
echo.

echo [INFO] Arret des services Docker...
docker-compose down

echo.
echo ========================================
echo   Tous les services ont ete arretes.
echo ========================================
echo.
echo Pour supprimer egalement les volumes (donnees) :
echo   docker-compose down -v
echo.
pause
