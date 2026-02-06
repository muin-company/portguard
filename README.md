# portguard 🔒

Monitor and manage localhost ports. Kill zombie processes. Prevent port conflicts.

## Install

```bash
npm install -g @muin/portguard
```

Or use without installing:

```bash
npx @muin/portguard
```

## Usage

### List all active ports

```bash
portguard
```

Shows all processes listening on localhost ports.

### Check specific port

```bash
portguard 3000
```

See what's running on port 3000.

### Scan port range

```bash
portguard --range 3000-4000
```

Scan a range of ports to see which are in use and which are free.

```bash
portguard -r 8000-8100
```

Short form also works.

### Kill process on port

```bash
portguard kill 3000
```

Kill the process using port 3000. Asks for confirmation.

Skip confirmation:

```bash
portguard kill 3000 -y
```

Force kill (SIGKILL):

```bash
portguard kill 3000 -f
```

### Watch mode

```bash
portguard watch
```

Continuously monitor ports. Refreshes every 3 seconds. Press Ctrl+C to stop.

Custom interval:

```bash
portguard watch -i 5
```

### Clean zombies

```bash
portguard clean
```

Find and kill common zombie processes (node, python, ruby, java, deno).

## Examples

### Example 1: Quick Port Check - "What's Using My Port?"

**Scenario:** You try to start your dev server but get "EADDRINUSE: address already in use :::3000"

```bash
$ portguard 3000

🔍 Checking port 3000...

PORT       PID        PROCESS              ADDRESS          UPTIME
3000       45231      node                 *:3000           2h 15m

Process details:
  Command: node /Users/mj/old-project/index.js
  Started: 2 hours ago
  
💡 Tip: Run 'portguard kill 3000' to free this port
```

**Action:** Ah, forgot to close old project!

```bash
$ portguard kill 3000 -y

✓ Killed process 45231 (node) on port 3000

$ npm run dev
> Server started on http://localhost:3000 ✓
```

---

### Example 2: List All Active Localhost Ports

**Scenario:** Clean up at end of day — what dev servers did I leave running?

```bash
$ portguard

🔒 Active Ports:

PORT       PID        PROCESS              ADDRESS          UPTIME
3000       45231      node                 *:3000           2h 15m
5000       45892      python3              127.0.0.1:5000   45m
5432       2341       postgres             127.0.0.1:5432   5d 3h
8080       46123      node                 *:8080           1h 30m
9000       46201      ruby                 127.0.0.1:9000   15m

📊 Total: 5 active ports

💡 Dev servers: 3000, 5000, 8080, 9000 (safe to kill)
   Databases: 5432 (keep running)
```

**Action:** Kill dev servers, keep database running.

```bash
$ portguard kill 3000 -y
$ portguard kill 5000 -y
$ portguard kill 8080 -y
$ portguard kill 9000 -y

✓ Cleaned up 4 dev servers. Postgres still running.
```

---

### Example 3: Zombie Process Cleanup

**Scenario:** After a hard crash, multiple Node processes are stuck in background.

```bash
$ npm run dev
Error: EADDRINUSE: address already in use :::3000

$ portguard 3000
🔍 Port 3000: No process found

$ portguard

🔒 Active Ports:

PORT       PID        PROCESS              ADDRESS
3001       98123      node                 *:3001           (zombie)
3002       98124      node                 *:3002           (zombie)
3003       98125      node                 *:3003           (zombie)

⚠️  3 zombie processes detected!
```

**Solution:** Clean all zombies at once.

```bash
$ portguard clean

🧹 Scanning for zombie processes...

Found zombies:
  ⚠️  PID 98123 - node (port 3001) - idle 2h
  ⚠️  PID 98124 - node (port 3002) - idle 2h
  ⚠️  PID 98125 - node (port 3003) - idle 2h

Kill all zombies? [y/N]: y

✓ Killed 3 zombie processes
✓ Ports cleaned: 3001, 3002, 3003

$ npm run dev
> Server started on http://localhost:3000 ✓
```

---

### Example 4: Watch Mode for Debugging Race Conditions

**Scenario:** Debugging intermittent "port in use" errors during CI tests.

```bash
$ portguard watch -i 1

🔒 Watching ports (refreshes every 1s)...

[14:30:01]
PORT       PID        PROCESS              ADDRESS
5000       12341      node                 *:5000

[14:30:02]
PORT       PID        PROCESS              ADDRESS
5000       12341      node                 *:5000
5001       12389      node                 *:5001           NEW!

[14:30:03]
PORT       PID        PROCESS              ADDRESS
5000       12341      node                 *:5000
5001       12389      node                 *:5001
5002       12423      node                 *:5002           NEW!

⚠️  Port leak detected: Multiple node processes spawning rapidly!

[Ctrl+C to stop]
```

**Discovery:** Tests are leaking dev servers — each test spawns a new one without cleanup!

**Fix:** Update test teardown to properly close servers.

---

### Example 5: Dealing with System Services (Elevated Permissions)

**Scenario:** Need to free port 80 for local testing, but it's used by system service.

```bash
$ portguard 80

🔍 Checking port 80...

PORT       PID        PROCESS              ADDRESS          USER
80         812        httpd                *:80             root

⚠️  This process is owned by root (system service)

$ portguard kill 80
❌ Error: Permission denied

💡 This is a system process. Kill with elevated privileges:

   macOS/Linux:
     sudo portguard kill 80

   Windows:
     Run terminal as Administrator, then:
     portguard kill 80
```

