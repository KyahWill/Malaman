#!/bin/bash

# Production Setup Script for Personalized LMS
# This script sets up the production environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Configuration
DOMAIN="${DOMAIN:-localhost}"
EMAIL="${EMAIL:-admin@example.com}"
ENVIRONMENT="${ENVIRONMENT:-production}"

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root for security reasons"
    fi
}

# Check system requirements
check_system_requirements() {
    log "Checking system requirements..."
    
    # Check OS
    if [[ "$OSTYPE" != "linux-gnu"* ]]; then
        warn "This script is designed for Linux systems"
    fi
    
    # Check available memory
    local mem_gb=$(free -g | awk '/^Mem:/{print $2}')
    if [[ $mem_gb -lt 4 ]]; then
        warn "System has less than 4GB RAM. Minimum 4GB recommended for production."
    fi
    
    # Check available disk space
    local disk_gb=$(df -BG / | awk 'NR==2{print $4}' | sed 's/G//')
    if [[ $disk_gb -lt 50 ]]; then
        warn "System has less than 50GB free disk space. Minimum 50GB recommended."
    fi
    
    log "System requirements check completed"
}

# Install dependencies
install_dependencies() {
    log "Installing system dependencies..."
    
    # Update package list
    sudo apt-get update
    
    # Install essential packages
    sudo apt-get install -y \
        curl \
        wget \
        git \
        unzip \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release \
        jq \
        htop \
        nginx \
        certbot \
        python3-certbot-nginx \
        ufw \
        fail2ban
    
    log "System dependencies installed"
}

# Install Node.js
install_nodejs() {
    log "Installing Node.js..."
    
    # Install Node.js 20.x
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    # Verify installation
    node_version=$(node --version)
    npm_version=$(npm --version)
    
    log "Node.js installed: $node_version"
    log "npm installed: $npm_version"
    
    # Install global packages
    sudo npm install -g pm2 @supabase/supabase-js
    
    log "Global npm packages installed"
}

# Install Docker
install_docker() {
    log "Installing Docker..."
    
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Add Docker repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Add user to docker group
    sudo usermod -aG docker $USER
    
    # Install Docker Compose
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    # Verify installation
    docker_version=$(docker --version)
    compose_version=$(docker-compose --version)
    
    log "Docker installed: $docker_version"
    log "Docker Compose installed: $compose_version"
}

# Configure firewall
configure_firewall() {
    log "Configuring firewall..."
    
    # Reset UFW to defaults
    sudo ufw --force reset
    
    # Set default policies
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    
    # Allow SSH
    sudo ufw allow ssh
    
    # Allow HTTP and HTTPS
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    
    # Allow monitoring ports (restrict to localhost)
    sudo ufw allow from 127.0.0.1 to any port 9090  # Prometheus
    sudo ufw allow from 127.0.0.1 to any port 3001  # Grafana
    
    # Enable firewall
    sudo ufw --force enable
    
    log "Firewall configured"
}

# Configure fail2ban
configure_fail2ban() {
    log "Configuring fail2ban..."
    
    # Create custom jail configuration
    sudo tee /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
backend = systemd

[sshd]
enabled = true
port = ssh
logpath = %(sshd_log)s
backend = %(sshd_backend)s

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10

[nginx-botsearch]
enabled = true
filter = nginx-botsearch
port = http,https
logpath = /var/log/nginx/access.log
maxretry = 2
EOF
    
    # Restart fail2ban
    sudo systemctl restart fail2ban
    sudo systemctl enable fail2ban
    
    log "fail2ban configured"
}

# Setup SSL certificates
setup_ssl() {
    if [[ "$DOMAIN" == "localhost" ]]; then
        warn "Skipping SSL setup for localhost"
        return
    fi
    
    log "Setting up SSL certificates for $DOMAIN..."
    
    # Stop nginx if running
    sudo systemctl stop nginx || true
    
    # Obtain SSL certificate
    sudo certbot certonly --standalone \
        --non-interactive \
        --agree-tos \
        --email "$EMAIL" \
        -d "$DOMAIN"
    
    # Setup auto-renewal
    sudo systemctl enable certbot.timer
    
    log "SSL certificates configured"
}

