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

### Example 6: Port Conflict in Docker Development

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