**Solution:**

```bash
$ sudo portguard kill 80
Password: ********

⚠️  WARNING: Killing system process 'httpd' (PID 812)
    This may affect other services.

Continue? [y/N]: y

✓ Killed process 812 (httpd) on port 80

💡 To restart Apache later:
   sudo apachectl start
```

---

### Example 6: Finding Free Ports in a Range

**Scenario:** Need to start multiple microservices but not sure which ports are available.

```bash
$ portguard --range 3000-3010

📊 Port Range 3000-3010 Analysis:

  Range:       3000 - 3010
  Total ports: 11
  Free ports:  7
  Used ports:  4

🔒 Active Ports in Range:

PORT       PID        PROCESS              ADDRESS
3000       45231      node                 *:3000
3003       45892      python3              127.0.0.1:3003
3007       46123      node                 *:3007
3009       46201      ruby                 127.0.0.1:3009

💡 Free ports: 3001, 3002, 3004, 3005, 3006, 3008, 3010
```

**Action:** Perfect! Use free ports for new services.

```bash
# Start services on free ports
$ PORT=3001 npm run api-service &
$ PORT=3002 npm run auth-service &
$ PORT=3004 npm run notification-service &

✓ All services started successfully
```

**Wide Range Scan:**

```bash
$ portguard -r 8000-8100

📊 Port Range 8000-8100 Analysis:

  Range:       8000 - 8100
  Total ports: 101
  Free ports:  98
  Used ports:  3

🔒 Active Ports in Range:

PORT       PID        PROCESS              ADDRESS
8000       12341      node                 *:8000
8080       12389      node                 *:8080
8081       12423      nginx                127.0.0.1:8081

✓ 98 free ports available in this range
```

---

### Example 7: Port Conflict in Docker Development

**Scenario:** Docker container won't start — host port is in use.

```bash
$ docker-compose up
ERROR: for db  Cannot start service db: driver failed programming external connectivity: 
       Bind for 0.0.0.0:5432 failed: port is already allocated

$ portguard 5432

🔍 Checking port 5432...

PORT       PID        PROCESS              ADDRESS          UPTIME
5432       2341       postgres             127.0.0.1:5432   5d 3h

Process details:
  Local Postgres installation (Homebrew)
  
💡 Options:
  1. Kill local Postgres:  portguard kill 5432 -y
  2. Change Docker port:   5433:5432 in docker-compose.yml
  3. Stop Homebrew Postgres: brew services stop postgresql
```

**Fix Option 1:** Kill local Postgres, use Docker instead.

```bash
$ portguard kill 5432 -y
✓ Killed local Postgres (PID 2341)

$ docker-compose up
Creating db ... done
✓ Container 'db' started on port 5432
```

**Fix Option 2:** Keep local Postgres, change Docker port.

```yaml
# docker-compose.yml
services:
  db:
    ports:
      - "5433:5432"  # Map to different host port
```

```bash
$ docker-compose up
Creating db ... done
✓ Container 'db' started on port 5433

💡 Connect with: postgresql://localhost:5433/mydb
```

---

## Advanced Usage Examples

### Example 7: Team Development Port Standards

**Scenario:** Establish team-wide port conventions to avoid conflicts.

```bash
# team-ports.md - Document standard ports
# 3000: Frontend (React/Vue)
# 3001: Frontend (Storybook)
# 4000: Backend API (Node/Express)
# 5000: Backend API (Python/Flask)
# 5432: PostgreSQL
# 6379: Redis
# 8080: Microservice A
# 8081: Microservice B
# 9000: Admin dashboard

# Before starting work, check your assigned ports:
$ portguard

🔒 Active Ports:

PORT       PID        PROCESS              ADDRESS          UPTIME
3000       45231      node                 *:3000           2h 15m
5432       2341       postgres             127.0.0.1:5432   5d 3h

💡 Available for my work:
   ✅ 4000 (Backend API) - free
   ✅ 8080 (Microservice A) - free
   ❌ 3000 (Frontend) - in use by teammate

# Clean up before switching projects:
$ portguard kill 3000 -y
$ portguard kill 4000 -y

✓ Freed up ports for next project
```

**Create a team helper script:**

```bash
#!/bin/bash
# team-setup.sh - Check if standard ports are available

echo "🔍 Checking team port availability..."

REQUIRED_PORTS=(3000 4000 5432 6379)
BLOCKED=()

for port in "${REQUIRED_PORTS[@]}"; do
  if portguard $port > /dev/null 2>&1; then
    BLOCKED+=($port)
  fi
done

if [ ${#BLOCKED[@]} -eq 0 ]; then
  echo "✅ All required ports available!"
  exit 0
else
  echo "❌ Ports in use: ${BLOCKED[*]}"
  echo ""
  echo "Run: portguard kill ${BLOCKED[0]} -y"
  exit 1
fi
```

---

### Example 8: CI/CD Port Cleanup Before Tests

**Scenario:** Clean up ports before running integration tests in CI to prevent flaky tests.

