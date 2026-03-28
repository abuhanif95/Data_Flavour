# Server Management Quick Reference

## SSH Connection

```bash
ssh hanif@192.168.56.105
# Password: 1234
```

## Application Status

```bash
# Check if backend is running
pm2 status

# Check if Nginx is running
sudo systemctl status nginx

# Check both APIs
curl http://localhost:8000/api/health
curl http://localhost:8000/api/chat -X POST -H "Content-Type: application/json" -d '{"question":"test"}'
```

## View Logs

```bash
# Backend API logs (real-time)
pm2 logs data-flavour-api

# Nginx web server logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Backend specific error log
tail -f ~/.pm2/logs/data-flavour-api-error.log
```

## Control Backend Service

```bash
# Restart
pm2 restart data-flavour-api

# Stop
pm2 stop data-flavour-api

# Start
pm2 start /opt/data-flavour/backend/src/server.js --name data-flavour-api

# Delete from PM2
pm2 delete data-flavour-api
```

## Control Web Server

```bash
# Reload Nginx configuration
sudo nginx -t
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# Stop Nginx
sudo systemctl stop nginx

# Start Nginx
sudo systemctl start nginx
```

## Environment Configuration

```bash
# Edit backend configuration
nano /opt/data-flavour/backend/.env

# View current config (without exposing API key)
cat /opt/data-flavour/backend/.env | grep -v OPENAI_API_KEY
```

## Database Management

```bash
# Check database exists and size
ls -lh /opt/data-flavour/yelp.db

# Access SQLite terminal
sqlite3 /opt/data-flavour/yelp.db

# Query tables from SQLite
sqlite3 /opt/data-flavour/yelp.db "SELECT COUNT(*) FROM businesses;"

# Backup database
cp /opt/data-flavour/yelp.db /opt/data-flavour/yelp.db.backup

# Export data
sqlite3 /opt/data-flavour/yelp.db ".dump" > /opt/data-flavour/backup.sql
```

## File Management

```bash
# Navigate to application directory
cd /opt/data-flavour

# List files
ls -la

# View frontend build size
du -sh frontend/dist/

# Check disk usage
df -h

# Check logs directory
du -sh ~/.pm2/logs/
```

## Port Management

```bash
# Check which process is using port 8000
sudo lsof -i :8000

# Check which process is using port 80
sudo lsof -i :80

# Check all listening ports
sudo netstat -tulpn | grep LISTEN
```

## System Information

```bash
# OS info
uname -a

# Node.js version
node --version

# npm version
npm --version

# PM2 version
pm2 --version

# Nginx version
sudo nginx -v

# Disk space
df -h

# Memory usage
free -h

# CPU usage
top -bn1 | head -n 20
```

## Troubleshooting

```bash
# Check if Node.js process crashed
pm2 show data-flavour-api

# Get detailed error logs (last 100 lines)
pm2 logs data-flavour-api --lines 100

# Restart with new environment variables
pm2 restart data-flavour-api --update-env

# Stop all PM2 processes
pm2 stop all

# Start all PM2 processes
pm2 start all

# Kill all PM2 processes and clean cache
pm2 kill

# Show node process details
ps aux | grep node
```

## Update and Maintenance

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Update Node.js packages
cd /opt/data-flavour/backend
npm update

cd /opt/data-flavour/frontend
npm update

# Clean npm cache
npm cache clean --force

# Rebuild frontend after updates
npm run build

# Restart application
pm2 restart data-flavour-api
```

## Backup Strategy

```bash
# Create backup directory
mkdir -p ~/backups

# Backup database
cp /opt/data-flavour/yelp.db ~/backups/yelp_$(date +%Y%m%d_%H%M%S).db

# Backup entire application
tar -czf ~/backups/data-flavour_$(date +%Y%m%d_%H%M%S).tar.gz /opt/data-flavour/

# List backups
ls -lh ~/backups/

# Restore database
cp ~/backups/yelp_YYYYMMDD_HHMMSS.db /opt/data-flavour/yelp.db
```

## Performance Monitoring

```bash
# Monitor PM2 in real-time
pm2 monit

# Get detailed node process stats
pm2 show data-flavour-api

# Check system load
uptime

# Monitor memory
free -m

# Monitor disk I/O
iostat 1 5
```

## Security

```bash
# Check SSH connections
sudo ss -tulpn | grep ssh

# View SSH login history
sudo lastlog

# Check for failed logins
sudo grep "Failed password" /var/log/auth.log | tail -10

# File permissions check
ls -la /opt/data-flavour/
ls -la /opt/data-flavour/backend/.env
```

## Quick Diagnostics

```bash
# Full system check
echo "=== System ===" && uname -a && \
echo "=== Disk ===" && df -h && \
echo "=== Memory ===" && free -h && \
echo "=== Node ===" && node -v && \
echo "=== PM2 ===" && pm2 status && \
echo "=== Nginx ===" && sudo systemctl status nginx
```

---

**Bookmark this page for quick access to common commands!**
