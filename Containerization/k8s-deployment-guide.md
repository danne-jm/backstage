# BackstageV2 Containerization & Kubernetes Deployment Guide

This guide covers how to build your Docker image efficiently and deploy it to a Kubernetes cluster using Kustomize and separate manifest files.

## 1. Building the Docker Image

The build uses a `.dockerignore` file which prevents huge local development directories (like `node_modules/` or `vendor/`) from bloating the image, keeping it around 100-300MB.

**For local desktop/cloud deployment (x86_64 architecture):**
```bash
docker build -t backstage-v2 -f Containerization/Dockerfile .
```

**For Raspberry Pi deployment (ARM64 architecture):**
Since a Raspberry Pi runs on ARM architecture, building a standard image on your desktop will not work. You must cross-compile it and push it directly to Docker Hub:
```bash
# Replace YOUR_DOCKERHUB_USERNAME with your actual Docker Hub username
docker buildx build --platform linux/arm64 -t YOUR_DOCKERHUB_USERNAME/backstage-v2:latest --push -f Containerization/Dockerfile .
```

*(Note: During the build, a dummy `.env` file is temporarily created to allow Wayfinder and Vite to compile assets, and then securely deleted immediately afterwards).*

## 2. Is the Dockerfile Production Ready?

**Yes**, this Dockerfile is production-ready and safe for distribution:
- **Multi-stage builds:** It separates Composer and NPM, meaning development tools are not included in the final image.
- **Security (Non-root user):** The final stage runs processes as the `www-data` user rather than `root`.
- **Unprivileged Ports:** Nginx listens on port `8080`.
- **Optimization:** Composer is run with `--optimize-autoloader` and `--no-dev`.

## 3. Kubernetes Manifests (The Kustomize Approach)

Rather than having one massive manifest file, the configuration is broken out into individual files inside `Containerization/manifests/` for clean separation of concerns:

1. **`deployment.yaml`:** Defines how the pods run and scale. (Make sure to update the `image:` line with your Docker Hub username if pulling from a registry).
2. **`service.yaml`:** Exposes the pods internally on port 80.
3. **`postgres.yaml`**: A Stateful deployment of PostgreSQL (`postgres:15.1-alpine`) with a PersistentVolumeClaim (PVC) so your database survives pod restarts. It dynamically reads your `.env.production` secrets for credentials!
4. **`redis.yaml`**: A Stateful deployment of Redis (`redis:7-alpine`) with a PVC for cache and sessions.
5. **`kustomization.yaml`**: A powerful Kubernetes-native tool that automatically bundles all these manifests together, reads your `.env.production` file, and creates a secure Kubernetes Secret from it.

### Automatic Secrets Injection
Because of the `kustomization.yaml`, you do **not** need to manually define your environment variables in a `secrets.yaml` file. Kubernetes will read your root `.env.production` file, and `deployment.yaml` (as well as `postgres.yaml`) uses `envFrom` to automatically inject every single variable into the running containers!

## 4. Deploying to Kubernetes via Kubectl

Once your image is built (and pushed to Docker Hub if deploying to the Raspberry Pi), you apply the configuration using the `-k` (Kustomize) flag instead of `-f`.

1. **Apply the Kustomization directory:**
   ```bash
   # Make sure you run this from the root of your project where your .env file lives
   kubectl apply -k Containerization/manifests/
   ```

2. **Verify the deployment:**
   ```bash
   kubectl get pods
   kubectl get svc backstage-service
   ```

3. **Port Forwarding (for local testing):**
   To test the deployment locally without an Ingress, port-forward the service:
   ```bash
   kubectl port-forward svc/backstage-service 8000:80
   ```
   You can then access the application at `http://localhost:8000`.

## 5. Troubleshooting & Architecture References

Over the course of this deployment, we resolved several edge-cases related to Docker, Kubernetes, and Laravel's framework requirements. 

