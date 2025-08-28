import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testDynamicWorkflow() {
  console.log('🧪 Teste dynamische Workflow-Engine...')

  try {
    // 1. Test-Service erstellen
    console.log('📝 Erstelle Test-Service...')
    
    const testService = await prisma.service.create({
      data: {
        title: 'Test Besuchsantrag',
        description: 'Test für dynamische Workflow-Engine',
        priority: 'MEDIUM',
        antragstyp: 'Besuch',
        createdBy: 1 // admin user
      },
      include: {
        createdByUser: true,
        process: {
          include: {
            steps: {
              include: {
                assignments: {
                  include: { group: true }
                }
              },
              orderBy: { orderIndex: 'asc' }
            }
          }
        }
      }
    })

    console.log('✅ Test-Service erstellt:')
    console.log(`  - ID: ${testService.id}`)
    console.log(`  - Status: ${testService.status}`)
    console.log(`  - Prozess: ${testService.process?.name}`)
    console.log(`  - Schritte: ${testService.process?.steps.length}`)

    // 2. Verfügbare Übergänge prüfen
    console.log('\n🔍 Prüfe verfügbare Übergänge...')
    
    const currentStep = testService.process?.steps.find(step => step.statusName === testService.status)
    console.log(`  - Aktueller Schritt: ${currentStep?.title} (${currentStep?.statusName})`)
    
    const nextSteps = testService.process?.steps.filter(step => step.orderIndex > (currentStep?.orderIndex || 0))
    console.log(`  - Verfügbare Übergänge: ${nextSteps?.length || 0}`)
    
    nextSteps?.forEach(step => {
      console.log(`    → ${step.title} (${step.statusName})`)
      step.assignments.forEach(assignment => {
        console.log(`      Zugewiesen an: ${assignment.group.name}`)
      })
    })

    // 3. Status-Übergang simulieren
    if (nextSteps && nextSteps.length > 0) {
      const nextStep = nextSteps[0]
      console.log(`\n🔄 Simuliere Übergang zu: ${nextStep.title}`)
      
      const updatedService = await prisma.service.update({
        where: { id: testService.id },
        data: { status: nextStep.statusName },
        include: {
          createdByUser: true,
          assignedToUser: true,
          process: {
            include: {
              steps: {
                include: {
                  assignments: {
                    include: { group: true }
                  }
                },
                orderBy: { orderIndex: 'asc' }
              }
            }
          }
        }
      })
      
      console.log(`✅ Status aktualisiert: ${updatedService.status}`)
      console.log(`✅ Zugewiesen an: ${updatedService.assignedToUser?.firstName} ${updatedService.assignedToUser?.lastName}`)
    }

    // 4. Cleanup
    console.log('\n🧹 Cleanup...')
    await prisma.service.delete({
      where: { id: testService.id }
    })
    console.log('✅ Test-Service gelöscht')

    console.log('\n🎉 Test erfolgreich abgeschlossen!')
    
  } catch (error) {
    console.error('❌ Test fehlgeschlagen:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testDynamicWorkflow()