```yaml
# .github/workflows/test.yml
name: Integration Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install portguard
        run: npm install -g @muin/portguard
      
      - name: Clean up test ports
        run: |
          echo "🧹 Cleaning up ports before tests..."
          
          # Kill any processes on test ports
          for port in 3000 5432 6379 8080; do
            if portguard $port > /dev/null 2>&1; then
              echo "Killing process on port $port"
              portguard kill $port -y -f || true
            fi
          done
          
          echo "✅ Test ports cleaned"
      
      - name: Start services
        run: docker-compose up -d
      
      - name: Wait for services
        run: |
          echo "⏳ Waiting for services to be ready..."
          npx wait-on http://localhost:3000 http://localhost:8080
      
      - name: Run integration tests
        run: npm test
      
      - name: Cleanup after tests
        if: always()
        run: |
          echo "🧹 Post-test cleanup..."
          portguard clean -y || true
          docker-compose down -v
```

---

### Example 9: Monitoring Port Usage Patterns

**Scenario:** Track which ports are used most frequently to optimize development workflow.

```bash
#!/bin/bash
# port-monitor.sh - Log port usage over time

LOG_FILE="$HOME/.port-usage.log"

while true; do
  timestamp=$(date +"%Y-%m-%d %H:%M:%S")
  
  # Get active ports
  ports=$(portguard --json 2>/dev/null | jq -r '.ports[].port' | sort -n)
  
  # Log each active port
  for port in $ports; do
    echo "$timestamp,$port" >> "$LOG_FILE"
  done
  
  sleep 300  # Log every 5 minutes
done

# Analyze usage patterns:
$ cat ~/.port-usage.log | cut -d, -f2 | sort | uniq -c | sort -rn

# Output:
# 145 3000  ← Most used port (frontend dev)
#  89 5432  ← Database always running
#  67 8080  ← Backend API
#  23 9000  ← Occasional admin work
```

**Generate usage report:**

```bash
#!/bin/bash
# port-usage-report.sh

echo "📊 Port Usage Report (Last 7 Days)"
echo "=================================="

# Most active ports
echo ""
echo "Most Used Ports:"
cat ~/.port-usage.log | \
  awk -F',' -v week_ago="$(date -v-7d +%Y-%m-%d)" '$1 >= week_ago' | \
  cut -d, -f2 | sort | uniq -c | sort -rn | head -5

# Peak usage times
echo ""
echo "Peak Usage Hours:"
cat ~/.port-usage.log | \
  awk -F',' -v week_ago="$(date -v-7d +%Y-%m-%d)" '$1 >= week_ago' | \
  cut -d' ' -f2 | cut -d: -f1 | sort | uniq -c | sort -rn | head -5
```

---

### Example 10: Pre-commit Hook (Prevent Committing with Dev Servers Running)

**Scenario:** Accidentally committing while servers are running can cause issues. Check before commit.

```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "🔍 Checking for running dev servers..."

# Check for common dev server ports
DEV_PORTS=(3000 3001 4000 5000 8000 8080)
RUNNING=()

for port in "${DEV_PORTS[@]}"; do
  if portguard $port > /dev/null 2>&1; then
    RUNNING+=($port)
  fi
done

if [ ${#RUNNING[@]} -gt 0 ]; then
  echo ""
  echo "⚠️  WARNING: Dev servers are still running on ports: ${RUNNING[*]}"
  echo ""
  portguard
  echo ""
  echo "This might cause issues if you're committing config changes."
  echo "Stop servers before committing? (Recommended)"
  echo ""
  read -p "Stop dev servers and continue commit? (y/N): " -n 1 -r
  echo
  
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    for port in "${RUNNING[@]}"; do
      echo "Stopping server on port $port..."
      portguard kill $port -y
    done
    echo "✅ Servers stopped, proceeding with commit"
  else
    echo "ℹ️  Commit cancelled. Stop servers manually and try again."
    exit 1
  fi
fi

echo "✅ No dev servers running, proceeding with commit"
exit 0
```

---

### Example 11: Development Environment Switcher

**Scenario:** Quickly switch between different project environments.

```bash
#!/bin/bash
# switch-project.sh - Stop current project, start new one

PROJECT=$1

if [ -z "$PROJECT" ]; then
  echo "Usage: ./switch-project.sh <project-name>"
  echo "Available: frontend | backend | fullstack | mobile"
  exit 1
fi

echo "🔄 Switching to $PROJECT..."

# 1. Stop all dev servers
echo "Stopping current dev servers..."
portguard clean -y > /dev/null 2>&1

# 2. Navigate to project and start services
case $PROJECT in
  frontend)
    cd ~/projects/frontend
    echo "Starting frontend on port 3000..."
    npm run dev &
    ;;
  backend)
    cd ~/projects/backend
    echo "Starting backend on port 4000..."
    npm run dev &
    ;;
  fullstack)
    cd ~/projects/fullstack
    echo "Starting frontend (3000) and backend (4000)..."
    npm run dev:frontend &
    npm run dev:backend &
    ;;
  mobile)
    cd ~/projects/mobile-app
    echo "Starting Expo on port 19000..."
    npx expo start &
    ;;
  *)
    echo "❌ Unknown project: $PROJECT"
    exit 1
    ;;
esac

sleep 3
echo ""
echo "✅ $PROJECT is now running:"
portguard
```

---

### Example 12: Multi-Tenant Development (Multiple Project Instances)

**Scenario:** Running multiple instances of the same app for different clients.

