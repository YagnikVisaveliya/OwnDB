# OwnDB 🚀
### Kubernetes-Managed Database Instance Provisioner

OwnDB is a powerful, automated platform designed to simplify the management of PostgreSQL database instances on Kubernetes. It provides a seamless interface to provision, scale, and manage dedicated database environments with enterprise-grade features like horizontal autoscaling, persistent storage, and secure isolation.

---

## ✨ Key Features

- **🚀 Instant Provisioning**: Spin up dedicated PostgreSQL 16 instances in seconds.
- **🛡️ Secure Isolation**: Each database instance runs in its own dedicated Kubernetes Namespace.
- **⚖️ Horizontal Autoscaling**: Automatically scale database replicas based on CPU utilization using Horizontal Pod Autoscaler (HPA).
- **💾 Persistent Storage**: Data is persisted using Kubernetes Persistent Volume Claims (PVC), ensuring data safety across pod restarts.
- **🛠️ Resource Management**: Fine-grained control over CPU and Memory requests and limits.
- **🔒 Automated Security**: Secure credential management via Kubernetes Secrets.
- **🌐 Public Connectivity**: Automatic NodePort assignment for external access to your database.

---

## 🏗️ Technology Stack

### **Frontend**
- **React 19**: Modern UI development with the latest React features.
- **TypeScript**: Type-safe development for better maintainability.
- **Tailwind CSS 4**: Rapid, utility-first styling for a premium look and feel.
- **Vite**: Ultra-fast build tool and development server.

### **Backend**
- **Node.js & Express**: High-performance backend server.
- **TypeScript**: Shared type definitions and robust logic.
- **Kubernetes Client (@kubernetes/client-node)**: Direct programmatic interaction with the Kubernetes API.
- **TSX**: Modern TypeScript execution for rapid development.

### **Infrastructure**
- **Kubernetes**: Container orchestration and management.
- **Minikube**: Local Kubernetes environment support.
- **PostgreSQL**: The world's most advanced open-source relational database.

---

## 📂 Project Structure

```text
OwnDB/
├── BACKEND/                # Node.js Express server
│   ├── src/
│   │   ├── config/         # K8s templates and client configuration
│   │   ├── controller/     # Business logic for instance management
│   │   ├── routes/         # API endpoint definitions
│   │   └── index.ts        # Server entry point
│   └── tsconfig.json
├── FRONTEND/               # React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── App.tsx         # Main application logic
│   │   └── main.tsx        # React entry point
│   └── vite.config.ts
└── README.md               # You are here!
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Minikube](https://minikube.sigs.k8s.io/docs/start/) or a Kubernetes cluster
- [kubectl](https://kubernetes.io/docs/tasks/tools/) configured to access your cluster

### 1. Start your Kubernetes Cluster
If using Minikube:
```bash
minikube start
minikube addons enable metrics-server  # Required for HPA
```

### 2. Setup the Backend
```bash
cd BACKEND
npm install
npm run dev
```
The backend will start on `http://localhost:4000`.

### 3. Setup the Frontend
```bash
cd FRONTEND
npm install
npm run dev
```
The frontend will start on `http://localhost:5173`.

---

## ⚙️ Environment Variables

### Backend (`/BACKEND/.env`)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Port for the backend server | `4000` |
| `DB_NODE_HOST` | Host IP of the K8s node (useful for public clusters) | Auto-detected (Minikube IP) |

### Frontend (`/FRONTEND/.env`)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_URL` | URL of the backend API | `http://localhost:4000` |

---

## 📡 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/instances` | Create a new database instance |
| `GET` | `/instances/all` | List all provisioned instances |
| `GET` | `/instances/:id` | Get details of a specific instance |
| `DELETE` | `/instances/:id` | Delete an instance and its resources |

---

## 🛠️ Architecture Overview

OwnDB follows a modern microservices-ready architecture:
1. **Request**: The user submits a configuration (Resources, Scaling, Credentials) via the React UI.
2. **Orchestration**: The Backend translates this configuration into Kubernetes manifests (Namespace, Secret, PVC, Deployment, Service, HPA).
3. **Deployment**: The Backend uses the `@kubernetes/client-node` to apply these manifests to the cluster.
4. **Networking**: Kubernetes assigns a `NodePort`. The Backend detects this and generates a connection URL.
5. **Monitoring**: The `HorizontalPodAutoscaler` monitors CPU usage and scales the pods between `minReplicas` and `maxReplicas`.

---

## 🔮 Future Roadmap
- [ ] Support for other databases (MySQL, MongoDB, Redis).
- [ ] Persistent Database storage for instance metadata (currently in-memory).
- [ ] User authentication and multi-tenancy.
- [ ] Real-time pod status and log viewing via WebSockets.
- [ ] Backup and Restore functionality.

---

Built with ❤️ for the Kubernetes Ecosystem.