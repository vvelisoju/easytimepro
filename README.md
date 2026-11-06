# easyTimePro/easyWDMS INSTALLATION PROCEDURE
## Version: 10.2.5 and above

## Supported OS/Databases

1. **Operating Systems**: Ubuntu, Fedora, Debian (10 and above)
2. **Databases**: PostgreSQL, MySQL, Oracle 12g and above
3.If an upgrade is needed, simply update the mysite directory. Do not uninstall and reinstall the application, as this may result in database data loss

## Installation Steps

1. Run `sudo su` in the terminal first to switch to root user.
2. Extract the package file:
   ```bash
   # unzip easyTimePro-10.2.5-linux-x64.zip
   ```
3. Navigate to the extracted directory:
   ```bash
   # cd easyTimePro-10.2.5-linux-x64
   ```
4. Make the setup script executable and run installation:
   ```bash
   # chmod +x setup.sh
   # bash setup.sh install
   ```
  
   **Optional**: Specify a custom port during installation:
   ```bash
   # bash setup.sh install --port 8000
   ```

5. If the installation fails, try building directly:
   ```bash
   # docker compose up -d --build
   ```

## Command List

### setup.sh Commands

| Command | Description |
|---------|-------------|
| `bash setup.sh install` | Install and start all services |
| `bash setup.sh install --port <port>` | Install with custom port |
| `bash setup.sh status` | Check service status |
| `bash setup.sh start` | Start all services |
| `bash setup.sh stop` | Stop all services |
| `bash setup.sh restart` | Restart all services |
| `bash setup.sh set-port --port <port>` | Change web port (need to restarts nginx) |

### Docker Compose Commands

```bash
# Check service status
# docker compose ps

# Stop all services
# docker compose down

# Start all services
# docker compose up -d

# Start services (without rebuilding)
# docker compose start

# Stop services (keep containers)
# docker compose stop

# Restart all services
# docker compose restart

# Check logs for a specific service
# docker compose logs service_name
# Example: docker compose logs web

# Save logs to a file
# docker compose logs service_name > log_name.txt
# Example: docker compose logs web > web_logs.txt
```

**Service Names**: beat, worker, web, redis, nginx, postgres

## Configuration of Database

1. Edit the `attsite.ini` file.
2. In the `[DATABASE]` section, fill in the database configuration:
   ```ini
   [DATABASE]
   # database configure
   # supported engine type: mysql/oracle/postgresql
   ENGINE=mysql
   NAME=easytime_linux
   USER=root
   PASSWORD=my_secrete_password
   PORT=3306
   HOST=192.168.10.1
   ```

3. **Important**: Ensure the database connection works externally before proceeding.

4. Verify the database connection:
   ```bash
   # docker compose exec web bash
   # python ConnDb.py
   ```
   
   Example output:
   ```
   [root@localhost EasyTimePro]# docker compose exec web bash
   root@0d261ca84e24:/app# python ConnDb.py
   mac=0242ac150005
   mysql connection is successful
   root@0d261ca84e24:/app# exit
   ```

   Alternatively, check logs:
   ```bash
   # docker compose logs web
   ```

## Configuration of Oracle Database

When connecting to Oracle, you can use either SID or Service Name. When using Service Name, prefix it with `SERVICE_NAME_`:

```ini
ENGINE=oracle
NAME=SERVICE_NAME_orcl
USER=sys
PASSWORD=my_secrete_password
PORT=1521
HOST=192.168.10.1
```

## Steps to Change the Port(Http only)

The default port is 80. There are two ways to change it:

### Method 1: Using set-port command (Recommended)

This is the easiest way - no manual file editing required:
for ex: Change port to 8090
```bash
# bash setup.sh set-port --port 8090
```

This command will:
1. Automatically update `web_port` in `.env` file
2. **Note**: You need to manually restart container to apply the changes: 
   `docker compose down && docker compose up -d`

### Method 2: Manual Editing

If you prefer to edit the file manually:

