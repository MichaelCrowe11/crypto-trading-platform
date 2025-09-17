@echo off
echo ========================================
echo CryptoCrowe Production Deployment
echo ========================================
echo.

cd /d C:\Users\micha\crypto-trading-platform

echo Checking for Fly CLI...
where fly >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Fly CLI not found. Please install it first.
    echo Download from: https://fly.io/docs/hands-on/install-flyctl/
    pause
    exit /b 1
)

echo [OK] Fly CLI found
echo.

echo Pushing to GitHub...
git push origin main
if %errorlevel% neq 0 (
    echo.
    echo [WARNING] Git push failed. You may need to authenticate.
    echo Try using GitHub Desktop or set up a Personal Access Token.
    echo.
    choice /C YN /M "Continue with deployment anyway?"
    if errorlevel 2 exit /b 1
)

echo.
echo Deploying to Fly.io...
fly deploy --ha=false

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo DEPLOYMENT SUCCESSFUL!
    echo ========================================
    echo.
    echo Your app is live at: https://crowe-crypto.fly.dev
    echo.
    echo Useful commands:
    echo   fly logs        - View logs
    echo   fly status      - Check status
    echo   fly ssh console - SSH into container
    echo.
) else (
    echo.
    echo [ERROR] Deployment failed!
    echo Check the error messages above.
)

pause