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

### Daily workflow

```bash
# Starting work - check what's running
portguard

# Port 3000 is stuck from yesterday
portguard kill 3000 -y

# Clean up all zombie node processes
portguard clean

# Start your dev server
npm run dev
```

### Debugging port conflicts

```bash
# Your app won't start - says port 8080 is in use
portguard 8080

# Ah, there's the culprit
# PORT       PID        PROCESS              ADDRESS
# 8080       12345      node                 *:8080

portguard kill 8080
```

### Monitoring

```bash
# Watch ports while debugging
portguard watch -i 1
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
