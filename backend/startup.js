const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  try {
    console.log('🏗️ Setting up database schema...');
    
    // Prisma Schema anwenden
    execSync('npx prisma db push', { stdio: 'inherit' });
    console.log('✅ Database schema applied successfully');
    
    console.log('🌱 Seeding database...');
    
    // Seede Haupt-Daten
    execSync('npm run db:seed', { stdio: 'inherit' });
    console.log('✅ Main data seeded successfully');
    
    // Seede Häuser-Daten (mit Fehlerbehandlung)
    try {
      execSync('npm run db:seed-houses', { stdio: 'inherit' });
      console.log('✅ Houses data seeded successfully');
    } catch (error) {
      console.log('⚠️ Houses seeding failed (may already exist):', error.message);
    }
    
    console.log('🚀 Starting application...');
    
    // Prüfe ob app.js existiert (tsc kompiliert nach dist/src/)
    const appPath = path.join(__dirname, 'dist', 'src', 'app.js');
    if (!fs.existsSync(appPath)) {
      console.log('❌ ERROR: /app/dist/src/app.js not found!');
      console.log('❌ TypeScript compilation may have failed.');
      console.log('❌ Available files in dist/:');
      try {
        const distFiles = fs.readdirSync(path.join(__dirname, 'dist'));
        console.log('❌', distFiles);
      } catch (e) {
        console.log('❌ dist/ directory does not exist!');
      }
      
      console.log('🔧 Attempting to rebuild...');
      try {
        execSync('npm run build', { stdio: 'inherit' });
        console.log('✅ Rebuild successful');
      } catch (error) {
        console.log('❌ Rebuild failed:', error.message);
        process.exit(1);
      }
    }
    
    // Warte kurz und prüfe nochmal
    console.log('⏳ Waiting for file system...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (!fs.existsSync(appPath)) {
      console.log('❌ ERROR: app.js still not found after rebuild!');
      console.log('❌ Available files in dist/:');
      try {
        const distFiles = fs.readdirSync(path.join(__dirname, 'dist'));
        console.log('❌', distFiles);
      } catch (e) {
        console.log('❌ dist/ directory does not exist!');
      }
      process.exit(1);
    }
    
    console.log('✅ app.js found, starting server...');
    console.log('📁 App path:', appPath);
    console.log('📁 File exists:', fs.existsSync(appPath));
    console.log('📁 File size:', fs.statSync(appPath).size, 'bytes');
    
  } catch (error) {
    console.log('⚠️ Setup failed:', error.message);
  }
}

// Führe Setup aus
setupDatabase();
