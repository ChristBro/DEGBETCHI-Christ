@echo off
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo Node.js est requis pour demarrer le back-office.
  pause
  exit /b 1
)
if not defined NEOTISSE_PORT set "NEOTISSE_PORT=4181"
echo Ouvrez http://127.0.0.1:%NEOTISSE_PORT%/ dans votre navigateur.
echo Gardez cette fenetre ouverte pendant l'utilisation.
node admin/server.mjs
pause