```bash
# Start client-specific instances on different ports
$ CLIENT=acme PORT=3000 npm run dev &
$ CLIENT=globex PORT=3001 npm run dev &
$ CLIENT=stark PORT=3002 npm run dev &

# Check which client is on which port
$ portguard

🔒 Active Ports:

PORT       PID        PROCESS              ADDRESS          ENV
3000       45231      node                 *:3000           CLIENT=acme
3001       45892      node                 *:3001           CLIENT=globex
3002       46123      node                 *:3002           CLIENT=stark

# Create a helper to manage them:

#!/bin/bash
# client-manager.sh

case $1 in
  start)
    CLIENT=$2
    PORT=$3
    echo "Starting $CLIENT on port $PORT..."
    CLIENT=$CLIENT PORT=$PORT npm run dev &
    ;;
  
  stop)
    CLIENT=$2
    # Find port for client, kill it
    # (would need to track client-port mapping)
    echo "Stopping $CLIENT..."
    ;;
  
  list)
    echo "Active client instances:"
    portguard | grep node
    ;;
  
  *)
    echo "Usage: ./client-manager.sh {start|stop|list} [client] [port]"
    ;;
esac
```

---

### Example 13: Development vs Production Port Conflict Prevention

**Scenario:** Prevent accidentally connecting dev app to production database.

```bash
#!/bin/bash
# safe-start.sh - Check environment before starting

echo "🔍 Pre-flight checks..."

# Check if production DB port is accessible
if nc -z localhost 5432 2>/dev/null; then
  echo "⚠️  WARNING: Port 5432 (PostgreSQL) is accessible"
  echo ""
  
  # Check if it's production DB
  DB_NAME=$(PGPASSWORD=dev psql -h localhost -U postgres -t -c "SELECT current_database()")
  
  if [[ "$DB_NAME" == *"prod"* ]]; then
    echo "🚨 DANGER: Production database detected!"
    echo "Database: $DB_NAME"
    echo ""
    echo "This would connect your dev app to PRODUCTION database!"
    echo "Aborting for safety."
    exit 1
  else
    echo "✅ Local dev database detected ($DB_NAME)"
  fi
fi

# Check if any production ports are open
PROD_PORTS=(443 8443 5433)  # Production DB, HTTPS, etc.
OPEN_PROD_PORTS=()

for port in "${PROD_PORTS[@]}"; do
  if nc -z localhost $port 2>/dev/null; then
    OPEN_PROD_PORTS+=($port)
  fi
done

if [ ${#OPEN_PROD_PORTS[@]} -gt 0 ]; then
  echo "⚠️  WARNING: Production ports are accessible: ${OPEN_PROD_PORTS[*]}"
  echo "Are you sure you want to start dev server?"
  read -p "Continue? (y/N): " -n 1 -r
  echo
  
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborting."
    exit 1
  fi
fi

echo "✅ All checks passed, starting dev server..."
npm run dev
```

---

### Example 14: Port Conflict Auto-Resolution

**Scenario:** Automatically find and use next available port if preferred port is taken.

```javascript
// auto-port.js - Smart port allocation for Node.js apps

const net = require('net');

async function findAvailablePort(startPort = 3000, maxAttempts = 10) {
  for (let port = startPort; port < startPort + maxAttempts; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available ports found in range ${startPort}-${startPort + maxAttempts}`);
}

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    
    server.listen(port);
  });
}

// Usage in Express app:
const express = require('express');
const app = express();

findAvailablePort(3000)
  .then(port => {
    app.listen(port, () => {
      if (port !== 3000) {
        console.log(`⚠️  Port 3000 was taken, using port ${port} instead`);
        console.log(`💡 Tip: Run 'portguard kill 3000' to free up your preferred port`);
      } else {
        console.log(`✅ Server running on port ${port}`);
      }
    });
  })
  .catch(err => {
    console.error('❌ Could not find available port:', err.message);
    console.log('💡 Run: portguard clean');
    process.exit(1);
  });
```

---

## Kubernetes Integration Examples

### Example 15: Debugging Kubernetes Port Conflicts

**Scenario:** Pod won't start due to port conflict on node.

```bash
# Pod keeps crashing with "address already in use"
$ kubectl logs my-app-7d9f8b-xk2m

Error: listen EADDRINUSE: address already in use :::8080
    at Server.setupListenHandle [as _listen2] (net.js:1318:16)

# Check which process is using port 8080 on the node
$ kubectl get pods -o wide
NAME                     READY   STATUS    NODE
my-app-7d9f8b-xk2m       0/1     CrashLoop node-1

# SSH into the node
$ kubectl debug node/node-1 -it --image=ubuntu

# In the debug container
root@node-1:/# apt-get update && apt-get install -y lsof
root@node-1:/# lsof -i :8080

COMMAND   PID     USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
node      12345   root   19u  IPv6  54321      0t0  TCP *:8080 (LISTEN)

# This is a zombie process from a previous deployment!

# Kill it
root@node-1:/# kill 12345

# Or use portguard if installed on node
root@node-1:/# portguard kill 8080 -y

✓ Killed process 12345 on port 8080

# Exit debug container, pod should now start successfully
```

**Prevention - Use unique ports per deployment:**

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  template:
    spec:
      containers:
      - name: app
        image: myapp:latest
        ports:
        - containerPort: 8080
          name: http
        env:
        - name: PORT
          value: "8080"
        # Add process cleanup on shutdown
        lifecycle:
          preStop:
            exec:
              command: ["/bin/sh", "-c", "sleep 5"]  # Grace period
```

---

### Example 16: Kubernetes NodePort Service Conflicts

