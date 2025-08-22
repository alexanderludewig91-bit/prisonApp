import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Zuerst alle bestehenden Gruppen löschen
  console.log('🗑️ Lösche alle bestehenden Gruppen...')
  await prisma.group.deleteMany({})

  // Justizvollzug-Gruppen erstellen
  const groups = [
    // Hauptkategorien
    {
      name: 'PS All Users',
      description: 'Alle Benutzer',
      category: 'SYSTEM',
      permissions: JSON.stringify(['read'])
    },
    {
      name: 'PS Inmates',
      description: 'Insassen',
      category: 'INMATE',
      permissions: JSON.stringify(['create_service', 'read_own_services', 'update_own_services'])
    },
    
    // Verwaltungsabteilungen
    {
      name: 'PS General Enforcement Service',
      description: 'Allgemeiner Vollzugsdienst (AVD)',
      category: 'STAFF',
      permissions: JSON.stringify(['read_all_services', 'update_services', 'assign_services', 'workflow_approval'])
    },
    {
      name: 'PS Vollzugsabteilungsleitung',
      description: 'Vollzugsabteilungsleitung (VAL)',
      category: 'STAFF',
      permissions: JSON.stringify(['read_all_services', 'update_services', 'assign_services', 'workflow_approval', 'department_approval'])
    },
    {
      name: 'PS Vollzugsleitung',
      description: 'Vollzugsleitung (VL)',
      category: 'STAFF',
      permissions: JSON.stringify(['read_all_services', 'update_services', 'assign_services', 'workflow_approval', 'department_approval', 'management_approval'])
    },
    {
      name: 'PS Anstaltsleitung',
      description: 'Anstaltsleitung (AL)',
      category: 'STAFF',
      permissions: JSON.stringify(['read_all_services', 'update_services', 'assign_services', 'workflow_approval', 'department_approval', 'management_approval', 'final_approval'])
    },
    
    // Spezialabteilungen
    {
      name: 'PS Payments Office',
      description: 'Zahlstelle',
      category: 'STAFF',
      permissions: JSON.stringify(['read_payment_services', 'update_payment_services', 'payment_processing'])
    },
    {
      name: 'PS Medical Staff',
      description: 'Ärztliches Personal',
      category: 'STAFF',
      permissions: JSON.stringify(['read_medical_services', 'update_medical_services', 'medical_approval'])
    },
    
    // System-Gruppen
    {
      name: 'PS Designers',
      description: 'Administratoren',
      category: 'ADMIN',
      permissions: JSON.stringify(['all_permissions'])
    }
  ]

  console.log('📝 Erstelle neue Gruppen...')
  for (const group of groups) {
    await prisma.group.create({
      data: group
    })
  }

  // Admin-Benutzer automatisch den richtigen Gruppen zuordnen
  console.log('👤 Ordne Admin-Benutzer Gruppen zu...')
  const adminUser = await prisma.user.findFirst({
    where: { username: 'admin' }
  })

  if (adminUser) {
    // Alle bestehenden Gruppen-Zuordnungen für admin löschen
    await prisma.userGroup.deleteMany({
      where: { userId: adminUser.id }
    })

    // Neue Zuordnungen erstellen
    const allUsersGroup = await prisma.group.findFirst({
      where: { name: 'PS All Users' }
    })
    const designersGroup = await prisma.group.findFirst({
      where: { name: 'PS Designers' }
    })

    if (allUsersGroup) {
      await prisma.userGroup.create({
        data: {
          userId: adminUser.id,
          groupId: allUsersGroup.id,
          role: 'MEMBER'
        }
      })
    }

    if (designersGroup) {
      await prisma.userGroup.create({
        data: {
          userId: adminUser.id,
          groupId: designersGroup.id,
          role: 'MEMBER'
        }
      })
    }

    console.log(`✅ Admin-Benutzer "${adminUser.username}" erfolgreich zugeordnet`)
  } else {
    console.log('⚠️ Admin-Benutzer nicht gefunden - bitte manuell zuordnen')
  }

  console.log('✅ Groups seeded successfully!')

  // Test-Benutzer für jede Gruppe erstellen
  console.log('👥 Erstelle Test-Benutzer...')
  
  // Passwort hashen
  const hashedPassword = await bcrypt.hash('test', 10)
  
  // Test-Benutzer definieren
  const testUsers = [
    {
      username: 'admin',
      email: 'admin@prison.com',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator',
      groups: ['PS All Users', 'PS Designers']
    },
    {
      username: 'inmate001',
      email: 'inmate001@prison.com',
      password: hashedPassword,
      firstName: 'Max',
      lastName: 'Mustermann',
      groups: ['PS All Users', 'PS Inmates']
    },
    {
      username: 'avd001',
      email: 'avd001@prison.com',
      password: hashedPassword,
      firstName: 'Maria',
      lastName: 'Müller',
      groups: ['PS All Users', 'PS General Enforcement Service']
    },
    {
      username: 'val001',
      email: 'val001@prison.com',
      password: hashedPassword,
      firstName: 'Hans',
      lastName: 'Schmidt',
      groups: ['PS All Users', 'PS Vollzugsabteilungsleitung']
    },
    {
      username: 'vl001',
      email: 'vl001@prison.com',
      password: hashedPassword,
      firstName: 'Anna',
      lastName: 'Weber',
      groups: ['PS All Users', 'PS Vollzugsleitung']
    },
    {
      username: 'al001',
      email: 'al001@prison.com',
      password: hashedPassword,
      firstName: 'Peter',
      lastName: 'Fischer',
      groups: ['PS All Users', 'PS Anstaltsleitung']
    },
    {
      username: 'zahlstelle001',
      email: 'zahlstelle001@prison.com',
      password: hashedPassword,
      firstName: 'Lisa',
      lastName: 'Klein',
      groups: ['PS All Users', 'PS Payments Office']
    },
    {
      username: 'arzt001',
      email: 'arzt001@prison.com',
      password: hashedPassword,
      firstName: 'Dr. Thomas',
      lastName: 'Wagner',
      groups: ['PS All Users', 'PS Medical Staff']
    }
  ]

  // Bestehende Benutzer löschen (außer admin und inmate falls sie existieren)
  console.log('🗑️ Lösche bestehende Test-Benutzer...')
  
  // Zuerst alle abhängigen Daten löschen
  await prisma.activity.deleteMany({})
  await prisma.service.deleteMany({})
  await prisma.userGroup.deleteMany({})
  
  // Dann die Benutzer löschen
  await prisma.user.deleteMany({
    where: {
      username: {
        in: testUsers.map(u => u.username)
      }
    }
  })

  // Benutzer erstellen und Gruppen zuordnen
  for (const userData of testUsers) {
    console.log(`👤 Erstelle Benutzer: ${userData.username}`)
    
    const user = await prisma.user.create({
      data: {
        username: userData.username,
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName
      }
    })

    // Gruppen zuordnen
    for (const groupName of userData.groups) {
      const group = await prisma.group.findFirst({
        where: { name: groupName }
      })
      
      if (group) {
        await prisma.userGroup.create({
          data: {
            userId: user.id,
            groupId: group.id,
            role: 'MEMBER'
          }
        })
      }
    }
  }

  console.log('✅ Test-Benutzer erfolgreich erstellt!')
  console.log('📋 Login-Daten:')
  console.log('   Alle Benutzer haben das Passwort: "test"')
  console.log('   Verfügbare Benutzer:')
  testUsers.forEach(user => {
    console.log(`   - ${user.username} (${user.firstName} ${user.lastName})`)
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
