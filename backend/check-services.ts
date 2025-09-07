import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkServices() {
  try {
    const services = await prisma.service.findMany({
      include: { 
        createdByUser: true, 
        assignedToUser: true,
        assignedToGroupRef: true
      }
    })
    
    console.log('Alle Services in der Datenbank:')
    console.log('===============================')
    
    services.forEach(s => {
      console.log(`ID: ${s.id}`)
      console.log(`  Titel: ${s.title}`)
      console.log(`  Status: ${s.status}`)
      console.log(`  Service-Typ: ${s.serviceType || 'kein'}`)
      console.log(`  Priorität: ${s.priority || 'keine'}`)
      console.log(`  Entscheidung: ${s.decision || 'ausstehend'}`)
      console.log(`  Erstellt von: ${s.createdByUser?.firstName} ${s.createdByUser?.lastName}`)
      console.log(`  Zugewiesen an: ${s.assignedToUser?.firstName || 'niemand'} ${s.assignedToUser?.lastName || ''}`)
      console.log(`  Zugewiesen an Gruppe: ${s.assignedToGroupRef?.name || 'keine'}`)
      console.log(`  Erstellt am: ${s.createdAt}`)
      console.log('---')
    })
    
    // Statistiken
    const statusCounts = services.reduce((acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const decisionCounts = services.reduce((acc, s) => {
      const decision = s.decision || 'ausstehend';
      acc[decision] = (acc[decision] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log(`\n📊 Statistiken:`)
    console.log(`Gesamt: ${services.length} Services`)
    console.log(`\nStatus-Verteilung:`)
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`)
    })
    console.log(`\nEntscheidungs-Verteilung:`)
    Object.entries(decisionCounts).forEach(([decision, count]) => {
      console.log(`  ${decision}: ${count}`)
    })
    
  } catch (error) {
    console.error('Fehler:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkServices()


