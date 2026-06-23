# Backstage Platform Overview

Backstage is an all-inclusive operational and resource management platform. It is engineered to natively bridge the core features organizations typically assemble via fragmented, subscription-heavy ERPs or CRMs (such as Odoo). By offering these capabilities within a single integrated environment, Backstage drastically reduces operational complexity and scaling costs.

## Core Capabilities

| Capability | Description |
|---|---|
| **Inventory Ledger** | Centralized, event-sourced tracking for products, variants, and event capacities. |
| **Dual Payment Architecture** | Supports an omnichannel model: physical Point of Sale (POS) environments via "Office Shifts", alongside a headless backend capable of processing transactions from independent external storefronts. |
| **Access & Security** | Strict Role-Based Access Control (RBAC), Two-Factor Authentication (2FA), and secure identity management. |
| **Email & Communications** | Integrated OAuth-based email transport (e.g., Gmail) with dynamic templating and automated delivery. |
| **Event Ticketing** | End-to-end QR code ticket provisioning, distribution, and real-time scanning validation. |
| **External Integrations** | Native synchronization with external data sources like Google Sheets for downstream reporting. |

## Technology Stack

The platform prioritizes strict type-safety, modular architecture, and modern ecosystem tooling.

| Layer | Technology | Function |
|---|---|---|
| **Frontend** | React 19, TailwindCSS v4 | Interface layer utilizing modern hooks and strict utility styling. |
| **Routing & State** | Inertia.js v3 | Connects React directly to the Laravel backend, providing an SPA experience without an API layer. |
| **Backend** | Laravel 11 (PHP 8.3) | Domain logic, robust Eloquent ORM, background job queues, and API handling. |
| **Primary Datastore** | PostgreSQL 15 | Enforces relational data integrity, JSON column filtering, and transaction safety. |
| **Cache & Session** | Redis 7 | High-performance memory store handling sessions, rate-limiting, and job queue dispatching. |
| **Object Storage** | MinIO | S3-compatible object storage isolating file uploads (like images) from the application container. |
| **Quality Assurance** | PHPStan, Pest PHP | Enforces Level 7 static analysis mathematically proving type safety before runtime. |

## DevSecOps & Infrastructure

Backstage operates on a cloud-native architecture, built from the ground up for containerized orchestration and immutable deployments.

### 1. Dockerization
*   **Multi-Stage Builds:** The build pipeline separates Composer/NPM dependency compilation from the final production runtime to minimize the image footprint.
*   **Cross-Compilation:** Automated GitHub Actions leverage QEMU to continuously build and push multi-architecture Docker images (`linux/amd64` and `linux/arm64`).
*   **Reduced Attack Surface:** The final production image utilizes an Alpine Linux base and enforces the `www-data` user to ensure no code runs as `root`.

### 2. Kubernetes Deployment (K8s)
*   **Decentralized State:** The application is entirely stateless. Sessions are shipped to Redis, persistent data to PostgreSQL, and file uploads to MinIO. This solves the "split-brain" problem and allows the application layer to scale horizontally.
*   **Resource Allocation:** Every StatefulSet and Deployment explicitly defines CPU and Memory `requests` and `limits`, preventing memory leaks from causing cluster-wide outages (noisy neighbor protection).
*   **Health Observability:** Strict `livenessProbe` and `readinessProbe` HTTP/TCP checks allow Kubernetes to monitor process deadlocks and automatically restart unhealthy pods.
*   **Secrets Management:** Manifests are deployed via Kustomize, which securely reads environment variables from `.env.production` and maps them directly into the cluster as opaque `Secret` objects.

### 3. Continuous Integration
*   **SAST Analysis:** Semgrep scans every pull request to detect logic vulnerabilities and cross-site scripting (XSS) risks before they merge.
*   **Vulnerability Scanning:** Trivy analyzes the compiled Docker images for vulnerable CVE dependencies inside the OS layers.
