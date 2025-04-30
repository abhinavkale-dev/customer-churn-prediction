#!/usr/bin/env node

const { spawn } = require('child_process');
const { join } = require('path');

console.log('🧹 Resetting database and creating new seed data...');

const seedProcess = spawn('npx', ['ts-node', join(__dirname, 'seedData.ts')], {
  stdio: 'inherit',
  shell: true
});

seedProcess.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Database reset and seed completed successfully!');
  } else {
    console.error(`❌ Seed process exited with code ${code}`);
  }
}); 