**Scenario:** NodePort service fails to bind on some nodes.

```bash
$ kubectl get svc my-service
NAME         TYPE       CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
my-service   NodePort   10.96.52.134    <none>        8080:30080/TCP   5m

# Service created but some nodes can't bind to 30080
$ kubectl get events | grep -i port

Warning: FailedToAllocateNodePort: Port 30080 is already in use on node-2

# Check which service is using the NodePort
$ kubectl get svc --all-namespaces -o json | \
  jq -r '.items[] | select(.spec.type=="NodePort") | "\(.metadata.namespace)/\(.metadata.name): \(.spec.ports[].nodePort)"'

default/my-service: 30080
monitoring/prometheus: 30080  ← Conflict!

# Solution 1: Let Kubernetes assign port automatically
$ kubectl delete svc my-service
$ kubectl apply -f - <<EOF
apiVersion: v1
kind: Service
metadata:
  name: my-service
spec:
  type: NodePort
  selector:
    app: my-app
  ports:
  - port: 8080
    targetPort: 8080
    # nodePort: 30080  ← Remove this, let K8s assign
EOF

# Solution 2: Use specific port range
# Check available NodePort range:
$ kubectl cluster-info dump | grep -i service-node-port-range
    - --service-node-port-range=30000-32767

# Find free port in range:
for port in {30000..30100}; do
  if ! kubectl get svc --all-namespaces -o json | jq -e ".items[].spec.ports[]? | select(.nodePort==$port)" > /dev/null; then
    echo "Port $port is free"
    break
  fi
done
```

---

### Example 17: Kubernetes Sidecar Port Conflicts

**Scenario:** Multiple containers in pod competing for same port.

```bash
$ kubectl describe pod my-app-pod

Events:
  Warning  FailedPostStartHook  Container 'sidecar' failed to start: port 8080 already bound

# The main container and sidecar both try to use port 8080!
```

**Fix - Proper port allocation:**

```yaml
# pod.yaml
apiVersion: v1
kind: Pod
metadata:
  name: my-app-pod
spec:
  containers:
  # Main application
  - name: app
    image: myapp:latest
    ports:
    - containerPort: 8080
      name: http
      protocol: TCP
    env:
    - name: PORT
      value: "8080"
  
  # Sidecar (logging, metrics, etc.)
  - name: sidecar
    image: fluentd:latest
    ports:
    - containerPort: 24224  # Different port!
      name: fluentd
      protocol: TCP
    env:
    - name: FLUENTD_PORT
      value: "24224"
```

**Port allocation best practices:**

```yaml
# Standard port assignments for multi-container pods
# - Main app: 8080
# - Metrics (Prometheus): 9090
# - Health checks: 8081
# - Admin/Debug: 8082
# - Sidecar (Envoy): 15001, 15006
# - Logging (Fluentd): 24224

apiVersion: v1
kind: Pod
metadata:
  name: production-app
spec:
  containers:
  - name: app
    ports:
    - containerPort: 8080
      name: http
    - containerPort: 8081
      name: health
    - containerPort: 9090
      name: metrics
  
  - name: envoy-sidecar
    image: envoyproxy/envoy:latest
    ports:
    - containerPort: 15001
      name: envoy-admin
  
  - name: fluentd
    image: fluentd:latest
    ports:
    - containerPort: 24224
      name: forward
```

---

### Example 18: Kubernetes Ingress Port Debugging

**Scenario:** Ingress controller not forwarding traffic correctly.

```bash
# Traffic not reaching your app through Ingress
$ kubectl get ingress my-ingress
NAME         CLASS   HOSTS              ADDRESS        PORTS   AGE
my-ingress   nginx   app.example.com    192.168.1.10   80      5m

# Check Ingress controller logs
$ kubectl logs -n ingress-nginx deploy/ingress-nginx-controller | grep -i error

Error: Service "default/my-service:8080" does not have any active endpoints

# Check service and endpoints
$ kubectl get svc my-service
NAME         TYPE        CLUSTER-IP      PORT(S)    AGE
my-service   ClusterIP   10.96.52.134    8080/TCP   10m

$ kubectl get endpoints my-service
NAME         ENDPOINTS   AGE
my-service   <none>      10m

# No endpoints! Check pod labels and service selector
$ kubectl get pods --show-labels | grep my-app
my-app-abc123   app=myapp,version=v1

$ kubectl get svc my-service -o yaml | grep -A3 selector
selector:
  app: my-service  ← Wrong label!

# Fix: Update service selector
$ kubectl patch svc my-service -p '{"spec":{"selector":{"app":"myapp"}}}'

# Verify endpoints now exist
$ kubectl get endpoints my-service
NAME         ENDPOINTS           AGE
my-service   10.244.1.5:8080     1m

# Test connection to pod directly
$ kubectl run -it --rm debug --image=busybox --restart=Never -- \
  wget -qO- http://10.244.1.5:8080

# If that works, test service
$ kubectl run -it --rm debug --image=busybox --restart=Never -- \
  wget -qO- http://my-service:8080
```

---

## Docker Integration Examples

### Example 19: Docker Container Port Conflicts

**Scenario:** Container won't start due to port already bound on host.

