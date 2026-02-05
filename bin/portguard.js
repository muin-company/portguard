#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import readline from 'readline';
import {
  getActivePorts,
  getPortInfo,
  killPort,
  cleanZombies,
  displayPorts,
  displayPortInfo
} from '../lib/portguard.js';

const program = new Command();

program
  .name('portguard')
  .description('Monitor and manage localhost ports')
  .version('0.1.0');

// Main command - show all ports
program
  .argument('[port]', 'specific port to check')
  .action(async (port) => {
    if (port) {
      // Show specific port
      await handlePortCheck(port);
    } else {
      // Show all ports
      await handleListAll();
    }
  });

// Kill command
program
  .command('kill <port>')
  .description('Kill process on specific port')
  .option('-f, --force', 'force kill (SIGKILL)')
  .option('-y, --yes', 'skip confirmation')
  .action(async (port, options) => {
    await handleKill(port, options);
  });

// Watch command
program
  .command('watch')
  .description('Continuous monitoring mode')
  .option('-i, --interval <seconds>', 'refresh interval in seconds', '3')
  .action(async (options) => {
    await handleWatch(options);
  });

// Clean command
program
  .command('clean')
  .description('Kill common zombie processes (node, python, etc.)')
  .option('-f, --force', 'force kill (SIGKILL)')
  .option('-y, --yes', 'skip confirmation')
  .action(async (options) => {
    await handleClean(options);
  });

/**
 * Handle listing all ports
 */
async function handleListAll() {
  try {
    const ports = await getActivePorts();
    displayPorts(ports);
  } catch (error) {
    console.error(chalk.red('Error: ') + error.message);
    process.exit(1);
  }
}

/**
 * Handle checking specific port
 */
async function handlePortCheck(port) {
  try {
    const processes = await getPortInfo(port);
    displayPortInfo(port, processes);
  } catch (error) {
    console.error(chalk.red('Error: ') + error.message);
    process.exit(1);
  }
}

/**
 * Handle kill command
 */
async function handleKill(port, options) {
  try {
    const processes = await getPortInfo(port);
    
    if (processes.length === 0) {
      console.log(chalk.yellow(`Port ${port} is not in use`));
      return;
    }

    // Show what will be killed
    console.log(chalk.bold(`\n⚠️  About to kill:\n`));
    for (const proc of processes) {
      console.log(chalk.yellow(`  PID ${proc.pid}: ${proc.process} on port ${proc.port}`));
    }
    console.log('');

    // Confirm unless --yes
    if (!options.yes) {
      const confirmed = await confirm('Continue?');
      if (!confirmed) {
        console.log(chalk.gray('Cancelled'));
        return;
      }
    }

    // Kill processes
    const results = await killPort(port, options.force);
    
    for (const result of results) {
      if (result.success) {
        console.log(chalk.green(`✓ Killed PID ${result.pid} (${result.process})`));
      } else {
        console.log(chalk.red(`✗ Failed to kill PID ${result.pid}: ${result.error}`));
      }
    }
  } catch (error) {
    console.error(chalk.red('Error: ') + error.message);
    process.exit(1);
  }
}

/**
 * Handle watch mode
 */
async function handleWatch(options) {
  const interval = parseInt(options.interval) * 1000;

  console.log(chalk.bold(`👁️  Watching ports (refresh every ${options.interval}s, Ctrl+C to stop)\n`));

  const refresh = async () => {
    // Clear screen
    console.clear();
    console.log(chalk.bold(`👁️  Watching ports (refresh every ${options.interval}s, Ctrl+C to stop)\n`));

    try {
      const ports = await getActivePorts();
      displayPorts(ports);
    } catch (error) {
      console.error(chalk.red('Error: ') + error.message);
    }
  };

  // Initial display
  await refresh();

  // Refresh interval
  const intervalId = setInterval(refresh, interval);

  // Handle Ctrl+C
  process.on('SIGINT', () => {
    clearInterval(intervalId);
    console.log(chalk.gray('\n\nStopped watching'));
    process.exit(0);
  });
}

/**
 * Handle clean command
 */
async function handleClean(options) {
  try {
    const zombies = await cleanZombies();

    if (zombies.length === 0) {
      console.log(chalk.green('✓ No zombie processes found'));
      return;
    }

    // Show what will be killed
    console.log(chalk.bold(`\n🧟 Found ${zombies.length} zombie process${zombies.length > 1 ? 'es' : ''}:\n`));
    for (const proc of zombies) {
      console.log(chalk.yellow(`  PID ${proc.pid}: ${proc.process} on port ${proc.port}`));
    }
    console.log('');

    // Confirm unless --yes
    if (!options.yes) {
      const confirmed = await confirm('Kill all?');
      if (!confirmed) {
        console.log(chalk.gray('Cancelled'));
        return;
      }
    }

    // Kill each zombie
    let killed = 0;
    let failed = 0;

    for (const zombie of zombies) {
      try {
        const results = await killPort(zombie.port, options.force);
        for (const result of results) {
          if (result.success) {
            console.log(chalk.green(`✓ Killed PID ${result.pid} (${result.process})`));
            killed++;
          } else {
            console.log(chalk.red(`✗ Failed to kill PID ${result.pid}: ${result.error}`));
            failed++;
          }
        }
      } catch (error) {
        console.log(chalk.red(`✗ Failed: ${error.message}`));
        failed++;
      }
    }

    console.log(chalk.bold(`\n${killed} killed, ${failed} failed`));
  } catch (error) {
    console.error(chalk.red('Error: ') + error.message);
    process.exit(1);
  }
}

/**
 * Prompt for confirmation
 */
function confirm(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(chalk.yellow(`${question} (y/N) `), (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

program.parse();
