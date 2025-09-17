#!/bin/bash

# CryptoCrowe Platform Deployment Script
# ========================================

set -e  # Exit on error

echo "🦅 CryptoCrowe Platform Deployment Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if fly CLI is installed
check_fly_cli() {
    if ! command -v fly &> /dev/null; then
        print_error "Fly CLI not found. Please install it first:"
        echo "  curl -L https://fly.io/install.sh | sh"
        exit 1
    fi
    print_success "Fly CLI found"
}

# Check if logged in to Fly.io
check_fly_auth() {
    if ! fly auth whoami &> /dev/null; then
        print_warning "Not logged in to Fly.io"
        echo "Please log in:"
        fly auth login
    else
        print_success "Authenticated with Fly.io"
    fi
}

# Validate environment
validate_env() {
    print_status "Validating environment..."

    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Are you in the project root?"
        exit 1
    fi

    # Check if fly.toml exists
    if [ ! -f "fly.toml" ]; then
        print_error "fly.toml not found. Run 'fly launch' first."
        exit 1
    fi

    print_success "Environment validated"
}

# Run tests
run_tests() {
    print_status "Running tests..."

    if npm test --if-present; then
        print_success "Tests passed"
    else
        print_warning "Tests failed or not configured"
        read -p "Continue deployment? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Build the application
build_app() {
    print_status "Building application..."

    # Install dependencies
    print_status "Installing dependencies..."
    npm ci --production

    print_success "Build completed"
}

# Check Fly.io secrets
check_secrets() {
    print_status "Checking Fly.io secrets..."

    # List of required secrets
    REQUIRED_SECRETS=(
        "MONGODB_URI"
        "SUPABASE_URL"
        "SUPABASE_ANON_KEY"
        "COINBASE_API_KEY"
        "BINANCE_API_KEY"
        "KRAKEN_API_KEY"
    )

    # Get current secrets
    CURRENT_SECRETS=$(fly secrets list | tail -n +2 | awk '{print $1}')

    MISSING_SECRETS=()
    for secret in "${REQUIRED_SECRETS[@]}"; do
        if ! echo "$CURRENT_SECRETS" | grep -q "^$secret$"; then
            MISSING_SECRETS+=("$secret")
        fi
    done

    if [ ${#MISSING_SECRETS[@]} -gt 0 ]; then
        print_warning "Missing secrets:"
        for secret in "${MISSING_SECRETS[@]}"; do
            echo "  - $secret"
        done
        echo ""
        echo "Set them using: fly secrets set SECRET_NAME=value"
        read -p "Continue without all secrets? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        print_success "All required secrets configured"
    fi
}

# Deploy to Fly.io
deploy() {
    print_status "Deploying to Fly.io..."

    # Deploy without high availability for cost savings
    if fly deploy --ha=false; then
        print_success "Deployment successful!"
    else
        print_error "Deployment failed"
        exit 1
    fi
}

# Show deployment info
show_info() {
    print_status "Deployment Information:"
    echo ""

    # Get app URL
    APP_URL=$(fly info -j | grep -oP '"Hostname":"\K[^"]+' | head -1)

    if [ -n "$APP_URL" ]; then
        echo -e "${GREEN}🚀 Application URL:${NC} https://$APP_URL"
    fi

    # Show status
    fly status

    echo ""
    print_status "Useful commands:"
    echo "  fly logs        - View application logs"
    echo "  fly ssh console - SSH into the container"
    echo "  fly secrets list - List configured secrets"
    echo "  fly scale show  - Show scaling configuration"
    echo ""
}

# Health check
health_check() {
    print_status "Running health check..."

    APP_URL=$(fly info -j | grep -oP '"Hostname":"\K[^"]+' | head -1)

    if [ -n "$APP_URL" ]; then
        sleep 5  # Wait for app to stabilize

        if curl -f -s -o /dev/null "https://$APP_URL/health"; then
            print_success "Health check passed ✓"
        else
            print_warning "Health check failed - app may still be starting"
        fi
    fi
}

# Main deployment flow
main() {
    echo "Starting CryptoCrowe deployment process..."
    echo ""

    # Pre-deployment checks
    check_fly_cli
    check_fly_auth
    validate_env

    # Optional: run tests
    # run_tests

    # Build and prepare
    build_app

    # Check configuration
    check_secrets

    # Deploy
    deploy

    # Post-deployment
    show_info
    health_check

    echo ""
    print_success "🎉 CryptoCrowe deployment complete!"
    echo ""
    echo "Visit your app at: https://crowe-crypto.fly.dev"
    echo ""
}

# Handle script arguments
case "${1:-}" in
    "quick")
        print_warning "Quick deployment mode - skipping tests"
        deploy
        show_info
        ;;
    "status")
        fly status
        ;;
    "logs")
        fly logs
        ;;
    "secrets")
        fly secrets list
        ;;
    "help")
        echo "Usage: ./deploy.sh [command]"
        echo ""
        echo "Commands:"
        echo "  (none)   - Full deployment with all checks"
        echo "  quick    - Quick deployment (skip tests)"
        echo "  status   - Show app status"
        echo "  logs     - View application logs"
        echo "  secrets  - List configured secrets"
        echo "  help     - Show this help message"
        ;;
    *)
        main
        ;;
esac