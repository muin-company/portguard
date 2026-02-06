#!/usr/bin/env node
import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';

const execAsync = promisify(exec);

const PLATFORM = process.platform;

/**
 * Get all active ports and their processes
 */
export async function getActivePorts() {
  try {
    if (PLATFORM === 'win32') {
      return await getPortsWindows();
    } else {
      return await getPortsUnix();
    }
  } catch (error) {
    throw new Error(`Failed to get active ports: ${error.message}`);
  }
}

/**
 * Get ports on Unix-like systems (macOS, Linux)
 */
async function getPortsUnix() {
  // Try different lsof locations
  const lsofPaths = [
    'lsof',           // In PATH
    '/usr/sbin/lsof', // macOS default
    '/usr/bin/lsof'   // Linux default
  ];

  let lastError;
  
  for (const lsofPath of lsofPaths) {
    try {
      const { stdout } = await execAsync(`${lsofPath} -iTCP -sTCP:LISTEN -n -P`);
      return parseUnixOutput(stdout);
    } catch (error) {
      // lsof exits with code 1 when no ports are listening
      if (error.code === 1 && error.stdout) {
        return parseUnixOutput(error.stdout || '');
      }
      lastError = error;
      continue;
    }
  }

  // All paths failed
  if (lastError.message.includes('not found') || lastError.code === 'ENOENT') {
    throw new Error('lsof not found. Please install lsof to use portguard.');
  }
  throw lastError;
}

/**
 * Get ports on Windows
 */
async function getPortsWindows() {
  const { stdout } = await execAsync('netstat -ano | findstr LISTENING');
  return parseWindowsOutput(stdout);
}

/**
 * Parse lsof output
 */
function parseUnixOutput(output) {
  const lines = output.trim().split('\n').slice(1); // Skip header
  const ports = [];
  const seen = new Set();

  for (const line of lines) {
    const parts = line.split(/\s+/);
    if (parts.length < 9) continue;

    const command = parts[0];
    const pid = parts[1];
    const address = parts[8];

    // Extract port from address (format: *:PORT or IP:PORT)
    const portMatch = address.match(/:(\d+)$/);
    if (!portMatch) continue;

    const port = portMatch[1];
    const key = `${pid}-${port}`;

    if (!seen.has(key)) {
      seen.add(key);
      ports.push({
        port: parseInt(port),
        pid: parseInt(pid),
        process: command,
        address: address
      });
    }
  }

  return ports.sort((a, b) => a.port - b.port);
}

/**
 * Parse netstat output (Windows)
 */
function parseWindowsOutput(output) {
  const lines = output.trim().split('\n');
  const ports = [];
  const seen = new Set();

  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 5) continue;

    const address = parts[1];
    const pid = parts[4];

    // Extract port from address (format: IP:PORT)
    const portMatch = address.match(/:(\d+)$/);
    if (!portMatch) continue;

    const port = portMatch[1];
    const key = `${pid}-${port}`;

    if (!seen.has(key)) {
      seen.add(key);
      ports.push({
        port: parseInt(port),
        pid: parseInt(pid),
        process: 'unknown', // Windows netstat doesn't show process name
        address: address
      });
    }
  }

  return ports.sort((a, b) => a.port - b.port);
}

/**
 * Get process info for a specific port
 */
export async function getPortInfo(port) {
  const ports = await getActivePorts();
  return ports.filter(p => p.port === parseInt(port));
}

/**
 * Get process info for a range of ports
 */
export async function getPortRange(startPort, endPort) {
  const start = parseInt(startPort);
  const end = parseInt(endPort);
  
  if (isNaN(start) || isNaN(end)) {
    throw new Error('Invalid port range: ports must be numbers');
  }
  
  if (start > end) {
    throw new Error('Invalid port range: start port must be less than end port');
  }
  
  if (start < 1 || end > 65535) {
    throw new Error('Invalid port range: ports must be between 1 and 65535');
  }
  
  const allPorts = await getActivePorts();
  const rangePorts = allPorts.filter(p => p.port >= start && p.port <= end);
  
  return {
    start,
    end,
    total: end - start + 1,
    used: rangePorts.length,
    free: (end - start + 1) - rangePorts.length,
    ports: rangePorts
  };
}

/**
 * Kill process by PID
 */