1. Edit the `.env` file in the project root folder
2. Change the port number:
   ```
   web_port=8090
   ```
3. Restart to apply changes (**No rebuild required**):
   ```bash
   
   docker compose down
   docker compose up -d
   ```

**Important Note**: Changing the web_port requires recreating the nginx container (using `docker compose down` + `docker compose up -d`), as `docker compose restart` alone will not apply the new port mapping. Rebuilding Docker images is NOT required.

After changing the port, access the application at: `http://127.0.0.1:<web_port>` (replace `<web_port>` with the port configured in `.env`)

## HTTPS Configuration

### Overview

By default, the system only supports HTTP access and does not include HTTPS support. To enable HTTPS, you need to make the following configurations.

### Step 1: Configure docker-compose.yml

Edit `docker-compose.yml` and configure the `nginx` service ports:

**Important Notes**:
- The left side of the port mapping (e.g., `443`) is the **external port** that users will access. You can modify this port as needed.
- The right side of the port mapping (e.g., `8443`) is the **internal container port**. This must **not** be changed as nginx is configured to listen on port 8443.

**Option A: Enable both HTTP and HTTPS**
```yaml
nginx:
  ports:
    - "${web_port:-80}:8080"    # HTTP port (external:internal)
    - "443:8443"                # HTTPS port (external:internal, modify left side as needed)
  volumes:
    - .:/app
    - ./certs:/app/certs:ro     # Certificate files mount
```

**Option B: Enable HTTPS only (remove HTTP)**
If you only want to use HTTPS, remove the HTTP port mapping:
```yaml
nginx:
  ports:
    - "443:8443"                # HTTPS port only (modify left side as needed)
  volumes:
    - .:/app
    - ./certs:/app/certs:ro     # Certificate files mount
```

### Step 2: Prepare SSL Certificates

Place your SSL certificate files in the `certs/` folder:

- `certs/server.crt` - SSL Certificate
- `certs/server.key` - SSL Private Key

**Important**: The private key must be at least 2048-bit RSA (or higher). Keys less than 2048 bits are not supported by modern Nginx versions.

The system includes default test certificate files (`certs/server.crt` and `certs/server.key`) for testing purposes.

### Step 3: Restart Services

After making the configuration changes, restart the services:
```bash
docker compose down
docker compose up -d
```

### Step 4: Access the application

Once configured, access your application via HTTPS. If you use the default port mapping `"443:8443"`, access via:
```
https://your-domain.com
```

The port 443 is the default HTTPS port, so it can be omitted from the URL.

If you configured a different external port (e.g., `"8444:8443"`), access via:
```
https://your-domain.com:8444
```

### Important Notes and Troubleshooting

This section covers common issues and important considerations for using easyTimePro/easyWDMS.

#### Production Environment

For production use, obtain an SSL certificate from a trusted Certificate Authority (CA) instead of using self-signed certificates.

#### First-time Installation

When installing for the first time, wait 1-2 minutes after installation before logging in to avoid 502 Bad Gateway errors.

#### Login Returns 403 Forbidden Error

If you encounter a 403 Forbidden error when logging in, it may be related to CSRF protection. In this case, 
you need to configure `CSRF_TRUSTED_DOMAINS` in the `[SYS]` section of the `attsite.ini` file.

**Configuration Example:**
```attsite.ini
[SYS]
CSRF_TRUSTED_DOMAINS=https://your-domain.com:8444,https://10.10.10.201:8443
```

Make sure to:
1. Replace `https://your-domain.com:8444` with your actual domain and port
2. Replace `https://10.10.10.201:8443` with your server's IP address and port
3. Separate multiple domains with commas (no spaces)
4. Restart the web service after making changes:
   ```bash
   # docker compose restart web
   ```

#### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| 502 Bad Gateway | Application not fully started | Wait 1-2 minutes after installation before accessing |
| 403 Forbidden | CSRF protection blocking request | Configure `CSRF_TRUSTED_DOMAINS` in `attsite.ini` |
