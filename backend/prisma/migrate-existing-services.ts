import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateExistingServices() {
  console.log('🔄 Migriere bestehende Services zu Prozessdefinitionen...')

  try {
    // Alle Services mit antragstyp finden
    const services = await prisma.service.findMany({
      where: { 
        antragstyp: { not: null } 
      }
    })

    console.log(`📋 Gefunden: ${services.length} Services mit Antragstyp`)

    for (const service of services) {
      console.log(`🔄 Migriere Service ${service.id}: ${service.antragstyp}`)
      
      // Passende Prozessdefinition finden
      const process = await prisma.processDefinition.findFirst({
        where: { name: service.antragstyp! }
      })
      
      if (process) {
        // Service mit Prozess verknüpfen
        await prisma.service.update({
          where: { id: service.id },
          data: { processId: process.id }
        })
        
        console.log(`✅ Service ${service.id} mit Prozess "${process.name}" verknüpft`)
        
        // Wenn Status PENDING ist, automatisch ersten Schritt anwenden
        if (service.status === 'PENDING') {
          const firstStep = await prisma.processStep.findFirst({
            where: { 
              processId: process.id,
              orderIndex: 0 
            }
          })
          
          if (firstStep) {
            await prisma.service.update({
              where: { id: service.id },
              data: { status: firstStep.statusName }
            })
            
            console.log(`✅ Status von Service ${service.id} auf "${firstStep.statusName}" aktualisiert`)
          }
        }
      } else {
        console.log(`⚠️ Keine Prozessdefinition gefunden für: ${service.antragstyp}`)
      }
    }

    console.log('✅ Migration abgeschlossen!')
    
  } catch (error) {
    console.error('❌ Fehler bei der Migration:', error)
  } finally {
    await prisma.$disconnect()
  }
}

migrateExistingServices()
