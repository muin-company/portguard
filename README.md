<div align="center">

# 🔒 portguard

**Who's stealing your ports? portguard knows.**

[![npm version](https://img.shields.io/npm/v/portguard?color=green&label=npm)](https://www.npmjs.com/package/portguard)
[![npm downloads/week](https://img.shields.io/npm/dw/portguard.svg)](https://www.npmjs.com/package/portguard)
[![npm downloads/month](https://img.shields.io/npm/dm/portguard.svg)](https://www.npmjs.com/package/portguard)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/portguard.svg)](https://nodejs.org)

<br/>

<img src="./demo.gif" alt="portguard demo" width="700"/>

<br/>

*List, kill, and guard localhost ports. No more `lsof` gymnastics.*

</div>

---

## The Problem

```
Error: listen EADDRINUSE: address already in use :::3000
```

You've seen this error a thousand times. You run `lsof -ti:3000 | xargs kill -9` from muscle memory. But can you even remember that command? And which of your 8 abandoned dev servers is hogging port 8080?

## The Solution

```bash
$ portguard

🔒 Active Ports:

PORT       PID        PROCESS              ADDRESS          UPTIME
3000       45231      node                 *:3000           2h 15m
5432       2341       postgres             127.0.0.1:5432   5d 3h
8080       46123      node                 *:8080           1h 30m

$ portguard kill 3000 -y
✓ Killed process 45231 (node) on port 3000
```

No memorizing `lsof` flags. No piping through `xargs`. One command.

## Quick Start

```bash
npx portguard              # See all active ports
npx portguard kill 3000 -y # Kill whatever's on port 3000
```

That's it. Or install globally:

```bash
npm install -g portguard
```

## Usage

```bash
portguard                  # List all active ports
portguard 3000             # Check specific port
portguard kill 3000        # Kill process on port (with confirmation)
portguard kill 3000 -y     # Kill without asking
portguard clean            # Nuke zombie dev servers
portguard watch            # Live monitoring
portguard -r 3000-4000     # Scan port range
```

## Examples

### "EADDRINUSE" — the classic

```bash
$ npm run dev
Error: listen EADDRINUSE: address already in use :::3000

$ portguard 3000
🔍 Port 3000: node (PID 45231) — /Users/me/old-project/index.js
   Running for 2h 15m

$ portguard kill 3000 -y
✓ Killed process 45231 (node) on port 3000

$ npm run dev
✓ Server started on http://localhost:3000
```

### End of day cleanup

```bash
$ portguard

🔒 Active Ports:

PORT       PID        PROCESS              ADDRESS          UPTIME
3000       45231      node                 *:3000           4h
5000       45892      python3              127.0.0.1:5000   2h
5432       2341       postgres             127.0.0.1:5432   5d
8080       46123      node                 *:8080           3h

# Kill dev servers, keep database
$ portguard kill 3000 -y
$ portguard kill 5000 -y
$ portguard kill 8080 -y
```

### Post-crash zombie hunt

```bash
$ portguard clean

🧟 Found 3 zombie processes:

  PID 98123 - node (port 3001) - idle 2h
  PID 98124 - node (port 3002) - idle 2h
  PID 98125 - node (port 3003) - idle 2h

Kill all? (y/N): y

✓ Killed 3 zombie processes
```

### Finding free ports in a range

```bash
$ portguard -r 3000-3010

📊 Port Range 3000-3010:
  Used: 3000, 3003, 3007
  Free: 3001, 3002, 3004, 3005, 3006, 3008, 3009, 3010
```

### Watch mode

```bash
$ portguard watch -i 2

👁️ Watching ports (refresh every 2s, Ctrl+C to stop)

PORT       PID        PROCESS              ADDRESS
5000       12341      node                 *:5000
5001       12389      node                 *:5001           NEW!
```

## Integration

### npm scripts

```json
{
  "scripts": {
    "predev": "portguard kill 3000 -y || true",
    "dev": "next dev"
  }
}
```

### Shell aliases

```bash
alias ports='portguard'
alias killport='portguard kill'
alias kill3000='portguard kill 3000 -y'
```

### CI cleanup

```yaml
- name: Clean ports
  run: npx portguard clean -y || true
```

## vs Alternatives

| | `portguard` | `lsof -i :3000` | `fkill-cli` | `kill-port` |
|---|---|---|---|---|
| List all ports | ✅ One command | Manual parsing | ❌ | ❌ |
| Kill by port | `kill 3000 -y` | `lsof -ti:3000 \| xargs kill` | ✅ Interactive | ✅ |
| Port range scan | ✅ | ❌ | ❌ | ❌ |
| Zombie cleanup | ✅ `clean` | ❌ | ❌ | ❌ |
| Watch mode | ✅ | ❌ | ❌ | ❌ |
| Process info (name, uptime) | ✅ | Partial | ✅ | ❌ |
| Zero config | ✅ | ✅ | ✅ | ✅ |

## Security

Open ports are attack surface. Every listening port is a door — if you don't know it's open, you can't defend it.

- **Audit exposed ports** — `portguard` shows exactly what's listening and where. No more mystery services.
- **Kill rogue processes** — That sketchy process on port 4444? Kill it before someone else finds it.
- **Dev machine hygiene** — Developers often leave debug servers, database instances, and test APIs running. Each one is a potential entry point on shared networks (coffee shops, coworking spaces).
- **Post-incident cleanup** — After a crash or failed deploy, `portguard clean` ensures no zombie processes are silently serving traffic.

```bash
# Quick security audit
$ portguard
# → See everything that's listening. If you don't recognize it, kill it.
```

> **Tip:** Run `portguard` before connecting to public WiFi. Know what's exposed.

## Platform Support

| Platform | Method |
|----------|--------|
| macOS | `lsof` |
| Linux | `lsof` |
| Windows | `netstat` |

System processes (root-owned) require `sudo portguard kill <port>`.

## Also From MUIN

Love `portguard`? Check out our other developer CLI tools:

- **[roast-cli](https://www.npmjs.com/package/roast-cli)** — AI code reviews with Gordon Ramsay energy. Brutally honest feedback from your terminal.
- **[git-why](https://www.npmjs.com/package/git-why)** — AI-powered git history explainer. Understand *why* code exists before you touch it.
- **[oops-ai](https://www.npmjs.com/package/oops-ai)** — Pipe any error to AI for instant fixes. When `portguard kill` isn't enough, `oops` diagnoses the real problem.

## Contributing

Found a bug? Have an idea? PRs welcome.

```bash
git clone https://github.com/muin-company/portguard.git
cd portguard
npm install
node bin/portguard.js
```

## Featured On

📰 Read the launch article on Dev.to: **[4 CLI Tools Every Developer Needs (That You've Never Heard Of)](https://dev.to/mjmuin/4-cli-tools-every-developer-needs-that-youve-never-heard-of-318b)**

## License

MIT © [MUIN](https://muin.company)

---

<div align="center">

**Built by [MUIN](https://muin.company)** — *일하는 AI, 누리는 인간*

🔒 Stop fighting with ports. Start guarding them.

</div>
