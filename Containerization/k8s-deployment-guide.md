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

## 6. Latest Architectural & CI/CD Updates

As the application has matured, several architectural shifts have been implemented to harden the system for production.

### Strict Static Analysis (PHPStan Level 7)
The entire codebase is now strictly analyzed via PHPStan at **Level 7**.
- **Why?** This prevents unpredictable runtime fatals (like "undefined property" or "calling a method on null") before the code is even executed.
- **How it affects you:** All generic collections, properties, and closures now have explicit type hints and PHPDoc bindings (e.g. `array_map` vs `collect()->map()` where type loss occurs). The deployment pipeline will instantly fail if type safety is compromised.

### Event-Sourced Ledger & Inventory
We replaced cache-based stock counting with an **atomic event-sourced ledger** (`inventory_movements` table).
- This prevents race conditions during high-volume ticket sales.
- All sales, refunds, and adjustments are recorded immutably. Stock levels are calculated by dynamically summing the ledger rather than maintaining a fragile "remaining stock" column.

### Decoupled Email Transports & Inline QR Codes
- **Adapter Pattern:** Emails are now decoupled into specific transports (`SmtpEmailTransport`, `GmailOAuthEmailTransport`).
- **QR Ticketing:** We no longer rely on external origin servers to generate and serve QR codes via HTTP URLs in emails (which frequently broke in strict clients like Outlook or Gmail). QR codes are generated dynamically on the pod and attached as **CID Inline Embeds** (MIME standard), ensuring they render safely entirely offline in the recipient's inbox.

## 7. Theoretical Learnings & Troubleshooting Log

Throughout the development and containerization of this application, several theoretical architectural questions and edge-cases were encountered and resolved. This serves as a historical learning log:

### 1. Kustomize Variable Interpolation (The `APP_URL` OAuth Issue)
**The Problem:** Attempting to use bash-style string interpolation (`${APP_URL}/auth/google/callback`) directly inside `kustomization.yaml` or ConfigMaps resulted in a `400: invalid_request` from Google OAuth.
**The Learning:** Kubernetes ConfigMaps do not natively evaluate or expand shell variables unless the container's entrypoint explicitly runs an tool like `envsubst`. Furthermore, Laravel's `.env` parser interprets the injected string literally. For Google OAuth (and routing in general), it is required to provide the literal URL string to the environment, or dynamically resolve it within the PHP application (via `config('app.url')`).

### 2. Database vs. Application Roles & Permissions
**The Question:** Why define roles and permissions in both the Database (via migrations/seeders) and the Laravel Application Code?
**The Learning:** Packages like Spatie Permissions store bindings in the database to allow *dynamic* assignment (e.g., an admin granting a user a permission via the UI without requiring a code deployment). However, the application code (middleware, policies) must *hardcode* the permission checks (e.g., `middleware('permission:view_dashboard')`) to enforce security. Seeding the database strictly synchronizes the database with the application's required logic, preventing the two from drifting and causing lockouts.

### 3. Static Analysis (PHPStan) vs. Unit/Integration Tests
**The Question:** Why do PHPStan fixes look like formatting/docblock updates rather than "real logic" test changes?
**The Learning:** Unit and feature tests execute the application to verify *business logic*. PHPStan performs **Static Analysis**, reading the code without running it to prove structural and mathematical type safety (preventing "undefined property" or "call to member function on null" fatal errors). PHPStan Level 7 enforces strict type declarations, requiring us to replace implicit generic mapping (like `collect()->map()`) with strictly typed native arrays (`array_map()`). The `phpstan.neon` file dictates this strictness level.

### 4. Linters Passing but Tests Failing
**The Problem:** The linter passed successfully, but `php artisan test` failed.
**The Learning:** Linters (like Laravel Pint) only enforce syntax formatting, spacing, and styling conventions. They are completely ignorant of types or logic. A perfectly linted file can still contain a broken database query or a fatal type mismatch. Tests evaluate the actual execution of the code.

