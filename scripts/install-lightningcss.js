// Custom install script for LightningCSS to fix Vercel deployment issues
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Running custom LightningCSS installation script...');

// Path to lightningcss install script
const lightningcssPath = path.join(process.cwd(), 'node_modules', 'lightningcss');
const installScript = path.join(lightningcssPath, 'install.js');

// Check if lightningcss is installed
if (!fs.existsSync(lightningcssPath)) {
  console.log('LightningCSS not found, installing...');
  try {
    execSync('npm install lightningcss@1.25.0 --no-save', { stdio: 'inherit' });
  } catch (error) {
    console.error('Failed to install lightningcss:', error);
    process.exit(1);
  }
}

// Check if install script exists
if (!fs.existsSync(installScript)) {
  console.error('LightningCSS install script not found at path:', installScript);
  process.exit(1);
}

// Run the lightningcss install script to ensure platform-specific binaries are available
try {
  console.log('Running LightningCSS install script...');
  require(installScript);
  console.log('LightningCSS installation completed successfully');
} catch (error) {
  console.error('Error running LightningCSS install script:', error);
  process.exit(1);
}

// Check for linux-x64-gnu binary which is used by Vercel
const linuxBinaryPath = path.join(lightningcssPath, 'node', 'lightningcss.linux-x64-gnu.node');
if (!fs.existsSync(linuxBinaryPath)) {
  console.warn('Warning: linux-x64-gnu binary not found at:', linuxBinaryPath);
  console.log('Attempting to fix by copying from another platform binary if available...');
  
  // Find any available binary
  const nodeDir = path.join(lightningcssPath, 'node');
  const files = fs.readdirSync(nodeDir);
  const binaries = files.filter(file => file.startsWith('lightningcss.') && file.endsWith('.node'));
  
  if (binaries.length > 0) {
    console.log('Found binaries:', binaries);
    // Copy the first available binary to the linux name
    fs.copyFileSync(
      path.join(nodeDir, binaries[0]),
      linuxBinaryPath
    );
    console.log('Copied', binaries[0], 'to linux-x64-gnu');
  } else {
    console.error('No platform binaries found, deployment may fail');
  }
}

console.log('LightningCSS setup complete'); 