# Deployment Guide - Ubuntu Server

This guide walks you through deploying Data_Flavour to your Ubuntu server at `192.168.56.105`.

## Prerequisites

- Ubuntu 20.04+ with SSH access
- Sudo privileges (user: `hanif`)
- Internet connectivity on the server
- 2GB+ free disk space

## Quick Start

### Step 1: SSH into Your Ubuntu Server

Open PowerShell and use SSH to connect:

```powershell
ssh hanif@192.168.56.105
```

When prompted, enter the password: `1234`

### Step 2: Clone the Repository

Once connected to the server via SSH:

```bash
cd ~
git clone https://github.com/abuhanif95/Data_Flavour.git
cd Data_Flavour
```

### Step 3: Run Automated Deployment

Make the deployment script executable and run it:

```bash
chmod +x deploy.sh
./deploy.sh
```

The script will automatically:
- ✅ Update system packages
- ✅ Install Node.js 18 LTS
- ✅ Install PM2 (process manager)
- ✅ Install backend & frontend dependencies
- ✅ Build the React frontend
- ✅ Configure Nginx reverse proxy
- ✅ Start the backend API with PM2
- ✅ Set up auto-startup on server reboot

### Step 4: Configure Environment

After deployment, edit the backend configuration:

```bash
nano /opt/data-flavour/backend/.env
```

Add your OpenAI API key (optional, but recommended for AI SQL generation):

```
OPENAI_API_KEY=sk-your-actual-key-here
DB_PATH=/opt/data-flavour/yelp.db
API_PORT=8000
NODE_ENV=production
```

Save with `Ctrl+X`, then `Y`, then `Enter`.

### Step 5: Verify Deployment

Check the status of your backend:

```bash
pm2 status
```

You should see `data-flavour-api` running. Access the application:

```
http://192.168.56.105
```

Or if you set up a domain, use that instead.

---

## Managing the Application

### View Backend Logs

```bash
pm2 logs data-flavour-api
```

### Restart Backend

```bash
pm2 restart data-flavour-api
```

### Stop/Start Backend

```bash
pm2 stop data-flavour-api
pm2 start data-flavour-api
```

### Check Nginx Status

```bash
sudo systemctl status nginx
sudo systemctl restart nginx
```

### View Nginx Errors

```bash
sudo tail -f /var/log/nginx/error.log
```

---

## Loading Yelp Data

The application requires Yelp data in SQLite format. To load data:

### Option 1: Using Python (Recommended)

```bash
# SSH into server
ssh hanif@192.168.56.105

# Create a Python script to import Yelp JSON files
cat > /opt/data-flavour/import_yelp.py << 'EOF'
import json
import sqlite3

db = sqlite3.connect('/opt/data-flavour/yelp.db')
c = db.cursor()

# Create tables
c.execute('''CREATE TABLE IF NOT EXISTS businesses
    (business_id TEXT PRIMARY KEY, name TEXT, city TEXT, state TEXT, 
     stars REAL, review_count INTEGER, is_open INTEGER, categories TEXT)''')

c.execute('''CREATE TABLE IF NOT EXISTS reviews
    (review_id TEXT PRIMARY KEY, user_id TEXT, business_id TEXT, 
     stars INTEGER, date TEXT, text TEXT, useful INTEGER)''')

c.execute('''CREATE TABLE IF NOT EXISTS users
    (user_id TEXT PRIMARY KEY, name TEXT, review_count INTEGER, 
     yelping_since TEXT, fans INTEGER, average_stars REAL)''')

# Load business.json
with open('yelp_academic_dataset_business.json', 'r') as f:
    for line in f:
        data = json.loads(line)
        c.execute('INSERT OR IGNORE INTO businesses VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            (data['business_id'], data['name'], data['city'], data['state'],
             data['stars'], data['review_count'], data['is_open'],
             ','.join(data.get('categories', []))))

# Load similar for reviews.json and user.json
db.commit()
db.close()
print("✓ Data imported successfully!")
EOF

python3 /opt/data-flavour/import_yelp.py
```

### Option 2: Manual SQL Insert

Use SQLite CLI directly:

```bash
sqlite3 /opt/data-flavour/yelp.db < path/to/import.sql
```

---

## SSL/HTTPS Setup (Optional)

To enable HTTPS with Let's Encrypt:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

Then Nginx will automatically redirect HTTP → HTTPS.

---

## Troubleshooting

### Application not accessible

1. Check if Nginx is running:
   ```bash
   sudo systemctl status nginx
   ```

2. Check if backend API is running:
   ```bash
   pm2 status
   ```

3. View error logs:
   ```bash
   sudo tail -f /var/log/nginx/error.log
   pm2 logs data-flavour-api
   ```

### Backend showing "WAITING FOR BACKEND"

Verify the backend is running and accessible:

```bash
curl http://localhost:8000/api/health
```

If it returns JSON with status "ok", the backend is working.

### Database errors

Ensure the SQLite database file exists and has proper permissions:

```bash
ls -la /opt/data-flavour/yelp.db
chmod 644 /opt/data-flavour/yelp.db
```

---

## Updating the Application

To pull the latest changes from GitHub:

```bash
cd /opt/data-flavour
git pull origin main
cd backend && npm install && cd ../frontend
npm install && npm run build
pm2 restart data-flavour-api
sudo systemctl restart nginx
```

---

## SSH Key Authentication (Recommended for Security)

Instead of password authentication, set up SSH keys:

```bash
# On your local machine (Windows PowerShell)
ssh-keygen -t rsa -b 4096 -f "$env:USERPROFILE\.ssh\id_rsa"

# Copy public key to server
cat "$env:USERPROFILE\.ssh\id_rsa.pub" | ssh hanif@192.168.56.105 "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

Now you can SSH without typing the password:

```bash
ssh hanif@192.168.56.105
```

---

## Support

For issues or questions, check:
- Application logs: `pm2 logs data-flavour-api`
- Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- Backend endpoint: `curl http://localhost:8000/api/health`
- Frontend build: `ls -la /opt/data-flavour/frontend/dist`