# Configure Nginx
configure_nginx() {
    log "Configuring Nginx..."
    
    # Backup original configuration
    sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup
    
    # Copy our custom configuration
    sudo cp nginx.conf /etc/nginx/nginx.conf
    
    # Create SSL directory
    sudo mkdir -p /etc/nginx/ssl
    
    # If using localhost, create self-signed certificates
    if [[ "$DOMAIN" == "localhost" ]]; then
        sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout /etc/nginx/ssl/key.pem \
            -out /etc/nginx/ssl/cert.pem \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
    else
        # Link Let's Encrypt certificates
        sudo ln -sf /etc/letsencrypt/live/$DOMAIN/fullchain.pem /etc/nginx/ssl/cert.pem
        sudo ln -sf /etc/letsencrypt/live/$DOMAIN/privkey.pem /etc/nginx/ssl/key.pem
    fi
    
    # Test Nginx configuration
    sudo nginx -t
    
    # Enable and start Nginx
    sudo systemctl enable nginx
    sudo systemctl start nginx
    
    log "Nginx configured"
}

# Setup application directory
setup_application() {
    log "Setting up application directory..."
    
    # Create application directory
    sudo mkdir -p /opt/lms-app
    sudo chown $USER:$USER /opt/lms-app
    
    # Create necessary subdirectories
    mkdir -p /opt/lms-app/{logs,backups,ssl,monitoring}
    
    # Copy application files
    if [[ -f "package.json" ]]; then
        cp -r . /opt/lms-app/
        cd /opt/lms-app
        
        # Install dependencies
        npm ci --only=production
        
        # Build application
        npm run build
    else
        warn "No package.json found. Please deploy application files manually."
    fi
    
    log "Application directory setup completed"
}

