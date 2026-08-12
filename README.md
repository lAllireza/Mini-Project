## 🚀 Getting Started

### Prerequisites

Before running the project, make sure the following software is installed:

- Docker
- Docker Compose
- Git

### 1. Clone the repository

```bash
git clone <repository-url>
cd <project-directory>
```

### 2. Create the environment file

Copy the example environment file:

```bash
cp .env.example .env
```

Open the `.env` file and update the values according to your environment.

Example:

```env
DB_HOST=postgres
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=YourPassword
```

### 3. Build and start the containers

```bash
docker compose up --build
```

Or run them in the background:

```bash
docker compose up -d --build
```

### 4. Check container status

```bash
docker compose ps
```

### 5. Access the application

Open your browser and visit:

```
http://localhost:8080
```