```bash
$ docker run -d -p 8080:8080 myapp:latest

docker: Error response from daemon: driver failed programming external connectivity on endpoint myapp:
Bind for 0.0.0.0:8080 failed: port is already allocated.

# Find what's using port 8080
$ portguard 8080

🔍 Checking port 8080...

PORT       PID        PROCESS              ADDRESS
8080       45231      node                 *:8080

Process details:
  Local dev server still running

# Option 1: Kill local process
$ portguard kill 8080 -y

# Option 2: Use different host port
$ docker run -d -p 8081:8080 myapp:latest

# Option 3: Let Docker assign random port
$ docker run -d -p 8080 myapp:latest  # Host port auto-assigned
$ docker ps
CONTAINER ID   IMAGE          PORTS
abc123         myapp:latest   0.0.0.0:32768->8080/tcp

# Option 4: Find and remove conflicting container
$ docker ps -a | grep 8080
def456   nginx:latest   "nginx"   Up 2 hours   0.0.0.0:8080->80/tcp

$ docker stop def456
$ docker rm def456

# Now start your container
$ docker run -d -p 8080:8080 myapp:latest
```

**Helper script for automatic port conflict resolution:**

```bash
#!/bin/bash
# docker-start-smart.sh - Auto-resolve port conflicts

IMAGE=$1
HOST_PORT=$2
CONTAINER_PORT=$3

if [ -z "$IMAGE" ] || [ -z "$HOST_PORT" ] || [ -z "$CONTAINER_PORT" ]; then
  echo "Usage: ./docker-start-smart.sh <image> <host-port> <container-port>"
  exit 1
fi

# Check if port is in use
if portguard $HOST_PORT > /dev/null 2>&1; then
  echo "⚠️  Port $HOST_PORT is in use"
  
  # Check if it's a Docker container
  CONTAINER_ID=$(docker ps --filter "publish=$HOST_PORT" -q)
  
  if [ -n "$CONTAINER_ID" ]; then
    echo "Found Docker container using port $HOST_PORT: $CONTAINER_ID"
    read -p "Stop and remove container? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      docker stop $CONTAINER_ID
      docker rm $CONTAINER_ID
      echo "✓ Container removed"
    else
      echo "Aborting."
      exit 1
    fi
  else
    # It's a host process
    portguard $HOST_PORT
    read -p "Kill process using port $HOST_PORT? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      portguard kill $HOST_PORT -y
    else
      echo "Aborting."
      exit 1
    fi
  fi
fi

# Start container
echo "🚀 Starting container..."
docker run -d -p $HOST_PORT:$CONTAINER_PORT $IMAGE

echo "✓ Container started on port $HOST_PORT"
docker ps | head -n 2
```

---

### Example 20: Docker Compose Port Management

**Scenario:** Multiple services in docker-compose fighting for ports.

```bash
$ docker-compose up
ERROR: for db  Cannot start service db: driver failed programming external connectivity:
Bind for 0.0.0.0:5432 failed: port is already allocated

# Check what's using PostgreSQL port
$ portguard 5432

🔍 Checking port 5432...

PORT       PID        PROCESS              ADDRESS
5432       2341       postgres             127.0.0.1:5432

Process details:
  Homebrew PostgreSQL installation

# Option 1: Stop local PostgreSQL
$ brew services stop postgresql
$ docker-compose up -d

# Option 2: Change docker-compose port mapping
# docker-compose.yml
version: '3.8'
services:
  db:
    image: postgres:15
    ports:
      - "5433:5432"  # Use different host port
    environment:
      POSTGRES_PASSWORD: secret

# Update app config to use new port
# .env
DATABASE_URL=postgresql://localhost:5433/mydb

$ docker-compose up -d

# Option 3: Use host network mode (Linux only)
# docker-compose.yml
services:
  api:
    image: myapi:latest
    network_mode: "host"
    environment:
      - PORT=8080
    # No port mapping needed - uses host network

# Option 4: Dynamic port allocation
# docker-compose.yml
services:
  api:
    image: myapi:latest
    ports:
      - "8080"  # Let Docker assign host port
```

**Helper: Find and kill Docker containers by port:**

```bash
#!/bin/bash
# docker-kill-port.sh

PORT=$1

if [ -z "$PORT" ]; then
  echo "Usage: ./docker-kill-port.sh <port>"
  exit 1
fi

# Find containers using this port
CONTAINERS=$(docker ps --format '{{.ID}}\t{{.Ports}}' | grep ":$PORT->" | cut -f1)

if [ -z "$CONTAINERS" ]; then
  echo "No Docker containers found using port $PORT"
  
  # Check host processes
  portguard $PORT
  exit 0
fi

echo "Found containers using port $PORT:"
docker ps --filter "publish=$PORT" --format "table {{.ID}}\t{{.Names}}\t{{.Image}}\t{{.Ports}}"

echo ""
read -p "Stop and remove these containers? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "$CONTAINERS" | while read container; do
    echo "Stopping $container..."
    docker stop $container
    docker rm $container
  done
  echo "✓ Containers removed, port $PORT is now free"
else
  echo "Cancelled."
fi
```

---

### Example 21: Docker Network Port Isolation

**Scenario:** Isolate services on different Docker networks.

