import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌆 Erstelle Beispieldaten für Hausverwaltung...');

  // Haus A erstellen
  const houseA = await prisma.house.create({
    data: {
      name: 'Haus A',
      description: 'Hauptgebäude - Allgemeine Haft',
      isActive: true
    }
  });

  // Stationen für Haus A
  const stationA1 = await prisma.station.create({
    data: {
      name: 'Station A1',
      description: 'Erdgeschoss - Allgemeine Haft',
      houseId: houseA.id,
      isActive: true
    }
  });

  const stationA2 = await prisma.station.create({
    data: {
      name: 'Station A2',
      description: '1. Stock - Allgemeine Haft',
      houseId: houseA.id,
      isActive: true
    }
  });

  // Zellen für Station A1
  await prisma.cell.createMany({
    data: [
      { number: 'A1-101', description: 'Einzelzelle', capacity: 1, stationId: stationA1.id },
      { number: 'A1-102', description: 'Einzelzelle', capacity: 1, stationId: stationA1.id },
      { number: 'A1-103', description: 'Einzelzelle', capacity: 1, stationId: stationA1.id },
      { number: 'A1-104', description: 'Doppelzelle', capacity: 2, stationId: stationA1.id },
      { number: 'A1-105', description: 'Doppelzelle', capacity: 2, stationId: stationA1.id }
    ]
  });

  // Zellen für Station A2
  await prisma.cell.createMany({
    data: [
      { number: 'A2-201', description: 'Einzelzelle', capacity: 1, stationId: stationA2.id },
      { number: 'A2-202', description: 'Einzelzelle', capacity: 1, stationId: stationA2.id },
      { number: 'A2-203', description: 'Einzelzelle', capacity: 1, stationId: stationA2.id },
      { number: 'A2-204', description: 'Doppelzelle', capacity: 2, stationId: stationA2.id },
      { number: 'A2-205', description: 'Doppelzelle', capacity: 2, stationId: stationA2.id }
    ]
  });

  // Haus B erstellen
  const houseB = await prisma.house.create({
    data: {
      name: 'Haus B',
      description: 'Nebengebäude - Sicherheitshaft',
      isActive: true
    }
  });

  // Stationen für Haus B
  const stationB1 = await prisma.station.create({
    data: {
      name: 'Station B1',
      description: 'Erdgeschoss - Sicherheitshaft',
      houseId: houseB.id,
      isActive: true
    }
  });

  const stationB2 = await prisma.station.create({
    data: {
      name: 'Station B2',
      description: '1. Stock - Sicherheitshaft',
      houseId: houseB.id,
      isActive: true
    }
  });

  // Zellen für Station B1
  await prisma.cell.createMany({
    data: [
      { number: 'B1-101', description: 'Sicherheitszelle', capacity: 1, stationId: stationB1.id },
      { number: 'B1-102', description: 'Sicherheitszelle', capacity: 1, stationId: stationB1.id },
      { number: 'B1-103', description: 'Sicherheitszelle', capacity: 1, stationId: stationB1.id },
      { number: 'B1-104', description: 'Sicherheitszelle', capacity: 1, stationId: stationB1.id },
      { number: 'B1-105', description: 'Sicherheitszelle', capacity: 1, stationId: stationB1.id }
    ]
  });

  // Zellen für Station B2
  await prisma.cell.createMany({
    data: [
      { number: 'B2-201', description: 'Sicherheitszelle', capacity: 1, stationId: stationB2.id },
      { number: 'B2-202', description: 'Sicherheitszelle', capacity: 1, stationId: stationB2.id },
      { number: 'B2-203', description: 'Sicherheitszelle', capacity: 1, stationId: stationB2.id },
      { number: 'B2-204', description: 'Sicherheitszelle', capacity: 1, stationId: stationB2.id },
      { number: 'B2-205', description: 'Sicherheitszelle', capacity: 1, stationId: stationB2.id }
    ]
  });

  // Haus C erstellen
  const houseC = await prisma.house.create({
    data: {
      name: 'Haus C',
      description: 'Isolationsgebäude - Einzelhaft',
      isActive: true
    }
  });

  // Stationen für Haus C
  const stationC1 = await prisma.station.create({
    data: {
      name: 'Station C1',
      description: 'Erdgeschoss - Einzelhaft',
      houseId: houseC.id,
      isActive: true
    }
  });

  // Zellen für Station C1
  await prisma.cell.createMany({
    data: [
      { number: 'C1-101', description: 'Isolationszelle', capacity: 1, stationId: stationC1.id },
      { number: 'C1-102', description: 'Isolationszelle', capacity: 1, stationId: stationC1.id },
      { number: 'C1-103', description: 'Isolationszelle', capacity: 1, stationId: stationC1.id },
      { number: 'C1-104', description: 'Isolationszelle', capacity: 1, stationId: stationC1.id },
      { number: 'C1-105', description: 'Isolationszelle', capacity: 1, stationId: stationC1.id }
    ]
  });

  console.log('✅ Beispieldaten für Hausverwaltung erstellt!');
  console.log(`   - 3 Häuser erstellt`);
  console.log(`   - 5 Stationen erstellt`);
  console.log(`   - 25 Zellen erstellt`);
}

main()
  .catch((e) => {
    console.error('❌ Fehler beim Erstellen der Beispieldaten:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