# Setup monitoring
setup_monitoring() {
    log "Setting up monitoring..."
    
    # Create monitoring directories
    mkdir -p /opt/lms-app/monitoring/{prometheus,grafana/dashboards,grafana/datasources}
    
    # Copy monitoring configuration
    cp -r monitoring/* /opt/lms-app/monitoring/
    
    # Create Grafana datasource configuration
    cat > /opt/lms-app/monitoring/grafana/datasources/prometheus.yml << EOF
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://monitoring:9090
    isDefault: true
EOF
    
    # Create basic dashboard
    cat > /opt/lms-app/monitoring/grafana/dashboards/lms-overview.json << EOF
{
  "dashboard": {
    "id": null,
    "title": "LMS Overview",
    "tags": ["lms"],
    "timezone": "browser",
    "panels": [
      {
        "title": "HTTP Requests",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{route}}"
          }
        ]
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "30s"
  }
}
EOF
    
    log "Monitoring setup completed"
}

# Setup backup system
setup_backup() {
    log "Setting up backup system..."
    
    # Make backup scripts executable
    chmod +x scripts/backup-database.sh
    chmod +x scripts/restore-database.sh
    
    # Copy scripts to system location
    sudo cp scripts/backup-database.sh /usr/local/bin/
    sudo cp scripts/restore-database.sh /usr/local/bin/
    
    # Create backup directory
    sudo mkdir -p /var/backups/lms
    sudo chown $USER:$USER /var/backups/lms
    
    # Setup cron job for daily backups
    (crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-database.sh >> /var/log/backup.log 2>&1") | crontab -
    
    log "Backup system configured"
}

# Setup log rotation
setup_log_rotation() {
    log "Setting up log rotation..."
    
    # Create log rotation configuration
    sudo tee /etc/logrotate.d/lms-app << EOF
/opt/lms-app/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        systemctl reload nginx
    endscript
}

/var/log/lms-backup.log {
    weekly
    missingok
    rotate 12
    compress
    delaycompress
    notifempty
}
EOF
    
    log "Log rotation configured"
}

# Create systemd service
create_systemd_service() {
    log "Creating systemd service..."
    
    sudo tee /etc/systemd/system/lms-app.service << EOF
[Unit]
Description=LMS Application
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=/opt/lms-app
ExecStart=/usr/bin/node build/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

# Security settings
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=/opt/lms-app

[Install]
WantedBy=multi-user.target
EOF
    
    # Reload systemd and enable service
    sudo systemctl daemon-reload
    sudo systemctl enable lms-app
    
    log "Systemd service created"
}

# Final security hardening
security_hardening() {
    log "Applying security hardening..."
    
    # Disable root login
    sudo sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
    sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
    
    # Disable password authentication (if SSH keys are configured)
    if [[ -f ~/.ssh/authorized_keys ]]; then
        sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
        sudo sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
    fi
    
    # Restart SSH service
    sudo systemctl restart ssh
    
    # Set up automatic security updates
    sudo apt-get install -y unattended-upgrades
    sudo dpkg-reconfigure -plow unattended-upgrades
    
    log "Security hardening completed"
}

# Verify installation
verify_installation() {
    log "Verifying installation..."
    
    # Check services
    services=("nginx" "fail2ban" "ufw")
    for service in "${services[@]}"; do
        if sudo systemctl is-active --quiet $service; then
            log "✓ $service is running"
        else
            warn "✗ $service is not running"
        fi
    done
    
    # Check ports
    if sudo netstat -tlnp | grep -q ":80 "; then
        log "✓ HTTP port (80) is listening"
    else
        warn "✗ HTTP port (80) is not listening"
    fi
    
    if sudo netstat -tlnp | grep -q ":443 "; then
        log "✓ HTTPS port (443) is listening"
    else
        warn "✗ HTTPS port (443) is not listening"
    fi
    
    # Check firewall
    if sudo ufw status | grep -q "Status: active"; then
        log "✓ Firewall is active"
    else
        warn "✗ Firewall is not active"
    fi
    
    log "Installation verification completed"
}

# Display next steps
show_next_steps() {
    info "Production setup completed successfully!"
    echo ""
    info "Next steps:"
    echo "1. Configure environment variables in /opt/lms-app/.env"
    echo "2. Deploy your application code to /opt/lms-app"
    echo "3. Start the application: sudo systemctl start lms-app"
    echo "4. Start monitoring: cd /opt/lms-app && docker-compose -f docker-compose.prod.yml up -d monitoring grafana"
    echo "5. Access your application at https://$DOMAIN"
    echo "6. Access Grafana at http://localhost:3001"
    echo ""
    info "Important files and directories:"
    echo "- Application: /opt/lms-app"
    echo "- Logs: /opt/lms-app/logs"
    echo "- Backups: /var/backups/lms"
    echo "- Nginx config: /etc/nginx/nginx.conf"
    echo "- SSL certificates: /etc/nginx/ssl/"
    echo ""
    warn "Remember to:"
    echo "- Configure your domain DNS to point to this server"
    echo "- Set up your Supabase production environment"
    echo "- Configure monitoring alerts"
    echo "- Test backup and restore procedures"
    echo "- Review security settings"
}

# Main execution
main() {
    log "Starting production setup for Personalized LMS..."
    
    check_root
    check_system_requirements
    install_dependencies
    install_nodejs
    install_docker
    configure_firewall
    configure_fail2ban
    setup_ssl
    configure_nginx
    setup_application
    setup_monitoring
    setup_backup
    setup_log_rotation
    create_systemd_service
    security_hardening
    verify_installation
    show_next_steps
    
    log "Production setup completed!"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --domain)
            DOMAIN="$2"
            shift 2
            ;;
        --email)
            EMAIL="$2"
            shift 2
            ;;
        --environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --domain DOMAIN     Domain name for SSL certificates (default: localhost)"
            echo "  --email EMAIL       Email for SSL certificates (default: admin@example.com)"
            echo "  --environment ENV   Environment name (default: production)"
            echo "  -h, --help          Show this help message"
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            ;;
    esac
done

# Run main function
main "$@"