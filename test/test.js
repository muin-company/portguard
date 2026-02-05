#!/usr/bin/env node
import {
  getActivePorts,
  getPortInfo,
  displayPorts,
  displayPortInfo
} from '../lib/portguard.js';
import chalk from 'chalk';

console.log(chalk.bold('🧪 Testing portguard\n'));

async function runTests() {
  let passed = 0;
  let failed = 0;

  // Test 1: Get active ports
  console.log(chalk.blue('Test 1: Get active ports'));
  try {
    const ports = await getActivePorts();
    console.log(chalk.green(`✓ Found ${ports.length} active ports`));
    
    // Validate structure
    if (ports.length > 0) {
      const port = ports[0];
      if (port.port && port.pid && port.process && port.address) {
        console.log(chalk.green('✓ Port structure is valid'));
        passed += 2;
      } else {
        console.log(chalk.red('✗ Port structure is invalid'));
        console.log(port);
        failed += 1;
        passed += 1;
      }
    } else {
      console.log(chalk.yellow('⚠ No active ports to validate structure'));
      passed += 2;
    }
  } catch (error) {
    console.log(chalk.red(`✗ ${error.message}`));
    failed += 2;
  }
  console.log('');

  // Test 2: Check specific port (likely to exist)
  console.log(chalk.blue('Test 2: Check specific port'));
  try {
    const ports = await getActivePorts();
    if (ports.length > 0) {
      const testPort = ports[0].port;
      const processes = await getPortInfo(testPort);
      
      if (processes.length > 0) {
        console.log(chalk.green(`✓ Found process on port ${testPort}`));
        passed++;
      } else {
        console.log(chalk.red(`✗ Port ${testPort} should have a process`));
        failed++;
      }
    } else {
      console.log(chalk.yellow('⚠ No active ports to test'));
      passed++;
    }
  } catch (error) {
    console.log(chalk.red(`✗ ${error.message}`));
    failed++;
  }
  console.log('');

  // Test 3: Check non-existent port
  console.log(chalk.blue('Test 3: Check non-existent port'));
  try {
    const processes = await getPortInfo(99999);
    if (processes.length === 0) {
      console.log(chalk.green('✓ Correctly returns empty for unused port'));
      passed++;
    } else {
      console.log(chalk.red('✗ Should return empty for unused port'));
      failed++;
    }
  } catch (error) {
    console.log(chalk.red(`✗ ${error.message}`));
    failed++;
  }
  console.log('');

  // Test 4: Display functions (visual test)
  console.log(chalk.blue('Test 4: Display functions'));
  try {
    const ports = await getActivePorts();
    console.log(chalk.yellow('Visual test - should display nicely:'));
    displayPorts(ports.slice(0, 5)); // Show first 5 ports
    
    if (ports.length > 0) {
      displayPortInfo(ports[0].port, [ports[0]]);
    }
    
    console.log(chalk.green('✓ Display functions work'));
    passed++;
  } catch (error) {
    console.log(chalk.red(`✗ ${error.message}`));
    failed++;
  }

  // Summary
  console.log(chalk.bold('\n📊 Test Results:'));
  console.log(chalk.green(`  Passed: ${passed}`));
  console.log(chalk.red(`  Failed: ${failed}`));
  console.log(chalk.bold(`  Total:  ${passed + failed}`));
  
  if (failed === 0) {
    console.log(chalk.green.bold('\n✨ All tests passed!\n'));
    process.exit(0);
  } else {
    console.log(chalk.red.bold('\n❌ Some tests failed\n'));
    process.exit(1);
  }
}

runTests();
