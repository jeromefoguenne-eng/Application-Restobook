@echo off
chcp 65001 > nul
title Restobook - Duo Salle & Cuisine
echo ========================================================================
echo                  RESTOBOOK - DUO SALLE & CUISINE
echo         Application Connectee pour Tablettes & Smartphones
echo ========================================================================
echo.
echo [1/2] Lancement du Serveur de Synchronisation Temps Reel & Web App...
echo.
echo  - Port local : 4001
echo  - Adresse Web pour Tablettes & Smartphones sur le meme Wi-Fi :
echo    http://localhost:4001
echo.
start "" "http://localhost:4001"
node apps/server/server.js
pause
