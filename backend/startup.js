const { execSync } = require('child_process');

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
    
  } catch (error) {
    console.log('⚠️ Setup failed:', error.message);
  }
}

// Führe Setup aus
setupDatabase();
