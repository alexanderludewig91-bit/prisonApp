const { execSync } = require('child_process');

async function seedDatabase() {
  try {
    console.log('🌱 Checking if database needs seeding...');
    
    // Prüfe ob DB leer ist und seede Haupt-Daten
    execSync('npm run db:seed', { stdio: 'inherit' });
    console.log('✅ Main data seeded successfully');
    
    // Seede Häuser-Daten
    execSync('npm run db:seed-houses', { stdio: 'inherit' });
    console.log('✅ Houses data seeded successfully');
    
  } catch (error) {
    console.log('⚠️ Seeding failed or already done:', error.message);
  }
}

// Führe Seeding aus
seedDatabase();
