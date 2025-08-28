import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkServices() {
  try {
    const services = await prisma.service.findMany({
      include: { 
        createdByUser: true, 
        assignedToUser: true 
      }
    })
    
    console.log('Alle Services in der Datenbank:')
    console.log('===============================')
    
    services.forEach(s => {
      console.log(`ID: ${s.id}`)
      console.log(`  Titel: ${s.title}`)
      console.log(`  Status: ${s.status}`)
      console.log(`  Antragstyp: ${s.antragstyp || 'kein'}`)
      console.log(`  Erstellt von: ${s.createdByUser?.firstName} ${s.createdByUser?.lastName}`)
      console.log(`  Zugewiesen an: ${s.assignedToUser?.firstName} ${s.assignedToUser?.lastName}`)
      console.log(`  Erstellt am: ${s.createdAt}`)
      console.log('---')
    })
    
    console.log(`\nGesamt: ${services.length} Services`)
    
  } catch (error) {
    console.error('Fehler:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkServices()

