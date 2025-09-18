#!/bin/bash

# GitHub Authentication Setup Script
# This script helps you configure Git and authenticate with GitHub

echo "🔐 GitHub Authentication Setup"
echo "=============================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Configure Git user
echo -e "${YELLOW}Step 1: Configure Git User${NC}"
echo "Enter your GitHub username:"
read -p "Username: " github_username
echo "Enter your GitHub email:"
read -p "Email: " github_email

git config --global user.name "$github_username"
git config --global user.email "$github_email"

echo -e "${GREEN}✓ Git user configured${NC}"
echo ""

# Step 2: Choose authentication method
echo -e "${YELLOW}Step 2: Choose Authentication Method${NC}"
echo "Select your preferred authentication method:"
echo "1) Personal Access Token (Recommended)"
echo "2) SSH Key"
echo "3) GitHub CLI (gh)"
read -p "Enter choice (1-3): " auth_choice

case $auth_choice in
    1)
        echo -e "\n${BLUE}Setting up Personal Access Token...${NC}"
        echo ""
        echo "To create a Personal Access Token:"
        echo "1. Go to: https://github.com/settings/tokens/new"
        echo "2. Give your token a descriptive name"
        echo "3. Set expiration (90 days recommended)"
        echo "4. Select scopes:"
        echo "   ✓ repo (Full control of private repositories)"
        echo "   ✓ workflow (Update GitHub Action workflows)"
        echo "5. Click 'Generate token'"
        echo "6. COPY THE TOKEN NOW (you won't see it again!)"
        echo ""
        read -p "Paste your Personal Access Token here: " -s github_token
        echo ""

        # Store credentials
        echo -e "\n${YELLOW}Configuring credential storage...${NC}"
        git config --global credential.helper store

        # Set up the remote with token
        echo -e "${YELLOW}Updating remote URL with authentication...${NC}"
        git remote set-url origin https://$github_username:$github_token@github.com/MichaelCrowe11/crypto-trading-platform.git

        echo -e "${GREEN}✓ Personal Access Token configured${NC}"
        echo ""
        echo "Now you can push with: git push origin main"
        ;;

    2)
        echo -e "\n${BLUE}Setting up SSH Key...${NC}"
        echo ""

        # Check for existing SSH key
        if [ -f ~/.ssh/id_ed25519 ]; then
            echo "Found existing SSH key"
            read -p "Use existing SSH key? (y/n): " use_existing
            if [[ ! $use_existing =~ ^[Yy]$ ]]; then
                ssh-keygen -t ed25519 -C "$github_email"
            fi
        else
            echo "Generating new SSH key..."
            ssh-keygen -t ed25519 -C "$github_email"
        fi

        # Start ssh-agent
        eval "$(ssh-agent -s)"
        ssh-add ~/.ssh/id_ed25519

        # Display public key
        echo ""
        echo -e "${YELLOW}Copy this SSH public key:${NC}"
        echo "=============================="
        cat ~/.ssh/id_ed25519.pub
        echo "=============================="
        echo ""
        echo "Add this key to GitHub:"
        echo "1. Go to: https://github.com/settings/keys"
        echo "2. Click 'New SSH key'"
        echo "3. Paste the key above"
        echo "4. Click 'Add SSH key'"
        echo ""
        read -p "Press Enter after adding the key to GitHub..."

        # Update remote to use SSH
        git remote set-url origin git@github.com:MichaelCrowe11/crypto-trading-platform.git

        # Test connection
        echo -e "\n${YELLOW}Testing SSH connection...${NC}"
        ssh -T git@github.com

        echo -e "${GREEN}✓ SSH key configured${NC}"
        echo ""
        echo "Now you can push with: git push origin main"
        ;;

    3)
        echo -e "\n${BLUE}Installing GitHub CLI...${NC}"

        # Install GitHub CLI
        curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
        sudo apt update
        sudo apt install gh -y

        echo -e "${YELLOW}Authenticating with GitHub CLI...${NC}"
        gh auth login

        echo -e "${GREEN}✓ GitHub CLI configured${NC}"
        echo ""
        echo "Now you can push with: git push origin main"
        ;;

    *)
        echo -e "${RED}Invalid choice. Please run the script again.${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}=============================="
echo "✓ GitHub Authentication Setup Complete!"
echo "==============================${NC}"
echo ""
echo "To push your changes, run:"
echo -e "${YELLOW}git push origin main${NC}"
echo ""
echo "Your commit includes:"
echo "• Railway deployment configuration"
echo "• Database initialization scripts"
echo "• Automated deployment tools"
echo "• Comprehensive documentation"