export async function killProcess(pid, force = false) {
  try {
    if (PLATFORM === 'win32') {
      await execAsync(`taskkill ${force ? '/F' : ''} /PID ${pid}`);
    } else {
      await execAsync(`kill ${force ? '-9' : ''} ${pid}`);
    }
    return true;
  } catch (error) {
    if (error.message.includes('No such process') || error.message.includes('not found')) {
      throw new Error(`Process ${pid} not found`);
    }
    if (error.message.includes('permission') || error.message.includes('denied')) {
      throw new Error(`Permission denied. Try running with sudo/administrator privileges.`);
    }
    throw error;
  }
}

/**
 * Kill process on a specific port
 */
export async function killPort(port, force = false) {
  const processes = await getPortInfo(port);
  
  if (processes.length === 0) {
    throw new Error(`No process found on port ${port}`);
  }

  const results = [];
  for (const proc of processes) {
    try {
      await killProcess(proc.pid, force);
      results.push({ success: true, ...proc });
    } catch (error) {
      results.push({ success: false, error: error.message, ...proc });
    }
  }

  return results;
}

/**
 * Find and kill zombie processes
 */
export async function cleanZombies() {
  const ports = await getActivePorts();
  const zombieProcesses = ['node', 'python', 'python3', 'ruby', 'java', 'deno'];
  
  const zombies = ports.filter(p => 
    zombieProcesses.some(name => p.process.toLowerCase().includes(name))
  );

  return zombies;
}

/**
 * Format and display ports
 */
export function displayPorts(ports) {
  if (ports.length === 0) {
    console.log(chalk.yellow('No active ports found'));
    return;
  }

  console.log(chalk.bold('\n🔒 Active Ports:\n'));
  
  const header = `${chalk.bold('PORT').padEnd(10)} ${chalk.bold('PID').padEnd(10)} ${chalk.bold('PROCESS').padEnd(20)} ${chalk.bold('ADDRESS')}`;
  console.log(header);
  console.log('─'.repeat(70));

  for (const port of ports) {
    const portStr = chalk.cyan(port.port.toString().padEnd(10));
    const pidStr = chalk.yellow(port.pid.toString().padEnd(10));
    const processStr = chalk.green(port.process.padEnd(20));
    const addressStr = chalk.gray(port.address);

    console.log(`${portStr}${pidStr}${processStr}${addressStr}`);
  }

  console.log('');
}

/**
 * Display single port info
 */
export function displayPortInfo(port, processes) {
  if (processes.length === 0) {
    console.log(chalk.yellow(`\nPort ${port} is not in use`));
    return;
  }

  console.log(chalk.bold(`\n🔍 Port ${port} details:\n`));

  for (const proc of processes) {
    console.log(chalk.cyan('  Port:    ') + proc.port);
    console.log(chalk.yellow('  PID:     ') + proc.pid);
    console.log(chalk.green('  Process: ') + proc.process);
    console.log(chalk.gray('  Address: ') + proc.address);
    console.log('');
  }
}

/**
 * Display port range info
 */
export function displayPortRange(rangeInfo) {
  const { start, end, total, used, free, ports } = rangeInfo;
  
  console.log(chalk.bold(`\n📊 Port Range ${start}-${end} Analysis:\n`));
  
  console.log(chalk.cyan('  Range:       ') + `${start} - ${end}`);
  console.log(chalk.yellow('  Total ports: ') + total);
  console.log(chalk.green('  Free ports:  ') + free);
  console.log(chalk.red('  Used ports:  ') + used);
  
  if (used > 0) {
    console.log(chalk.bold('\n🔒 Active Ports in Range:\n'));
    
    const header = `${chalk.bold('PORT').padEnd(10)} ${chalk.bold('PID').padEnd(10)} ${chalk.bold('PROCESS').padEnd(20)} ${chalk.bold('ADDRESS')}`;
    console.log(header);
    console.log('─'.repeat(70));

    for (const port of ports) {
      const portStr = chalk.cyan(port.port.toString().padEnd(10));
      const pidStr = chalk.yellow(port.pid.toString().padEnd(10));
      const processStr = chalk.green(port.process.padEnd(20));
      const addressStr = chalk.gray(port.address);

      console.log(`${portStr}${pidStr}${processStr}${addressStr}`);
    }
  } else {
    console.log(chalk.green('\n✓ All ports in this range are free!'));
  }
  
  console.log('');
}
