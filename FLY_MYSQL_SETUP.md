# Fly.dev MySQL Setup Guide 🗄️

Complete guide to set up MySQL database on Fly.dev for Challenge Hub cross-device sync.

## 🚀 Quick Setup (Recommended)

### Step 1: Install Fly CLI
```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login to Fly.dev
flyctl auth login
```

### Step 2: Deploy MySQL Database
```bash
# Make the deployment script executable
chmod +x scripts/deploy-mysql.sh

# Run the MySQL deployment script
./scripts/deploy-mysql.sh
```

### Step 3: Configure Your Main App
```bash
# Set MySQL environment variables for your main app
flyctl secrets set MYSQL_HOST=challengehub-mysql.internal
flyctl secrets set MYSQL_PORT=3306
flyctl secrets set MYSQL_USER=challuser
flyctl secrets set MYSQL_PASSWORD=user_secure_password_2024!
flyctl secrets set MYSQL_DATABASE=challengehub

# Redeploy your main app to pick up the new environment variables
flyctl deploy
```

## 🔧 Manual Setup (Alternative)

If you prefer to set up manually:

### 1. Create MySQL App
```bash
flyctl apps create challengehub-mysql
```

### 2. Create Persistent Volume
```bash
flyctl volumes create mysql_data --region iad --size 10 --app challengehub-mysql
```

### 3. Deploy MySQL
```bash
flyctl deploy --config fly-mysql-setup.toml --app challengehub-mysql
```

### 4. Set Up Database
```bash
# Connect to MySQL container
flyctl ssh console --app challengehub-mysql

# Inside the container, set up the database:
mysql -u root -proot_secure_password_2024!

CREATE DATABASE challengehub;
CREATE USER 'challuser'@'%' IDENTIFIED BY 'user_secure_password_2024!';
GRANT ALL PRIVILEGES ON challengehub.* TO 'challuser'@'%';
FLUSH PRIVILEGES;
EXIT;

# Import the schema
mysql -u challuser -puser_secure_password_2024! challengehub < /path/to/database/mysql-schema.sql
```

## 🔍 Verification

### Test MySQL Connection
```bash
# Check if MySQL is running
flyctl status --app challengehub-mysql

# Test connection from your main app
flyctl ssh console --app YOUR_MAIN_APP
curl http://localhost:PORT/api/mysql/test
```

### Check Challenge Hub Status
1. Open your Challenge Hub application
2. Look for the status indicator in bottom-right corner
3. Should show **"MySQL Active"** with green indicator
4. Test cross-device sync by accepting a challenge on one device

## 📱 Testing Cross-Device Sync

1. **Device 1**: Accept a challenge as Employee 2
2. **Device 2**: Login as Employee 2 - challenge should appear automatically
3. **Device 1**: Submit solution
4. **Device 2**: Check "My Submissions" - submission should appear immediately

## 🛠️ Troubleshooting

### MySQL Not Connecting
```bash
# Check MySQL logs
flyctl logs --app challengehub-mysql

# Check main app logs
flyctl logs

# Test MySQL endpoint
curl https://your-app.fly.dev/api/mysql/test
```

### Environment Variables
```bash
# Check if variables are set
flyctl secrets list

# Update if needed
flyctl secrets set MYSQL_HOST=challengehub-mysql.internal
```

### Database Issues
```bash
# Connect to MySQL and check
flyctl ssh console --app challengehub-mysql
mysql -u challuser -puser_secure_password_2024! challengehub

SHOW TABLES;
SELECT COUNT(*) FROM users;
```

## 💡 Production Recommendations

### Security
- Change default passwords after setup
- Use Fly.dev secrets for sensitive data
- Enable SSL for production

### Performance
- Increase volume size for larger datasets
- Consider read replicas for high traffic
- Monitor database performance

### Backup
```bash
# Create database backup
flyctl ssh console --app challengehub-mysql --command "mysqldump -u challuser -puser_secure_password_2024! challengehub > /tmp/backup.sql"

# Download backup
flyctl sftp shell --app challengehub-mysql
get /tmp/backup.sql ./backup.sql
```

## 📊 Expected Results

After successful setup:
- ✅ **Green MySQL indicator** in Challenge Hub
- ✅ **Real-time cross-device sync**
- ✅ **Persistent data storage**
- ✅ **No more localStorage limitations**

Your Challenge Hub will now work seamlessly across all devices! 🎉

## 🆘 Need Help?

If you encounter issues:
1. Check the [troubleshooting section](#troubleshooting) above
2. Review Fly.dev MySQL logs: `flyctl logs --app challengehub-mysql`
3. Test the connection: `curl YOUR_APP_URL/api/mysql/test`

The MySQL setup provides enterprise-grade persistence and cross-device synchronization for your Challenge Hub! 📱💻
