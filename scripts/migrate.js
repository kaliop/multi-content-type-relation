
const { createStrapi } = require('@strapi/strapi');
const path = require('path');
const fs = require('fs');

const LOG_FILE = path.join(__dirname, '../../../../migration-mctr.log');

function log(message) {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] ${message}`;
  console.log(formattedMessage);
  fs.appendFileSync(LOG_FILE, formattedMessage + '\n');
}

async function run() {
  fs.writeFileSync(LOG_FILE, '');
  
  log('🏗️ Bootstrapping Strapi...');
  const appDir = path.resolve(__dirname, '../../../../');
  const app = createStrapi({ appDir, distDir: path.join(appDir, 'dist') });

  app.customFields.register({
    name: 'multi-content-type-relation',
    plugin: 'multi-content-type-relation',
    type: 'richtext'
  });

  await app.load();
  
  log('🚀 Starting MCTR Data Migration...');

  try {
    const migrationService = app.service('plugin::multi-content-type-relation.migration');
    
    if (!migrationService) {
      throw new Error('Migration service not found.');
    }
    
    await migrationService.migrateV4ToV5();
  } catch (err) {
    log(`❌ Migration failed: ${err.message}`);
    fs.appendFileSync(LOG_FILE, err.stack + '\n');
  } finally {
    process.exit(0);
  }
}

run();
