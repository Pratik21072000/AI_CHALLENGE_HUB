#!/bin/bash

# MySQL Database Deployment Script for Fly.dev
# This script sets up a MySQL database for Challenge Hub

echo "🚀 Setting up MySQL Database on Fly.dev..."

# Check if flyctl is installed
if ! command -v flyctl &> /dev/null; then
    echo "❌ flyctl is not installed. Please install it first:"
    echo "   curl -L https://fly.io/install.sh | sh"
    exit 1
fi

# Create MySQL database app
echo "📦 Creating MySQL database app..."
flyctl apps create challengehub-mysql --org personal

# Create a volume for MySQL data persistence
echo "💾 Creating persistent volume for MySQL data..."
flyctl volumes create mysql_data --region iad --size 10 --app challengehub-mysql

# Deploy MySQL database
echo "🗄️ Deploying MySQL database..."
flyctl deploy --config fly-mysql-setup.toml --app challengehub-mysql

# Wait for deployment
echo "⏳ Waiting for MySQL to be ready..."
sleep 30

# Get MySQL connection details
echo "📋 Getting MySQL connection details..."
flyctl status --app challengehub-mysql

# Set up database schema
echo "🏗️ Setting up database schema..."
flyctl ssh console --app challengehub-mysql --command "mysql -u root -proot_secure_password_2024! -e 'CREATE DATABASE IF NOT EXISTS challengehub;'"

# Create user and grant permissions
echo "👤 Creating database user..."
flyctl ssh console --app challengehub-mysql --command "mysql -u root -proot_secure_password_2024! -e \"CREATE USER IF NOT EXISTS 'challuser'@'%' IDENTIFIED BY 'user_secure_password_2024!'; GRANT ALL PRIVILEGES ON challengehub.* TO 'challuser'@'%'; FLUSH PRIVILEGES;\""

# Import schema
echo "📊 Importing database schema..."
flyctl ssh console --app challengehub-mysql --command "mysql -u challuser -puser_secure_password_2024! challengehub" < database/mysql-schema.sql

echo "✅ MySQL database setup complete!"
echo ""
echo "🔗 Connection Details:"
echo "  Host: challengehub-mysql.internal"
echo "  Port: 3306"
echo "  Database: challengehub"
echo "  Username: challuser"
echo "  Password: user_secure_password_2024!"
echo ""
echo "📝 Add these environment variables to your main app:"
echo "  flyctl secrets set MYSQL_HOST=challengehub-mysql.internal --app YOUR_APP_NAME"
echo "  flyctl secrets set MYSQL_PORT=3306 --app YOUR_APP_NAME"
echo "  flyctl secrets set MYSQL_USER=challuser --app YOUR_APP_NAME"
echo "  flyctl secrets set MYSQL_PASSWORD=user_secure_password_2024! --app YOUR_APP_NAME"
echo "  flyctl secrets set MYSQL_DATABASE=challengehub --app YOUR_APP_NAME"
