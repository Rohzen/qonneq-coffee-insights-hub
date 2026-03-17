@echo off
echo Starting Qonneq Portal Local Environment...

:: Start the API Server in a new window
start "Qonneq API Server" cmd /c "npm run dev:api"

:: Start the Vite Dev Server in a new window
echo Starting Vite Dev Server...
start "Qonneq Frontend" cmd /c "npm run dev"

echo.
echo ======================================================
echo Qonneq Portal is launching!
echo API Server: http://localhost:3001
echo Frontend:   http://localhost:5173
echo ======================================================
echo.
pause