```bash
# Create separate networks for different environments
$ docker network create dev-network
$ docker network create prod-network

# Run services on same port but different networks
$ docker run -d --name dev-api --network dev-network -p 8080:8080 myapi:dev
$ docker run -d --name prod-api --network prod-network -p 8081:8080 myapi:prod

# Services are isolated - can't communicate across networks
$ docker exec dev-api curl http://prod-api:8080
curl: (6) Could not resolve host: prod-api

# Check port mappings
$ docker ps --format "table {{.Names}}\t{{.Ports}}"
NAMES       PORTS
dev-api     0.0.0.0:8080->8080/tcp
prod-api    0.0.0.0:8081->8080/tcp

# Both use port 8080 internally, but mapped to different host ports
```

**docker-compose with network isolation:**

```yaml
# docker-compose.yml
version: '3.8'

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge

services:
  web:
    image: nginx:latest
    networks:
      - frontend
    ports:
      - "80:80"
  
  api:
    image: myapi:latest
    networks:
      - frontend  # Can talk to web
      - backend   # Can talk to db
    ports:
      - "8080:8080"
  
  db:
    image: postgres:15
    networks:
      - backend  # Isolated from web
    ports:
      - "5432"  # Not exposed to host
```

---

### Example 22: Docker Health Checks with Port Monitoring

