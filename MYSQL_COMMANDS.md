# MySQL Setup Commands 🚀

Quick copy-paste commands to set up MySQL on Fly.dev for Challenge Hub.

## 1️⃣ Install Fly CLI (if not installed)
```bash
curl -L https://fly.io/install.sh | sh
flyctl auth login
```

## 2️⃣ Create MySQL Database App
```bash
# Create MySQL app
flyctl apps create challengehub-mysql

# Create persistent storage
flyctl volumes create mysql_data --region iad --size 10 --app challengehub-mysql
```

## 3️⃣ Deploy MySQL Database
```bash
# Deploy MySQL with our configuration
flyctl deploy --config fly-mysql-setup.toml --app challengehub-mysql

# Wait for deployment (about 2-3 minutes)
flyctl status --app challengehub-mysql
```

## 4️⃣ Set Up Database Schema
```bash
# Connect and create database
flyctl ssh console --app challengehub-mysql --command "mysql -u root -proot_secure_password_2024! -e 'CREATE DATABASE IF NOT EXISTS challengehub;'"

# Create user
flyctl ssh console --app challengehub-mysql --command "mysql -u root -proot_secure_password_2024! -e \"CREATE USER IF NOT EXISTS 'challuser'@'%' IDENTIFIED BY 'user_secure_password_2024!'; GRANT ALL PRIVILEGES ON challengehub.* TO 'challuser'@'%'; FLUSH PRIVILEGES;\""
```

## 5️⃣ Import Schema (Upload schema file first)
```bash
# You'll need to upload the schema file manually via SSH or recreate tables
flyctl ssh console --app challengehub-mysql

# Inside the container:
mysql -u challuser -puser_secure_password_2024! challengehub

# Then copy-paste the SQL from database/mysql-schema.sql
```

## 6️⃣ Configure Your Main App
```bash
# Set environment variables for your main app
flyctl secrets set MYSQL_HOST=challengehub-mysql.internal
flyctl secrets set MYSQL_PORT=3306
flyctl secrets set MYSQL_USER=challuser
flyctl secrets set MYSQL_PASSWORD=user_secure_password_2024!
flyctl secrets set MYSQL_DATABASE=challengehub

# Redeploy main app
flyctl deploy
```

## 7️⃣ Test Connection
```bash
# Check MySQL status
flyctl status --app challengehub-mysql

# Test API endpoint
curl https://your-app.fly.dev/api/mysql/test
```

## ✅ Verification
- Open Challenge Hub
- Look for **green "MySQL Active"** indicator (bottom-right)
- Test cross-device sync by accepting a challenge

## 🔧 Useful Commands
```bash
# View MySQL logs
flyctl logs --app challengehub-mysql

# Connect to MySQL container
flyctl ssh console --app challengehub-mysql

# Connect to MySQL database
flyctl ssh console --app challengehub-mysql --command "mysql -u challuser -puser_secure_password_2024! challengehub"

# Check main app logs
flyctl logs

# List environment variables
flyctl secrets list
```

## 🆘 Troubleshooting

### If MySQL indicator stays yellow:
1. Check main app logs: `flyctl logs`
2. Test MySQL endpoint: `curl YOUR_APP/api/mysql/test`
3. Verify environment variables: `flyctl secrets list`

### If database connection fails:
1. Check MySQL is running: `flyctl status --app challengehub-mysql`
2. Check MySQL logs: `flyctl logs --app challengehub-mysql`
3. Test from main app container: `flyctl ssh console`

Once complete, your Challenge Hub will have true cross-device synchronization! 🎉
