#!/usr/bin/env node
/**
 * Completely removes all Supabase containers and volumes.
 * Use this when local Supabase gets stuck or corrupted.
 *
 * Usage: npm run supabase:nuke
 */

import { execSync } from 'child_process';

function run(cmd, options = {}) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: 'pipe', ...options });
  } catch (e) {
    return e.stdout || '';
  }
}

function runWithOutput(cmd) {
  try {
    execSync(cmd, { stdio: 'inherit' });
    return true;
  } catch {
    return false;
  }
}

console.log('🧹 Nuking Supabase local development environment...\n');

// Step 1: Stop Supabase gracefully
console.log('Step 1: Stopping Supabase...');
runWithOutput('npx supabase stop --no-backup');

// Step 2: Find and remove all Supabase containers
console.log('\nStep 2: Removing Supabase containers...');
const containers = run('docker ps -aq --filter name=supabase_').trim();
if (containers) {
  const containerIds = containers.split('\n').filter(Boolean);
  console.log(`  Found ${containerIds.length} container(s)`);
  for (const id of containerIds) {
    run(`docker rm -f ${id}`);
    console.log(`  Removed container ${id}`);
  }
} else {
  console.log('  No containers found');
}

// Step 3: Find and remove all Supabase volumes
console.log('\nStep 3: Removing Supabase volumes...');
const volumes = run('docker volume ls -q --filter name=supabase_').trim();
if (volumes) {
  const volumeIds = volumes.split('\n').filter(Boolean);
  console.log(`  Found ${volumeIds.length} volume(s)`);
  for (const id of volumeIds) {
    run(`docker volume rm ${id}`);
    console.log(`  Removed volume ${id}`);
  }
} else {
  console.log('  No volumes found');
}

// Step 4: Clean up any orphaned networks
console.log('\nStep 4: Removing Supabase networks...');
const networks = run('docker network ls -q --filter name=supabase_').trim();
if (networks) {
  const networkIds = networks.split('\n').filter(Boolean);
  console.log(`  Found ${networkIds.length} network(s)`);
  for (const id of networkIds) {
    run(`docker network rm ${id}`);
    console.log(`  Removed network ${id}`);
  }
} else {
  console.log('  No networks found');
}

console.log('\n✅ Supabase environment nuked successfully!');
console.log('\nTo start fresh, run:');
console.log('  npm run supabase:start');
