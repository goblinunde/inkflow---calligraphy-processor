# InkFlow Deployment Guide (English)

## 📋 Table of Contents

1. [System Requirements](#system-requirements)
2. [Local Development Deployment](#local-development-deployment)
3. [Linux Server Deployment](#linux-server-deployment)
4. [Docker Container Deployment](#docker-container-deployment)
5. [Troubleshooting](#troubleshooting)

---

## System Requirements

### Basic Requirements

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **Memory**: Minimum 2GB RAM
- **Disk Space**: Minimum 500MB

### Browser Support

- Chrome 90+
- Edge 90+
- Firefox 88+
- Safari 14+

---

## Local Development Deployment

### Windows

#### 1. Install Node.js

Visit [Node.js Official Website](https://nodejs.org/) and download the LTS version.

Verify installation:

```powershell
node --version
npm --version
```

#### 2. Clone Project

```powershell
# Using Git
git clone https://github.com/your-repo/inkflow.git
cd inkflow---calligraphy-processor

# Or extract downloaded ZIP file
```

#### 3. Install Dependencies

```powershell
npm install
```

#### 4. Start Development Server

```powershell
npm run dev
```

#### 5. Access Application

Open browser and visit: `http://localhost:5173`

#### 6. Build for Production

```powershell
npm run build
```

Build output will be in the `dist/` directory.

---

### macOS

#### 1. Install Homebrew (if not installed)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### 2. Install Node.js

```bash
brew install node@18
```

Verify installation:

```bash
node --version
npm --version
```

#### 3. Clone Project

```bash
git clone https://github.com/your-repo/inkflow.git
cd inkflow---calligraphy-processor
```

#### 4. Install Dependencies

```bash
npm install
```

#### 5. Start Development Server

```bash
npm run dev
```

#### 6. Access Application

Open browser and visit: `http://localhost:5173`

---

### Linux (Ubuntu/Debian)

#### 1. Update System

```bash
sudo apt update
sudo apt upgrade -y
```

#### 2. Install Node.js

```bash
# Using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

#### 3. Clone Project

```bash
git clone https://github.com/your-repo/inkflow.git
cd inkflow---calligraphy-processor
```

#### 4. Install Dependencies

```bash
npm install
```

#### 5. Start Development Server

```bash
npm run dev
```

#### 6. Access Application

Open browser and visit: `http://localhost:5173`

---

## Linux Server Deployment

### Option 1: Using Nginx + PM2 (Recommended)

#### 1. Prepare Server

```bash
# Connect to server
ssh user@your-server-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y git curl build-essential
```

#### 2. Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### 3. Install PM2

```bash
sudo npm install -g pm2
```

#### 4. Clone and Build Project

```bash
# Create application directory
sudo mkdir -p /var/www
cd /var/www

# Clone project
sudo git clone https://github.com/your-repo/inkflow.git
cd inkflow

# Set permissions
sudo chown -R $USER:$USER /var/www/inkflow

# Install dependencies
npm install

# Build for production
npm run build
```

#### 5. Install and Configure Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration file
sudo nano /etc/nginx/sites-available/inkflow
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    root /var/www/inkflow/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss image/svg+xml;

    # Static asset caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

Save and exit (Ctrl+X, Y, Enter).

#### 6. Enable Site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/inkflow /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

#### 7. Configure Firewall

```bash
# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

#### 8. Configure HTTPS (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test automatic renewal
sudo certbot renew --dry-run
```

#### 9. Setup Auto-Update (Optional)

Create update script:

```bash
nano /var/www/inkflow/update.sh
```

Add content:

```bash
#!/bin/bash
cd /var/www/inkflow
git pull
npm install
npm run build
sudo systemctl reload nginx
echo "InkFlow updated successfully at $(date)"
```

Set permissions and add to crontab:

```bash
chmod +x /var/www/inkflow/update.sh

# Auto-update at 2 AM daily
crontab -e
# Add: 0 2 * * * /var/www/inkflow/update.sh >> /var/log/inkflow-update.log 2>&1
```

---

### Option 2: Using Serve (Simple & Quick)

```bash
# Install serve
sudo npm install -g serve

# Build project
npm run build

# Start service (port 3000)
serve -s dist -l 3000

# Keep running with PM2
pm2 start "serve -s dist -l 3000" --name inkflow
pm2 save
pm2 startup
```

---

## Docker Container Deployment

### Prerequisites

#### Install Docker

**Ubuntu/Debian:**

```bash
# Remove old versions
sudo apt-get remove docker docker-engine docker.io containerd runc

# Install dependencies
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg lsb-release

# Add Docker GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Add Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Verify installation
sudo docker --version
sudo docker compose version
```

**CentOS/RHEL:**

```bash
# Install dependencies
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# Install Docker
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker

# Verify installation
sudo docker --version
```

**Windows:**
Download and install [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)

**macOS:**
Download and install [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/)

---

### Quick Deployment

#### 1. Clone Project

```bash
git clone https://github.com/your-repo/inkflow.git
cd inkflow---calligraphy-processor
```

#### 2. Build Image

```bash
docker compose build
```

#### 3. Start Container

```bash
docker compose up -d
```

#### 4. Check Status

```bash
docker compose ps
```

#### 5. Access Application

Open browser and visit: `http://localhost:8080`

---

### Production Deployment

#### 1. Custom Configuration

Edit `docker-compose.yml`:

```yaml
version: '3.8'

services:
  inkflow:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: inkflow-prod
    restart: always
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
    networks:
      - inkflow-network
    volumes:
      - ./logs:/var/log/nginx
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M

networks:
  inkflow-network:
    driver: bridge
```

#### 2. Using Environment Variables

Create `.env` file:

```env
# Port configuration
PORT=8080

# Environment
NODE_ENV=production

# Gemini API (optional)
VITE_GEMINI_API_KEY=your-api-key-here
```

#### 3. Enable HTTPS

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  inkflow:
    build: .
    container_name: inkflow-prod
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./ssl:/etc/nginx/ssl
      - ./nginx-https.conf:/etc/nginx/conf.d/default.conf
    networks:
      - inkflow-network

networks:
  inkflow-network:
    driver: bridge
```

Create `nginx-https.conf`:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    root /usr/share/nginx/html;
    index index.html;

    # ... other configurations same as nginx.conf
}
```

Start:

```bash
docker compose -f docker-compose.prod.yml up -d
```

---

### Common Docker Commands

#### Container Management

```bash
# Start service
docker compose up -d

# Stop service
docker compose stop

# Restart service
docker compose restart

# Stop and remove containers
docker compose down

# View logs
docker compose logs -f

# View recent logs (last 100 lines)
docker compose logs --tail=100 -f

# Enter container
docker exec -it inkflow-calligraphy sh

# Check container status
docker compose ps
```

#### Image Management

```bash
# Build image
docker compose build

# Force rebuild (no cache)
docker compose build --no-cache

# List images
docker images

# Remove image
docker rmi inkflow-calligraphy-processor-inkflow

# Clean unused images
docker image prune -a
```

#### System Maintenance

```bash
# Check disk usage
docker system df

# Clean system (remove unused resources)
docker system prune -a

# Monitor container resources
docker stats
```

---

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

**Symptom**: `Error: listen EADDRINUSE: address already in use :::5173`

**Solution**:

**Windows**:

```powershell
# Find process using port
netstat -ano | findstr :5173

# Kill process (replace PID)
taskkill /PID <PID> /F
```

**Linux/macOS**:

```bash
# Find process using port
lsof -i :5173

# Kill process
kill -9 <PID>
```

#### 2. npm install Failed

**Symptom**: Dependency installation errors

**Solution**:

```bash
# Clear cache
npm cache clean --force

# Remove node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

#### 3. Build Failed

**Symptom**: `npm run build` errors

**Solution**:

```bash
# Check Node.js version
node --version  # Should be >= 18.x

# Clear build cache
rm -rf dist .vite

# Rebuild
npm run build
```

#### 4. Docker Container Inaccessible

**Symptom**: Cannot open `http://localhost:8080`

**Solution**:

```bash
# Check container status
docker compose ps

# View logs
docker compose logs

# Check port mapping
docker port inkflow-calligraphy

# Restart container
docker compose restart
```

#### 5. Nginx 403 Error

**Symptom**: Shows 403 Forbidden

**Solution**:

```bash
# Check file permissions
ls -la /var/www/inkflow/dist

# Fix permissions
sudo chown -R www-data:www-data /var/www/inkflow/dist
sudo chmod -R 755 /var/www/inkflow/dist

# Check Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

#### 6. Out of Memory

**Symptom**: Memory overflow during build or runtime

**Solution**:

```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build

# Docker resource limits
# Add to docker-compose.yml:
deploy:
  resources:
    limits:
      memory: 1G
```

---

## Performance Optimization

### 1. Enable Gzip Compression

Already configured in `nginx.conf`, compression ratio ~70%.

### 2. Enable Browser Caching

Static assets cached for 1 year:

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 3. CDN Acceleration

Deploy `dist/` directory to CDN (e.g., Cloudflare, AWS S3).

### 4. Server Optimization

```bash
# Increase file descriptor limit
ulimit -n 65535

# Nginx worker processes
# In nginx.conf:
worker_processes auto;
```

---

## Monitoring and Maintenance

### Log Management

```bash
# Nginx access log
tail -f /var/log/nginx/access.log

# Nginx error log
tail -f /var/log/nginx/error.log

# Docker logs
docker compose logs -f --tail=100

# System logs
journalctl -u nginx -f
```

### Automated Backup

Create backup script:

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backup/inkflow"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup configuration files
tar -czf $BACKUP_DIR/config_$DATE.tar.gz \
    /etc/nginx/sites-available/inkflow \
    /var/www/inkflow/docker-compose.yml

# Keep last 7 days of backups
find $BACKUP_DIR -name "config_*.tar.gz" -mtime +7 -delete

echo "Backup completed at $DATE"
```

Add to crontab:

```bash
0 3 * * * /backup/backup.sh >> /var/log/inkflow-backup.log 2>&1
```

---

## Security Recommendations

### 1. Firewall Configuration

```bash
# Ubuntu (UFW)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# CentOS (firewalld)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 2. Regular Updates

```bash
# System updates
sudo apt update && sudo apt upgrade -y

# Docker image updates
docker pull nginx:alpine
docker compose build --no-cache
docker compose up -d
```

### 3. SSL/TLS Configuration

Use Let's Encrypt free certificates (explained above).

---

## Summary

Comparison of deployment methods:

| Method | Pros | Cons | Use Case |
|--------|------|------|----------|
| Local Dev | Simple & Fast | Dev only | Development |
| Linux+Nginx | Flexible | Complex setup | Production |
| Docker | Consistent | Resource usage | Quick deploy |

**Recommended**:

- **Development**: Local npm run dev
- **Production**: Docker + Nginx reverse proxy
- **Small Projects**: Linux + Nginx + PM2

---

**Happy Deploying! For issues, check documentation or submit an Issue.** 🚀
