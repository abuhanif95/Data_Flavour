#!/bin/bash

# Data_Flavour Deployment Script for Ubuntu Server
# This script automates the deployment of the full-stack Yelp Text-to-SQL application

set -e  # Exit on any error

echo "╔════════════════════════════════════════════════════════╗"
echo "║        Data_Flavour Deployment (Ubuntu Linux)          ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# 1. Update system packages
echo "📦 Updating system packages..."
sudo apt update
sudo apt upgrade -y

# 2. Install Node.js 18+ (LTS)
echo "📥 Installing Node.js 18+ LTS..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installations
echo "✓ Node.js version: $(node --version)"
echo "✓ npm version: $(npm --version)"

# 3. Install PM2 for process management
echo "📥 Installing PM2 (process manager)..."
sudo npm install -g pm2

# 4. Clone or download the repository
echo "📂 Setting up project directory..."
DEPLOY_DIR="/opt/data-flavour"

if [ -d "$DEPLOY_DIR" ]; then
  echo "  Project directory already exists. Updating..."
  cd "$DEPLOY_DIR"
  git pull origin main || echo "⚠️  Could not pull from git (first deployment?)"
else
  echo "  Cloning repository..."
  sudo mkdir -p "$DEPLOY_DIR"
  sudo chown $USER:$USER "$DEPLOY_DIR"
  cd "$DEPLOY_DIR"
  # Clone from your GitHub repo
  git clone https://github.com/abuhanif95/Data_Flavour.git .
fi

# 5. Install backend dependencies
echo "📥 Installing backend dependencies..."
cd "$DEPLOY_DIR/backend"
npm install --production

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
  echo "  Creating .env configuration..."
  cat > .env << EOF
OPENAI_API_KEY=
DB_PATH=/opt/data-flavour/yelp.db
API_PORT=8000
NODE_ENV=production
EOF
  echo "  ⚠️  Configure .env with your OpenAI API key"
fi

# 6. Install frontend dependencies and build
echo "📥 Installing frontend dependencies..."
cd "$DEPLOY_DIR/frontend"
npm install

echo "🏗️  Building frontend for production..."
npm run build

# 7. Set up PM2 for backend service
echo "🚀 Setting up PM2 process management..."
cd "$DEPLOY_DIR/backend"
pm2 delete "data-flavour-api" || true  # Remove old process if exists
pm2 start src/server.js --name "data-flavour-api" --merge-logs
pm2 save

# Configure PM2 to start on system reboot
sudo env PATH=$PATH:$(which node) /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp /home/$USER

# 8. Set up Nginx reverse proxy
echo "🌐 Setting up Nginx reverse proxy..."
sudo apt install -y nginx

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/data-flavour > /dev/null << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name _;

    # Frontend (React app built assets)
    location / {
        alias /opt/data-flavour/frontend/dist/;
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable the site and test Nginx config
sudo ln -sf /etc/nginx/sites-available/data-flavour /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║              ✅ Deployment Complete!                   ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "📍 Application is live at: http://$(hostname -I | awk '{print $1}')"
echo ""
echo "🔧 Manage Backend Process (PM2):"
echo "  • View logs:      pm2 logs data-flavour-api"
echo "  • Restart:        pm2 restart data-flavour-api"
echo "  • Stop:           pm2 stop data-flavour-api"
echo "  • Status:         pm2 status"
echo ""
echo "🔑 Configuration:"
echo "  • Backend config: /opt/data-flavour/backend/.env"
echo "  • Web root:       /opt/data-flavour/frontend/dist"
echo "  • Reverse proxy:  /etc/nginx/sites-available/data-flavour"
echo ""
echo "📊 View Logs:"
echo "  • Backend logs:   tail -f /root/.pm2/logs/data-flavour-api-error.log"
echo "  • Nginx logs:     sudo tail -f /var/log/nginx/error.log"
echo ""
echo "🚀 Next Steps:"
echo "  1. Add your OpenAI API key to: /opt/data-flavour/backend/.env"
echo "  2. Load Yelp data into: /opt/data-flavour/yelp.db (SQLite)"
echo "  3. Monitor logs for errors"
echo "  4. Test at http://$(hostname -I | awk '{print $1}')"
echo ""