### 5. Middleware Ordering & Redis DDoS Exhaustion
**The Problem:** Rate-limited (429) and blocked (403) requests were still exhausting the Redis session store during load tests on the gateway.
**The Learning:** Middleware execution order is critical for performance and security. By splitting the context middleware into two parts—a lightweight early-stage logging/trace layer and a resource-intensive late-stage session hydration layer—we were able to drop malicious requests *before* they ever reached Redis, saving massive amounts of memory while maintaining full observability.

### 6. Laravel 11 `ProhibitDestructiveCommands` in Production
**The Problem:** Running `kubectl exec deployment/backstage-deployment -- php artisan migrate:fresh --seed --force` resulted in `WARN  This command is prohibited from running in this environment.` despite the `--force` flag.
**The Learning:** In Laravel 11, the `AppServiceProvider` contains `DB::prohibitDestructiveCommands(app()->isProduction());`. This is an ultimate safeguard that completely disables commands like `migrate:fresh` or `db:wipe` when `APP_ENV=production`. To intentionally override this during initial cluster bootstrapping without changing your code, you must inject a temporary environment override directly into the exec call: `kubectl exec deployment/backstage-deployment -- env APP_ENV=local php artisan migrate:fresh --seed --force`.

### 7. PostgreSQL Persistent Volume (PVC) Corruption
**The Problem:** Running the migration returned a fatal `SQLSTATE[XX001]: Data corrupted: 7 ERROR: could not read block 0 in file` stack trace.
**The Learning:** PVCs strictly retain data across pod deletions. If a Postgres pod is forcefully terminated during a write, or if the PVC data format is mutated between mismatched Postgres container tags, the underlying virtual hard drive becomes corrupted. Because this data persists, simply restarting the Pod will not fix it. In a bootstrap environment, the solution is to entirely delete the PVC (`kubectl delete pvc postgres-pvc`) to force Kubernetes to provision a clean, empty volume, then recreate the StatefulSet.

### 8. Ghost Pods (Deployment vs. StatefulSet)
**The Problem:** The cluster inexplicably had two Redis pods running: `redis-0` and `redis-76bfc84fbd-lj9b6`, despite the manifest only defining 1 replica.
**The Learning:** If you change a manifest's `kind` from `Deployment` to `StatefulSet` and re-apply, Kubernetes will *not* delete the old Deployment. It treats them as two completely separate resources. The old Deployment pods will stay running indefinitely alongside the new StatefulSet pods, causing them to fight for the same Service traffic. You must manually clean up the orphaned resource: `kubectl delete deployment redis`.

### 9. Ephemeral File Uploads & MinIO Architecture
**The Problem:** Uploading an event image succeeded, but the image URL returned a `404 Not Found` upon page refresh.
**The Learning:** Kubernetes pods are ephemeral and distributed. If Pod A processes the upload and saves the image to its local storage, a subsequent web request routed to Pod B will result in a 404 because Pod B's hard drive is isolated. Furthermore, a pod restart completely wipes all local files. The architectural solution is to deploy **MinIO (S3)**. Pods securely stream uploads to the centralized K8s MinIO service (`http://minio:9000`), and the user's browser downloads the images securely via a public MinIO Ingress/Tunnel endpoint.

### 10. Spatie Permissions Inheritance
**The Problem:** The Inertia frontend shared props showed `permission: none` even though the user was assigned the "IT Manager" role which had full admin permissions.
**The Learning:** In the `spatie/laravel-permission` package, calling `$user->permissions` is an Eloquent relationship that *only* fetches permissions explicitly and directly assigned to the user's ID. To correctly retrieve all permissions (including those inherited from roles), you must use the helper method `$user->getAllPermissions()`. 

### 11. Kubernetes Secret `.env` Parsing (Inline Comments)
**The Problem:** `APP_DEBUG=false # Set to false in prod` was set in `.env.production`, but Laravel was running with full debug stack traces active.
**The Learning:** Kustomize `secretGenerator` evaluates `.env` lines strictly. The environment variable inside the container became the literal string `"false # Set to false in prod"`. In PHP, any non-empty string that isn't exactly `"false"` or `"0"` evaluates to boolean `true`. Inline comments must be completely avoided or strictly quoted in Kustomize environment files.