**Scenario:** Ensure container is actually listening on expected port.

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    image: myapi:latest
    ports:
      - "8080:8080"
    healthcheck:
      test: ["CMD", "nc", "-z", "localhost", "8080"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 40s
  
  # Alternative healthcheck with curl
  web:
    image: nginx:latest
    ports:
      - "80:80"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

**Check container health:**

```bash
$ docker ps
CONTAINER ID   IMAGE          STATUS
abc123         myapi:latest   Up 2 min (healthy)
def456         nginx:latest   Up 5 min (unhealthy)

# View health check logs
$ docker inspect --format='{{json .State.Health}}' def456 | jq

{
  "Status": "unhealthy",
  "FailingStreak": 3,
  "Log": [
    {
      "ExitCode": 1,
      "Output": "curl: (7) Failed to connect to localhost port 80"
    }
  ]
}

# Debug why port isn't accessible
$ docker exec -it def456 sh

# Inside container - check if process is listening
$ netstat -tlnp | grep :80
(nothing)

# Process crashed or never started!
$ ps aux | grep nginx
(no nginx process)

# Check logs
$ docker logs def456
Error: Configuration file not found: /etc/nginx/nginx.conf
```

---

### Example 23: Docker Swarm Port Conflicts

**Scenario:** Service fails to deploy in Docker Swarm due to port conflicts.

```bash
# Deploy service in Swarm
$ docker service create \
  --name my-service \
  --publish published=8080,target=8080 \
  --replicas 3 \
  myapp:latest

Error: port 8080 is already in use

# Check existing services
$ docker service ls
ID             NAME           MODE         REPLICAS   PORTS
abc123         old-service    replicated   2/2        *:8080->8080/tcp

# Option 1: Remove old service
$ docker service rm old-service

# Option 2: Update to use different port
$ docker service create \
  --name my-service \
  --publish published=8081,target=8080 \
  --replicas 3 \
  myapp:latest

# Check service deployment across nodes
$ docker service ps my-service
ID             NAME              NODE      DESIRED STATE   CURRENT STATE
xyz001         my-service.1      node-1    Running         Running 1 minute ago
xyz002         my-service.2      node-2    Running         Running 1 minute ago
xyz003         my-service.3      node-3    Running         Running 1 minute ago

# Verify port is listening on all nodes
$ for node in node-1 node-2 node-3; do
    echo "Checking $node..."
    docker node exec $node "portguard 8081"
  done
```

---

### Example 24: Container Port Range Scanning

**Scenario:** Find which containers are using ports in a specific range.

```bash
#!/bin/bash
# docker-port-scan.sh - Scan Docker containers for port usage

START_PORT=${1:-3000}
END_PORT=${2:-4000}

echo "🔍 Scanning Docker containers for ports $START_PORT-$END_PORT..."
echo ""

# Get all running containers
CONTAINERS=$(docker ps -q)

if [ -z "$CONTAINERS" ]; then
  echo "No running containers"
  exit 0
fi

# Check each port in range
for port in $(seq $START_PORT $END_PORT); do
  # Find containers publishing this port
  RESULT=$(docker ps --format '{{.ID}}\t{{.Names}}\t{{.Ports}}' | grep ":$port->")
  
  if [ -n "$RESULT" ]; then
    echo "📍 Port $port:"
    echo "$RESULT" | awk -F'\t' '{printf "   Container: %s (%s)\n   Ports: %s\n\n", $2, $1, $3}'
  fi
done

# Summary
echo ""
echo "📊 Summary:"
docker ps --format "table {{.Names}}\t{{.Ports}}" | grep -E ":[0-9]+->"
```

**Usage:**

```bash
$ ./docker-port-scan.sh 8000 8100

🔍 Scanning Docker containers for ports 8000-8100...

📍 Port 8080:
   Container: api-server (abc123)
   Ports: 0.0.0.0:8080->8080/tcp

📍 Port 8081:
   Container: admin-panel (def456)
   Ports: 0.0.0.0:8081->3000/tcp

📍 Port 8082:
   Container: metrics (ghi789)
   Ports: 0.0.0.0:8082->9090/tcp

📊 Summary:
NAMES         PORTS
api-server    0.0.0.0:8080->8080/tcp
admin-panel   0.0.0.0:8081->3000/tcp
metrics       0.0.0.0:8082->9090/tcp
```

---

### Example 15: Team Onboarding Port Setup

**Scenario:** New developer joins team, needs to set up standard port configuration.

```bash
#!/bin/bash
# onboarding-setup.sh - Setup development environment

echo "🎉 Welcome to the team! Setting up your dev environment..."
echo ""

# 1. Check if portguard is installed
if ! command -v portguard &> /dev/null; then
  echo "📦 Installing portguard..."
  npm install -g @muin/portguard
fi

# 2. Check for port conflicts
echo "🔍 Checking for port conflicts..."
REQUIRED_PORTS=(3000 4000 5432 6379 8080)
CONFLICTS=()

for port in "${REQUIRED_PORTS[@]}"; do
  if nc -z localhost $port 2>/dev/null; then
    CONFLICTS+=($port)
  fi
done

if [ ${#CONFLICTS[@]} -gt 0 ]; then
  echo ""
  echo "⚠️  These required ports are already in use: ${CONFLICTS[*]}"
  echo ""
  portguard
  echo ""
  echo "Would you like to free up these ports?"
  read -p "Kill conflicting processes? (y/N): " -n 1 -r
  echo
  
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    for port in "${CONFLICTS[@]}"; do
      portguard kill $port -y
    done
    echo "✅ Ports freed"
  else
    echo "⚠️  You'll need to manually free these ports before starting dev servers"
  fi
fi

# 3. Start required services
echo ""
echo "🚀 Starting required services..."

# Start Docker services (PostgreSQL, Redis, etc.)
if command -v docker-compose &> /dev/null; then
  echo "Starting Docker services..."
  docker-compose up -d postgres redis
  
  echo "⏳ Waiting for services to be ready..."
  sleep 5
  
  echo ""
  echo "📊 Services status:"
  portguard | grep -E "5432|6379"
else
  echo "⚠️  Docker Compose not found. Install Docker to run database services."
fi

# 4. Verify setup
echo ""
echo "✅ Environment setup complete!"
echo ""
echo "📝 Standard port assignments:"
echo "   3000  - Frontend (React)"
echo "   4000  - Backend API (Node.js)"
echo "   5432  - PostgreSQL"
echo "   6379  - Redis"
echo "   8080  - Microservices"
echo ""
echo "Quick commands:"
echo "  portguard          - List active ports"
echo "  portguard 3000     - Check specific port"
echo "  portguard kill 3000 - Free up a port"
echo "  portguard clean    - Clean up zombie processes"
echo ""
echo "Happy coding! 🎉"
```

---

## Platform Support

- **macOS**: Uses `lsof`
- **Linux**: Uses `lsof`
- **Windows**: Uses `netstat`

## Permissions

Some processes may require elevated privileges to kill:

```bash
# macOS/Linux
sudo portguard kill 80

# Windows
# Run terminal as Administrator
```

## Integration with Development Tools

### VS Code Task

```json
// .vscode/tasks.json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Check Port 3000",
      "type": "shell",
      "command": "portguard 3000",
      "presentation": {
        "reveal": "always",
        "panel": "new"
      }
    },
    {
      "label": "Kill Port 3000",
      "type": "shell",
      "command": "portguard kill 3000 -y",
      "presentation": {
        "reveal": "always"
      }
    },
    {
      "label": "Clean All Ports",
      "type": "shell",
      "command": "portguard clean",
      "problemMatcher": []
    }
  ]
}
```

Use: `Cmd+Shift+P` → "Run Task" → "Kill Port 3000"

---

### npm Scripts

```json
{
  "scripts": {
    "predev": "portguard kill 3000 -y || true",
    "dev": "next dev",
    "postdev": "portguard clean || true",
    "ports": "portguard",
    "ports:clean": "portguard clean"
  }
}
```

---

### Docker Compose Integration

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "${APP_PORT:-3000}:3000"
    environment:
      - PORT=3000
    healthcheck:
      test: ["CMD", "portguard", "3000"]
      interval: 10s
      timeout: 5s
      retries: 3
```

---

### Shell Aliases

```bash
# Add to ~/.bashrc or ~/.zshrc

# Quick port checks
alias ports='portguard'
alias port='portguard'

# Kill common dev ports
alias kill3000='portguard kill 3000 -y'
alias kill4000='portguard kill 4000 -y'
alias kill5000='portguard kill 5000 -y'
alias kill8080='portguard kill 8080 -y'

# Clean up all dev servers
alias killdev='portguard kill 3000 -y && portguard kill 4000 -y && portguard kill 5000 -y'

# Watch ports
alias portswatch='watch -n 2 portguard'
```

## Why?

Because "port already in use" errors are annoying. Because you shouldn't have to remember `lsof -ti:3000 | xargs kill`. Because zombie processes are real and they're coming for your localhost.

## Output

Clean, colorized output that's actually readable:

```
🔒 Active Ports:

PORT       PID        PROCESS              ADDRESS
3000       12345      node                 *:3000
5432       67890      postgres             127.0.0.1:5432
8080       11111      python3              *:8080
```

## Error Handling

- Port not in use? We'll tell you.
- Permission denied? Clear message.
- Process already dead? No problem.
- Tool not found? Helpful install hint.

## Development

```bash
# Clone
git clone https://github.com/muin-company/portguard.git
cd portguard

# Install dependencies
npm install

# Test
npm test

# Run locally
node bin/portguard.js
```

## License

MIT

## Author

Built by [muin](https://github.com/muin-company)

---

Stop fighting with ports. Start guarding them.
