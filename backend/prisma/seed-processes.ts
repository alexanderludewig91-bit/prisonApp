import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding process definitions...')

  // Beispiel-Prozesse erstellen
  const processes = [
    {
      name: 'Besuch',
      description: 'Antrag auf Besuchserlaubnis',
      steps: [
        {
          title: 'Antrag prüfen',
          statusName: 'PENDING',
          description: 'Erstprüfung des Besuchsantrags',
          orderIndex: 0,
          isDecision: false,
          groupNames: ['PS General Enforcement Service']
        },
        {
          title: 'Sicherheitsbewertung',
          statusName: 'SECURITY_REVIEW',
          description: 'Sicherheitsprüfung des Besuchers',
          orderIndex: 1,
          isDecision: true,
          groupNames: ['PS General Enforcement Service']
        },
        {
          title: 'Genehmigung',
          statusName: 'APPROVED',
          description: 'Finale Genehmigung durch Vollzugsabteilungsleitung',
          orderIndex: 2,
          isDecision: true,
          groupNames: ['PS Vollzugsabteilungsleitung']
        }
      ]
    },
    {
      name: 'Taschengeld-Antrag',
      description: 'Antrag auf Taschengeld-Auszahlung',
      steps: [
        {
          title: 'Antrag prüfen',
          statusName: 'PENDING',
          description: 'Erstprüfung des Taschengeld-Antrags',
          orderIndex: 0,
          isDecision: false,
          groupNames: ['PS Payments Office']
        },
        {
          title: 'Zahlungsfreigabe',
          statusName: 'PAYMENT_APPROVAL',
          description: 'Genehmigung der Zahlung',
          orderIndex: 1,
          isDecision: true,
          groupNames: ['PS Payments Office']
        }
      ]
    },
    {
      name: 'Gesundheit',
      description: 'Antrag auf medizinische Behandlung',
      steps: [
        {
          title: 'Antrag prüfen',
          statusName: 'PENDING',
          description: 'Erstprüfung des Gesundheitsantrags',
          orderIndex: 0,
          isDecision: false,
          groupNames: ['PS Medical Staff']
        },
        {
          title: 'Medizinische Bewertung',
          statusName: 'MEDICAL_REVIEW',
          description: 'Ärztliche Bewertung der Notwendigkeit',
          orderIndex: 1,
          isDecision: true,
          groupNames: ['PS Medical Staff']
        },
        {
          title: 'Genehmigung',
          statusName: 'APPROVED',
          description: 'Finale Genehmigung durch Vollzugsabteilungsleitung',
          orderIndex: 2,
          isDecision: true,
          groupNames: ['PS Vollzugsabteilungsleitung']
        }
      ]
    },
    {
      name: 'Vollzugslockerung',
      description: 'Antrag auf Vollzugslockerung',
      steps: [
        {
          title: 'Antrag prüfen',
          statusName: 'PENDING',
          description: 'Erstprüfung des Vollzugslockerungsantrags',
          orderIndex: 0,
          isDecision: false,
          groupNames: ['PS General Enforcement Service']
        },
        {
          title: 'Sicherheitsbewertung',
          statusName: 'SECURITY_ASSESSMENT',
          description: 'Umfassende Sicherheitsbewertung',
          orderIndex: 1,
          isDecision: true,
          groupNames: ['PS General Enforcement Service']
        },
        {
          title: 'Management-Entscheidung',
          statusName: 'MANAGEMENT_REVIEW',
          description: 'Entscheidung durch Vollzugsleitung',
          orderIndex: 2,
          isDecision: true,
          groupNames: ['PS Vollzugsleitung']
        }
      ]
    }
  ]

  for (const processData of processes) {
    console.log(`📝 Erstelle Prozess: ${processData.name}`)
    
    // Prozess erstellen
    const process = await prisma.processDefinition.create({
      data: {
        name: processData.name,
        description: processData.description
      }
    })

    // Schritte erstellen
    for (const stepData of processData.steps) {
      console.log(`  - Erstelle Schritt: ${stepData.title}`)
      
      // Gruppen finden
      const groups = await prisma.group.findMany({
        where: {
          name: {
            in: stepData.groupNames
          }
        }
      })

      if (groups.length === 0) {
        console.warn(`  ⚠️ Keine Gruppen gefunden für: ${stepData.groupNames.join(', ')}`)
        continue
      }

      // Schritt erstellen
      const step = await prisma.processStep.create({
        data: {
          processId: process.id,
          title: stepData.title,
          statusName: stepData.statusName,
          description: stepData.description,
          orderIndex: stepData.orderIndex,
          isDecision: stepData.isDecision
        }
      })

      // Gruppen-Zuweisungen erstellen
      for (const group of groups) {
        await prisma.processStepAssignment.create({
          data: {
            stepId: step.id,
            groupId: group.id
          }
        })
      }
    }
  }

  console.log('✅ Prozessdefinitionen erfolgreich erstellt!')
}

main()
  .catch((e) => {
    console.error('❌ Fehler beim Seeding der Prozesse:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