### Cloudflare Tunnel Configuration
- **The Public URL:** Your `.env.production` must have `APP_URL=https://your-public-url.com`. If you leave it as `localhost`, features like password reset emails will send broken links to users.
- **NodePort for Host Tunnels:** If your `cloudflared` agent is running directly on the Raspberry Pi host (not inside k8s), it cannot see inside the cluster. You must configure your `service.yaml` to use `type: NodePort` (e.g., port `30080`), and point your Cloudflare dashboard to `http://localhost:30080`.
- **Forcing HTTPS:** Because Cloudflare handles the SSL and passes unencrypted HTTP through the tunnel, Laravel might mistakenly generate `http://` links. This is permanently fixed by adding `URL::forceScheme('https');` in the `AppServiceProvider` when in a production environment.

### The "500 Internal Server Error" (Bootstrap Cache Panic)
If your initial deployment throws a fatal Laravel 500 error (e.g., `Target class [cache] does not exist`), it is almost certainly a caching issue.
- **The Cause:** If `bootstrap/cache/*` is not in your `.dockerignore`, Docker will accidentally copy your computer's local cached files into the production container. These files contain hardcoded absolute paths to your laptop, causing Laravel to panic in production.
- **The Fix:** Run `kubectl exec deployment/backstage-deployment -- php artisan optimize:clear` to instantly purge the corrupted cache inside the pod.

### Docker Cross-Compilation (The 40-Minute Build)
Building an ARM64 image on an AMD64 desktop forces Docker to use the QEMU emulator.
- When compiling C extensions (like `gd`, `intl`, `zip`), emulation is incredibly slow (taking 30-40 minutes). 
- **WebP Support:** The `gd` extension requires `libwebp-dev` and the `--with-webp` compiler flag to correctly render modern images for `Intervention\Image`. 
- **The Good News:** Docker aggressively caches these layers. Future builds (updating your PHP or JS code) will completely skip the compilation phase and finish in seconds.

### Alpine Linux & Supervisord
Running Supervisor as PID 1 alongside a restricted `www-data` user requires strict handling:
- **Preserving Configs:** Generating multi-line config files using `echo` squashes newlines and breaks Supervisor. We use standard Linux Heredocs (`cat <<'EOF'`) to preserve formatting natively.
- **Permission Quirks:** Because the config files are generated by `root` during the Docker build, Alpine's strict boundaries prevent the `www-data` user from reading them. We explicitly run `chown www-data:www-data` on the configs before swapping users.

### Kustomize Security Constraints
Kustomize has an aggressive security policy preventing directory traversal. It will refuse to read files (like `.env.production`) if they sit outside or above the folder where `kustomization.yaml` is located. 
- **The Fix:** Place `kustomization.yaml` directly in the project root, and update its internal paths to point downwards into `Containerization/manifests/`. You can then deploy by simply running `kubectl apply -k .` from the root.

### `kubectl exec` vs `port-forward`
- **`port-forward`:** Used to pipe network traffic from the cluster to your local machine (e.g., connecting a GUI like DataGrip to your Postgres pod).
- **`exec`:** Functions exactly like SSH. It natively runs terminal commands inside the pod without needing any port-forwarding.
- **Seeding your Database:** 
  ```bash
  kubectl exec deployment/backstage-deployment -- php artisan migrate:fresh --seed --force
  ```

### Stateless vs Stateful Architecture
- **Stateless (Laravel/Nginx):** Your application pod stores nothing on its local hard drive. It can be scaled infinitely or destroyed instantly with zero data loss.
- **Stateful (Postgres/Redis):** These are configured as `StatefulSet` resources with PersistentVolumeClaims (PVCs). They pin their data to a physical drive, ensuring database integrity across pod restarts.
- **Rollout Updates:** Kubernetes uses a `RollingUpdate` strategy, spinning up new pods before killing the old ones to guarantee zero downtime. Because we use `imagePullPolicy: Always`, running `kubectl rollout restart deployment backstage-deployment` guarantees K8s will pull the freshest code from Docker Hub.
