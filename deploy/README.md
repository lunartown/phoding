GCP VM deployment (Docker + Nginx)

Prereqs
- Ubuntu/Debian VM with a public IP
- DNS: point `app.yourdomain` and `api.yourdomain` A-records to the VM
- SSH access with sudo

Install Docker
```
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
docker --version
docker compose version || sudo apt-get install -y docker-compose-plugin
```

Clone repo to VM
```
git clone <this-repo-url>
cd phoding/deploy
```

Prepare env files
```
cp gateway.env.example gateway.env
cp frontend.env.example frontend.env
# Edit domains and keys
vim gateway.env      # set PUBLIC_GATEWAY_URL, ANTHROPIC_API_KEY
vim frontend.env     # set NEXT_PUBLIC_GATEWAY_URL
```

Configure Nginx server_name
```
sed -i 's/app.example.com/app.yourdomain/g' nginx/conf.d/app.conf
sed -i 's/api.example.com/api.yourdomain/g' nginx/conf.d/api.conf
```

First boot (HTTP only)
```
docker compose up -d --build
docker compose logs -f gateway
```

Issue TLS (Let’s Encrypt) — optional quick path
1) Stop nginx container: `docker compose stop nginx`
2) Install certbot on host: `sudo apt-get install -y certbot`
3) Use standalone mode (ensure 80 is free):
   - `sudo certbot certonly --standalone -d app.yourdomain -d api.yourdomain`
4) Start nginx: `docker compose start nginx`
5) Uncomment HTTPS server blocks in `nginx/conf.d/*.conf` and `docker compose restart nginx`

Notes
- Ports: frontend 3001, gateway 3002, Vite 5173 is accessed internally by gateway; do not expose 5173.
- Gateway spawns the Vite dev server inside its container; no extra container is needed for preview.
- Security: protect `/agent/*` with an auth proxy or add a header check in gateway if exposing publicly.
- Updates: pull latest repo and `docker compose up -d --build`.