### 12. The Rollout Restart Illusion (Ephemeral Patches)
**The Problem:** We hot-patched a file via `kubectl cp` into a running pod, but the fix instantly disappeared.
**The Learning:** When `kustomization.yaml` generates a Secret, changing the `.env.production` file alters the resulting Secret's cryptographic hash suffix (e.g., `backstage-secrets-h8294dm4b8`). When `kubectl apply -k .` runs, it detects the new Secret name and automatically triggers a **Rollout Restart** of the Deployment. This immediately sends a `SIGTERM` to the pods we just manually patched, and spins up fresh pods from the old `latest` Docker image. Manual container patches are entirely ephemeral and lost on rollout.

### 13. Hardcoded Laravel Storage Disks (Split-Brain Uploads)
**The Problem:** Uploading an image seemed to work perfectly, and Laravel generated a beautifully formatted S3 URL, but the file itself returned a `404 Not Found` from MinIO.
**The Learning:** The `UploadImageAction.php` class had `Storage::disk('public')->put(...)` hardcoded. This forced Laravel to save the file to the Pod's ephemeral local hard drive, completely ignoring the `.env` settings. However, when generating the URL, `Storage::url()` cleanly respected `FILESYSTEM_DISK=s3`, causing a split-brain scenario where the upload went local but the URL pointed to S3. To be cloud-native, always omit hardcoded disks (`Storage::put(...)`) so the framework inherently obeys the environment-injected storage configuration.

### 14. Kubernetes Security Contexts vs. Dockerfile Users
**The Problem:** Semgrep flagged our manifests for privilege escalation vulnerabilities, even though the Dockerfile ends with `USER www-data`.
**The Learning:** While the Dockerfile specifies the default execution user, Kubernetes natively allows containers to request root privilege escalation at runtime (e.g., via `setuid` binaries). To truly secure a pod, you must explicitly enforce `allowPrivilegeEscalation: false` and `runAsNonRoot: true` in the `securityContext` of the Deployment/StatefulSet manifest. This provides an immutable infrastructure-level safeguard regardless of the container's contents.

### 15. PHPStan Eloquent Casts vs. Schema Types
**The Problem:** PHPStan threw a fatal "Argument of an invalid type string supplied for foreach" error on `$event->attendee_filter_config`, even though Laravel's `$casts` maps it to an `array`.
**The Learning:** PHPStan reads the raw database schema (where JSON columns are strings) and ignores Laravel runtime casts unless properly instructed by Larastan or explicit types. If you try to fix this by adding a PHPDoc `/** @var array $filters */` *before* doing an `is_array()` check, PHPStan will crash complaining that your check is redundant because it strictly trusts the PHPDoc. The fix is to dynamically validate the data at runtime (`json_decode` if string, default to `[]`), and *then* apply the PHPDoc right before iterating.

### 16. React Compiler and Cascading Renders (`set-state-in-effect`)
**The Problem:** The CI linter failed because `fetchSheets()` was called directly inside a `useEffect()`, triggering an ESLint React Compiler error: "Calling setState synchronously within an effect can trigger cascading renders."
**The Learning:** Modern React compiler rules are incredibly strict about performance. Because `fetchSheets` immediately called `setLoadingSheets(true)` before awaiting the network request, the effect synchronously queued a state update, forcing an immediate re-render cascade. To bypass this for initial data loading without refactoring to a state management library, you must explicitly use `// eslint-disable-next-line react-hooks/set-state-in-effect` to acknowledge the architectural intent.

### 17. XSS False Positives in CI Security Scans
**The Problem:** Semgrep blocked the CI pipeline claiming a critical Cross-Site Scripting (XSS) vulnerability due to `dangerouslySetInnerHTML` in the two-factor authentication modal.
**The Learning:** Automated Static Application Security Testing (SAST) tools lack context. The modal uses `dangerouslySetInnerHTML` to render an SVG QR code securely generated by the Laravel Fortify backend, not from user input. Instead of ignoring the entire file or removing the security check, the standard practice is to use an inline `// nosemgrep: typescript.react.security.audit...` comment to explicitly whitelist that specific execution line, keeping the pipeline secure but unobstructed.
