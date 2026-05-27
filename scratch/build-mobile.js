const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const apiDir = path.join(__dirname, '../src/app/api');
const apiBackupDir = path.join(__dirname, '../api_backup');

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

function moveItemWithRetrySync(src, dest, retries = 5, delay = 500) {
  for (let i = 0; i < retries; i++) {
    try {
      if (fs.existsSync(dest)) {
        fs.rmSync(dest, { recursive: true, force: true });
      }
      fs.renameSync(src, dest);
      return; // Success!
    } catch (err) {
      if (i === retries - 1) {
        console.warn(`Rename failed for ${src} -> ${dest}, attempting copy-and-delete fallback...`);
        try {
          copyRecursiveSync(src, dest);
          fs.rmSync(src, { recursive: true, force: true });
          return; // Success via fallback!
        } catch (fallbackErr) {
          throw new Error(`Failed to move ${src} to ${dest} after retries and fallback: ${fallbackErr.message}`);
        }
      }
      // Wait for delay
      const start = Date.now();
      while (Date.now() - start < delay) {}
    }
  }
}

console.log('Starting Mobile Build Pre-processing...');

let backedUp = false;

try {
  if (fs.existsSync(apiDir)) {
    // Create apiBackupDir if it doesn't exist
    if (!fs.existsSync(apiBackupDir)) {
      fs.mkdirSync(apiBackupDir, { recursive: true });
    }

    // List all files and directories inside api
    const items = fs.readdirSync(apiDir);
    if (items.length > 0) {
      console.log(`Moving ${items.length} items from api to project-root api_backup...`);
      for (const item of items) {
        const srcPath = path.join(apiDir, item);
        const destPath = path.join(apiBackupDir, item);
        moveItemWithRetrySync(srcPath, destPath);
      }
      backedUp = true;
    }
  }

  console.log('Running Prisma generation...');
  execSync('npx prisma generate', { stdio: 'inherit', env: { ...process.env } });

  console.log('Running Next.js static export build...');
  // Run with EXPORT_MODE=true environment variable
  execSync('npx next build', { 
    stdio: 'inherit', 
    env: { 
      ...process.env, 
      EXPORT_MODE: 'true' 
    } 
  });

  console.log('Static export completed successfully!');

} catch (error) {
  console.error('Build process failed:', error);
  process.exitCode = 1;
} finally {
  if (backedUp && fs.existsSync(apiBackupDir)) {
    console.log('Restoring items from project-root api_backup to api...');
    try {
      if (!fs.existsSync(apiDir)) {
        fs.mkdirSync(apiDir, { recursive: true });
      }
      const items = fs.readdirSync(apiBackupDir);
      for (const item of items) {
        const srcPath = path.join(apiBackupDir, item);
        const destPath = path.join(apiDir, item);
        moveItemWithRetrySync(srcPath, destPath);
      }
      // Remove empty api_backup directory
      fs.rmSync(apiBackupDir, { recursive: true, force: true });
      console.log('api directory contents restored successfully.');
    } catch (restoreError) {
      console.error('Failed to restore api directory contents:', restoreError);
    }
  }
}

// Sync with capacitor if build succeeded
if (process.exitCode !== 1) {
  try {
    console.log('Syncing assets with Capacitor...');
    execSync('npx cap sync', { stdio: 'inherit' });
    console.log('Capacitor sync complete!');
  } catch (syncError) {
    console.error('Capacitor sync failed:', syncError);
    process.exitCode = 1;
  }
}
