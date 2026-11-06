#!/usr/bin/env bash
set -o errexit
set -o nounset
set -o pipefail
set -o xtrace

command_exists() {
  command -v "$1" > /dev/null 2>&1
}

is_darwin() {
  case "$(uname -s)" in
    Darwin*|darwin*) true ;;
    *) false ;;
  esac
}

sudo_if_needed() {
  if [ "$(id -u)" -ne 0 ]; then
    if command_exists sudo; then
      printf "%s" "sudo"
    else
      printf "%s" ""
    fi
  else
    printf "%s" ""
  fi
}

install_package() {
  pkg="$1"
  SUDO=$(sudo_if_needed)
  if command_exists apt-get; then
    $SUDO apt-get update -y
    $SUDO apt-get install -y "$pkg"
  elif command_exists yum; then
    $SUDO yum install -y "$pkg"
  elif command_exists dnf; then
    $SUDO dnf install -y "$pkg"
  elif command_exists apk; then
    $SUDO apk add --no-cache "$pkg"
  else
    echo "Unsupported package manager. Please install '$pkg' manually."
    return 1
  fi
}

install_docker() {
  SUDO=$(sudo_if_needed)
  if is_darwin; then
    echo "macOS detected. Please install Docker Desktop from https://www.docker.com/products/docker-desktop"
    return 1
  fi

  if ! command_exists curl && ! command_exists wget; then
    echo "Installing curl/wget..."
    install_package curl || install_package wget || { echo "Cannot install curl/wget"; return 1; }
  fi

  if [ -n "${DOCKER_MIRROR:-}" ]; then
    echo "Using Docker install mirror: $DOCKER_MIRROR"
    curl -fsSL "${DOCKER_MIRROR}" -o /tmp/get-docker.sh || wget -qO /tmp/get-docker.sh "${DOCKER_MIRROR}"
  else
    curl -fsSL https://get.docker.com -o /tmp/get-docker.sh || wget -qO /tmp/get-docker.sh https://get.docker.com
  fi

  chmod +x /tmp/get-docker.sh
  $SUDO sh /tmp/get-docker.sh

  if command_exists systemctl; then
    $SUDO systemctl daemon-reload || true
    $SUDO systemctl enable --now docker || true
  else
    echo "systemctl not found; ensure docker daemon is running"
  fi

  if ! command_exists docker; then
    echo "docker installation failed or docker not on PATH"
    return 1
  fi

  docker version
}

easy_timepro_install() {
  # Set web_port in .env if --port is provided
  if [ -n "$WEB_PORT" ]; then
    echo "Setting web_port to $WEB_PORT in .env"
    if [ -f ".env" ]; then
      # Update existing web_port line
      sed -i "s/^web_port=.*/web_port=$WEB_PORT/" .env
    else
      # Create new .env file
      echo "web_port=$WEB_PORT" > .env
    fi
  fi

  if command_exists docker; then
    echo "docker already installed"
    SUDO=$(sudo_if_needed)
    if command_exists systemctl; then
      $SUDO systemctl start docker || true
      $SUDO systemctl enable docker || true
    fi
  else
    install_docker || { echo "docker install failed"; exit 1; }
  fi

  echo "Building images and starting services..."
  if docker compose version >/dev/null 2>&1; then
    docker compose build --pull
    docker compose up -d
  elif command_exists docker-compose; then
    docker-compose build --pull
    docker-compose up -d
  else
    echo "Neither 'docker compose' nor 'docker-compose' available. Please install Docker with compose support."
    exit 1
  fi
}

easy_timepro_status() {
  echo "Docker Compose service status:"
  if docker compose version >/dev/null 2>&1; then
    docker compose ps
  elif command_exists docker-compose; then
    docker-compose ps
  else
    echo "No compose command found."
    exit 1
  fi
}

easy_timepro_start() {
  echo "Starting compose services"
  if docker compose version >/dev/null 2>&1; then
    docker compose start
  elif command_exists docker-compose; then
    docker-compose start
  else
    echo "No compose command found."
    exit 1
  fi
}

easy_timepro_stop() {
  echo "Stopping compose services"
  if docker compose version >/dev/null 2>&1; then
    docker compose stop
  elif command_exists docker-compose; then
    docker-compose stop
  else
    echo "No compose command found."
    exit 1
  fi
}

easy_timepro_set_port() {
  local new_port="$1"
  
  if [ -z "$new_port" ]; then
    echo "Usage: $(basename "$0") set-port --port <port>"
    exit 1
  fi
  
  if ! [[ "$new_port" =~ ^[0-9]+$ ]] || [ "$new_port" -lt 1 ] || [ "$new_port" -gt 65535 ]; then
    echo "Error: Invalid port number. Must be between 1 and 65535."
    exit 1
  fi
  
  echo "Setting web_port to $new_port..."
  
  if [ -f ".env" ]; then
    sed -i "s/^web_port=.*/web_port=$new_port/" .env
  else
    echo "web_port=$new_port" > .env
  fi
      
  echo "Port changed to $new_port successfully!"
}

# Default web port
WEB_PORT=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --port)
      WEB_PORT="$2"
      shift 2
      ;;
    install|status|start|stop|restart|set-port)
      action="$1"
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $(basename "$0") [install|status|start|stop|restart|set-port] [--port <port>]"
      exit 1
      ;;
  esac
done

if [ -z "${action:-}" ]; then
  echo "Usage: $(basename "$0") [install|status|start|stop|restart|set-port] [--port <port>]"
  exit 1
fi

case "$action" in
  install)
    easy_timepro_install
    ;;
  status)
    easy_timepro_status
    ;;
  start)
    easy_timepro_start
    ;;
  stop)
    easy_timepro_stop
    ;;
  restart)
    easy_timepro_stop
    easy_timepro_start
    ;;
  set-port)
    easy_timepro_set_port "$WEB_PORT"
    ;;
  *)
    echo "Arguments error! [${action}]"
    echo "Usage: $(basename "$0") [install|status|start|stop|restart|set-port] [--port <port>]"
    exit 2
    ;;
esac