// ============================================================================
// IMPORTS & DEPENDENCIES
// ============================================================================
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  FileText
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import jsPDF from 'jspdf'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================
/**
 * Service Interface - Definiert die Struktur eines Antrags
 * Enthält alle relevanten Daten für die Antragsbearbeitung
 */
interface Service {
  id: number
  title: string
  description: string
  status: string // PENDING, IN_PROGRESS, COMPLETED
  priority: string // HIGH, URGENT
  decision?: string | null // APPROVED, REJECTED, RETURNED
  serviceType: string
  createdAt: string
  updatedAt: string
  createdByUser: {
    id: number
    username: string
    firstName: string
    lastName: string
    email: string
    createdAt: string
  }
  assignedToUser?: {
    id: number
    username: string
    firstName: string
    lastName: string
  }
  assignedToGroupRef?: {
    id: number
    name: string
    description?: string
  }
  createdByUserAssignment?: {
    cell: {
      number: string
      station: {
        name: string
        house: {
          name: string
        }
      }
    }
  }
  decisionDetails?: {
    decision: string
    reason: string
    who: string
    when: string
  } | null
  activities: Array<{
    id: number
    action: string
    details: string
    when: string
    who: string
    user?: {
      id: number
      username: string
      firstName: string
      lastName: string
    }
  }>
}



// ============================================================================
// MAIN COMPONENT
// ============================================================================
/**
 * ServiceDetailParticipationMoney - Spezielle Komponente für Teilhabegeldanträge
 * Basiert auf der ursprünglichen ServiceDetail.tsx, aber angepasst für spezifische
 * Teilhabegeld-Workflows und UI-Elemente
 */
const ServiceDetailParticipationMoney = () => {
  // ============================================================================
  // HOOKS & BASIC STATE
  // ============================================================================
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  // Core Service Data
  const [service, setService] = useState<Service | null>(null)
  const [loading, setLoading] = useState(true)
  
  // ============================================================================
  // STATUS & DECISION MANAGEMENT
  // ============================================================================
  const [newStatus, setNewStatus] = useState('')
  const [statusReason, setStatusReason] = useState('')
  const [newDecision, setNewDecision] = useState('')
  const [manualDecisionReason, setManualDecisionReason] = useState('')
  const [showStatusModal, setShowStatusModal] = useState(false)
  
  // ============================================================================
  // WORKFLOW ACTION STATES
  // ============================================================================
  // Bearbeiter-Aktionen (Hauptfunktionalität der Komponente)
  const [selectedAction, setSelectedAction] = useState<'insassen-kontaktieren' | 'weiterleiten' | 'entscheiden' | 'kommentieren' | 'personal-notification' | null>(null)
  const [selectedContactType, setSelectedContactType] = useState<'rückfrage' | 'information' | null>(null)
  const [rückfrageText, setRückfrageText] = useState('')
  const [informationText, setInformationText] = useState('')
  const [selectedStaffGroup, setSelectedStaffGroup] = useState('')
  const [weiterleitungsKommentar, setWeiterleitungsKommentar] = useState('')
  const [kommentarText, setKommentarText] = useState('')
  const [savingComment, setSavingComment] = useState(false)
  const [staffGroups, setStaffGroups] = useState<Array<{id: number, name: string, description?: string}>>([])
  const [loadingStaffGroups, setLoadingStaffGroups] = useState(false)
  const [forwardingService, setForwardingService] = useState(false)
  
  // ============================================================================
  // DECISION WORKFLOW STATES
  // ============================================================================
  const [showStatusChangeDialog, setShowStatusChangeDialog] = useState(false)
  const [pendingComment, setPendingComment] = useState('')
  const [selectedDecision, setSelectedDecision] = useState<'APPROVED' | 'REJECTED' | 'RETURNED' | null>(null)
  const [decisionReason, setDecisionReason] = useState('')
  const [showDecisionConfirmationModal, setShowDecisionConfirmationModal] = useState(false)
  const [showAvdNotificationModal, setShowAvdNotificationModal] = useState(false)
  const [personalNotificationDetails, setPersonalNotificationDetails] = useState('')
  const [showStatusToInProgressModal, setShowStatusToInProgressModal] = useState(false)
  const [showPriorityModal, setShowPriorityModal] = useState(false)
  const [newPriority, setNewPriority] = useState('')
  const [showFurtherProcessing, setShowFurtherProcessing] = useState(false)
  const [selectedFurtherProcessingGroup, setSelectedFurtherProcessingGroup] = useState('')
  const [furtherProcessingNotes, setFurtherProcessingNotes] = useState('')
  
  // ============================================================================
  // TEILHABEGELD CALCULATION STATES
  // ============================================================================
  const [showCalculationModal, setShowCalculationModal] = useState(false)
  const [eckverguetung, setEckverguetung] = useState('')
  const [hausgeld, setHausgeld] = useState('')
  const [eigengeld, setEigengeld] = useState('')
  const [arbeitstage, setArbeitstage] = useState('')
  const [anspruchstage, setAnspruchstage] = useState('')
  const [calculatedResult, setCalculatedResult] = useState<string | null>(null)

  // ============================================================================
  // CALCULATION FUNCTIONS
  // ============================================================================
  /**
   * Berechnet das Teilhabegeld basierend auf der Formel:
   * ((0,14 x Eckvergütung - Hausgeld - Eigengeld) / Arbeitstage im Monat) x Anspruchstage
   */
  const calculateTeilhabegeld = () => {
    const eckverguetungNum = parseFloat(eckverguetung) || 0
    const hausgeldNum = parseFloat(hausgeld) || 0
    const eigengeldNum = parseFloat(eigengeld) || 0
    const arbeitstageNum = parseFloat(arbeitstage) || 0
    const anspruchstageNum = parseFloat(anspruchstage) || 0

    // Validierungsprüfungen
    if (arbeitstageNum === 0) {
      setCalculatedResult('Fehler: Arbeitstage dürfen nicht 0 sein')
      return
    }

    if (eckverguetungNum < 0 || hausgeldNum < 0 || eigengeldNum < 0 || arbeitstageNum < 0 || anspruchstageNum < 0) {
      setCalculatedResult('Fehler: Die Eingaben enthalten negative Werte')
      return
    }

    const teilhabegeld = ((0.14 * eckverguetungNum - hausgeldNum - eigengeldNum) / arbeitstageNum) * anspruchstageNum

    if (teilhabegeld < 0) {
      setCalculatedResult(`Fehler: Das Ergebnis ist negativ: ${teilhabegeld.toFixed(2)}€`)
      return
    }

    setCalculatedResult(teilhabegeld.toFixed(2))
  }

  /**
   * Übernimmt das Berechnungsergebnis in das Begründungsfeld und schließt das Modal
   */
  const applyCalculation = () => {
    if (calculatedResult) {
      const calculationText = `Ihr Antrag wurde genehmigt. Sie erhalten Teilhabegeld in Höhe von ${calculatedResult}€\n\nBerechnung:\nEckvergütung: ${eckverguetung}€\nHausgeld: ${hausgeld}€\nEigengeld: ${eigengeld}€\nArbeitstage: ${arbeitstage}\nAnspruchstage: ${anspruchstage}\n\nHinweis zur Berechnung:\n((0,14 x Eckvergützung) - Hausgeld - Eigengeld) / Arbeitstage) x Anspruchstage = Teilhabegeld \n\nRechtsbehelfsbelehrung:
Gegen diesen Bescheid können Sie gemäß §§ 109 ff. StVollzG i.V.m. § 130 Nr. 2 HmbStVollzG binnen zwei Wochen nach schriftlicher Bekanntgabe einen Antrag auf gerichtliche Entscheidung beim Landgericht Hamburg einreichen. Der Antrag kann schriftlich gestellt und muss dann innerhalb von zwei Wochen bei Gericht eingegangen sein (Postanschrift: Landgericht Hamburg, Strafvollstreckungskammern, Sievekingplatz 3, 20355 Hamburg). Der Antrag kann innerhalb der Frist auch zur Niederschrift einer Geschäftsstelle des Landgerichts Hamburg oder des Amtsgerichts, in dessen Bezirk die JVA Fuhlsbüttel liegt, gestellt werden.`
      
      setDecisionReason(calculationText)
      setShowCalculationModal(false)
      
      // Modal zurücksetzen
      setEckverguetung('')
      setHausgeld('')
      setEigengeld('')
      setArbeitstage('')
      setAnspruchstage('')
      setCalculatedResult(null)
    }
  }

  // ============================================================================
  // EFFECT HOOKS
  // ============================================================================
  // Service-Details laden bei Komponenten-Mount oder ID-Änderung
  useEffect(() => {
    if (id) {
      fetchServiceDetails()
    }
  }, [id])

  // Staff-Gruppen laden wenn Weiterleiten oder weiterführende Bearbeitung ausgewählt wird
  useEffect(() => {
    if (selectedAction === 'weiterleiten' || showFurtherProcessing) {
      fetchStaffGroups()
    }
  }, [selectedAction, showFurtherProcessing])

  // ============================================================================
  // DATA FETCHING FUNCTIONS
  // ============================================================================
  /**
   * Lädt die Service-Details vom Backend
   * Wird beim Komponenten-Mount und nach Aktionen aufgerufen
   */
  const fetchServiceDetails = async () => {
    try {
      const response = await api.get(`/services/${id}`)
      setService(response.data)
    } catch (error) {
      console.error('Fehler beim Laden der Service-Details:', error)
      setService(null)
    } finally {
      setLoading(false)
    }
  }





  // ============================================================================
  // CORE BUSINESS LOGIC HANDLERS
  // ============================================================================
  /**
   * Behandelt Status- und Entscheidungsänderungen
   * Kann sowohl Status als auch Entscheidung in einem Aufruf ändern
   */
  const handleStatusChange = async () => {
    if ((!newStatus && !newDecision) || (!statusReason.trim() && !manualDecisionReason.trim())) return

    try {
      // Status ändern falls ausgewählt
      if (newStatus && statusReason.trim()) {
        await api.patch(`/services/${id}/status`, { 
          status: newStatus,
          reason: statusReason
        })
      }

      // Entscheidung ändern falls ausgewählt
      if (newDecision && manualDecisionReason.trim()) {
        await api.patch(`/services/${id}/decision`, {
          decision: newDecision,
          reason: manualDecisionReason
        })
      }

      setShowStatusModal(false)
      setNewStatus('')
      setStatusReason('')
      setNewDecision('')
      setManualDecisionReason('')
      fetchServiceDetails()
    } catch (error) {
      console.error('Fehler beim Ändern des Status/der Entscheidung:', error)
    }
  }

  const handleSaveComment = async () => {
    if (!kommentarText.trim()) return

    // Prüfen ob Status "PENDING" ist und Dialog anzeigen
    if (service?.status === 'PENDING') {
      setPendingComment(kommentarText)
      setShowStatusChangeDialog(true)
      return
    }

    // Normaler Kommentar-Speichervorgang
    await saveComment(kommentarText)
  }

  const saveComment = async (commentText: string) => {
    setSavingComment(true)
    try {
      await api.post(`/services/${id}/comments`, {
        content: commentText
      })

      // Kommentar erfolgreich gespeichert
      setKommentarText('')
      setSelectedAction(null) // Aktions-Auswahl zurücksetzen
      fetchServiceDetails() // Aktivitätsverlauf aktualisieren
    } catch (error) {
      console.error('Fehler beim Speichern des Kommentars:', error)
    } finally {
      setSavingComment(false)
    }
  }

  const handleStatusChangeDialog = async (changeStatus: boolean) => {
    setShowStatusChangeDialog(false)
    
    // Kommentar speichern
    await saveComment(pendingComment)
    
    // Status ändern wenn gewünscht
    if (changeStatus) {
      try {
        await api.patch(`/services/${id}/status`, {
          status: 'IN_PROGRESS',
          reason: 'Automatische Status-Änderung nach Kommentar'
        })
        fetchServiceDetails() // Service-Details aktualisieren
      } catch (error) {
        console.error('Fehler beim Ändern des Status:', error)
      }
    }
    
    setPendingComment('')
  }

  const handleDecisionSelect = (decision: 'APPROVED' | 'REJECTED' | 'RETURNED') => {
    setSelectedDecision(decision)
    
    // Weiterführende Bearbeitung zurücksetzen wenn sich die Entscheidung ändert
    setShowFurtherProcessing(false)
    setSelectedFurtherProcessingGroup('')
    setFurtherProcessingNotes('')
    
    // Standardbegründungen vorausfüllen
    switch (decision) {
      case 'APPROVED':
        setDecisionReason('Ihr Antrag wurde genehmigt')
        break
      case 'REJECTED':
        setDecisionReason('Ihr Antrag wurde abgelehnt')
        break
      case 'RETURNED':
        setDecisionReason('Ihr Antrag enthält fehlerhafte Angaben und wurde zurückgewiesen. Bitte stellen Sie einen neuen Antrag')
        break
    }
  }

  const handleCompleteWithDecision = async () => {
    if (!selectedDecision || !decisionReason.trim()) {
      alert('Bitte wählen Sie eine Entscheidung und geben Sie eine Begründung an.')
      return
    }

    // Bestätigungsmodal anzeigen
    setShowDecisionConfirmationModal(true)
  }

  const confirmCompleteWithDecision = async () => {
    try {
      await api.post(`/services/${id}/complete-with-decision`, {
        decision: selectedDecision,
        reason: decisionReason
      })

      // Erfolgreich abgeschlossen - UI zurücksetzen
      setSelectedDecision(null)
      setDecisionReason('')
      setSelectedAction(null)
      setShowDecisionConfirmationModal(false)
      
      // Service-Details neu laden
      fetchServiceDetails()
      
      // Erfolg wird durch das Neuladen der Service-Details und das Verschwinden der Entscheidungsoptionen angezeigt
    } catch (error) {
      console.error('Fehler beim Abschließen der Entscheidung:', error)
      alert('Fehler beim Abschließen der Entscheidung. Bitte versuchen Sie es erneut.')
    }
  }

  const handleAvdNotification = async () => {
    if (!selectedDecision || !decisionReason.trim()) {
      alert('Bitte wählen Sie eine Entscheidung und geben Sie eine Begründung an.')
      return
    }

    // Bestätigungsmodal anzeigen
    setShowAvdNotificationModal(true)
  }

  const confirmAvdNotification = async () => {
    try {
      await api.post(`/services/${id}/complete-with-avd-notification`, {
        decision: selectedDecision,
        reason: decisionReason
      })

      // Erfolgreich abgeschlossen - UI zurücksetzen
      setSelectedDecision(null)
      setDecisionReason('')
      setSelectedAction(null)
      setShowAvdNotificationModal(false)
      
      // Service-Details neu laden
      fetchServiceDetails()
      
      // Erfolg wird durch das Neuladen der Service-Details und das Verschwinden der Entscheidungsoptionen angezeigt
    } catch (error) {
      console.error('Fehler beim Zuweisen an AVD:', error)
      alert('Fehler beim Zuweisen an AVD. Bitte versuchen Sie es erneut.')
    }
  }

  const handlePriorityChange = async () => {
    try {
      await api.patch(`/services/${id}/priority`, {
        priority: newPriority || null
      })

      // Erfolgreich geändert - UI zurücksetzen
      setShowPriorityModal(false)
      setNewPriority('')
      
      // Service-Details neu laden
      fetchServiceDetails()
      
    } catch (error) {
      console.error('Fehler beim Ändern der Priorität:', error)
      alert('Fehler beim Ändern der Priorität. Bitte versuchen Sie es erneut.')
    }
  }

  const handleFurtherProcessing = async () => {
    if (!selectedFurtherProcessingGroup || !furtherProcessingNotes.trim()) {
      alert('Bitte wählen Sie eine Gruppe aus und geben Sie Bearbeitungshinweise an.')
      return
    }

    try {
      await api.post(`/services/${id}/further-processing`, {
        decision: selectedDecision,
        reason: decisionReason,
        groupId: selectedFurtherProcessingGroup,
        notes: furtherProcessingNotes
      })

      // Erfolgreich weitergeleitet - UI zurücksetzen
      setShowFurtherProcessing(false)
      setSelectedFurtherProcessingGroup('')
      setFurtherProcessingNotes('')
      setSelectedDecision(null)
      setDecisionReason('')
      setSelectedAction(null)
      
      // Service-Details neu laden
      fetchServiceDetails()
      
    } catch (error) {
      console.error('Fehler bei der weiterführenden Bearbeitung:', error)
      alert('Fehler bei der weiterführenden Bearbeitung. Bitte versuchen Sie es erneut.')
    }
  }

  const handlePersonalNotification = () => {
    setSelectedAction('personal-notification')
    setPersonalNotificationDetails('Ich habe dem Insassen die Entscheidung persönlich eröffnet. Seine Reaktion war: ')
  }

  const confirmPersonalNotification = async () => {
    if (!personalNotificationDetails.trim()) {
      alert('Bitte geben Sie Details zur persönlichen Eröffnung an.')
      return
    }

    try {
      await api.post(`/services/${id}/personal-notification-completed`, {
        details: personalNotificationDetails
      })

      // Erfolgreich abgeschlossen - UI zurücksetzen
      setPersonalNotificationDetails('')
      setSelectedAction(null)
      
      // Service-Details neu laden
      fetchServiceDetails()
      
      // Erfolg wird durch das Neuladen der Service-Details angezeigt
    } catch (error) {
      console.error('Fehler beim Dokumentieren der persönlichen Eröffnung:', error)
      alert('Fehler beim Dokumentieren der persönlichen Eröffnung. Bitte versuchen Sie es erneut.')
    }
  }

  const handleStatusToInProgress = () => {
    setShowStatusToInProgressModal(true)
  }

  const confirmStatusToInProgress = async () => {
    try {
      await api.patch(`/services/${id}/status`, {
        status: 'IN_PROGRESS',
        reason: 'Status manuell auf In Bearbeitung gesetzt'
      })

      // Modal schließen
      setShowStatusToInProgressModal(false)
      
      // Service-Details neu laden
      fetchServiceDetails()
      
      // Erfolg wird durch das Neuladen der Service-Details angezeigt
    } catch (error) {
      console.error('Fehler beim Ändern des Status:', error)
      alert('Fehler beim Ändern des Status. Bitte versuchen Sie es erneut.')
    }
  }

  const fetchStaffGroups = async () => {
    setLoadingStaffGroups(true)
    try {
      const response = await api.get('/services/staff-groups')
      setStaffGroups(response.data.groups || [])
    } catch (error) {
      console.error('Fehler beim Laden der Staff-Gruppen:', error)
    } finally {
      setLoadingStaffGroups(false)
    }
  }

  const handleForwardService = async () => {
    if (!selectedStaffGroup || !weiterleitungsKommentar.trim()) return

    setForwardingService(true)
    try {
      await api.post(`/services/${id}/forward`, {
        groupId: parseInt(selectedStaffGroup),
        comment: weiterleitungsKommentar
      })

      // Weiterleitung erfolgreich
      setSelectedStaffGroup('')
      setWeiterleitungsKommentar('')
      setSelectedAction(null) // Aktions-Auswahl zurücksetzen
      fetchServiceDetails() // Aktivitätsverlauf aktualisieren
    } catch (error) {
      console.error('Fehler beim Weiterleiten des Services:', error)
    } finally {
      setForwardingService(false)
    }
  }

  const handleSendInquiry = async () => {
    if (!rückfrageText.trim()) return

    try {
      await api.post(`/services/${id}/inquiries`, {
        content: rückfrageText
      })

      // Rückfrage erfolgreich gespeichert
      setRückfrageText('')
      setSelectedAction(null) // Aktions-Auswahl zurücksetzen
      fetchServiceDetails() // Aktivitätsverlauf aktualisieren
    } catch (error) {
      console.error('Fehler beim Senden der Rückfrage:', error)
    }
  }

  const handleSendInformation = async () => {
    if (!informationText.trim()) return

    try {
      await api.post(`/services/${id}/information`, {
        information: informationText
      })

      // Information erfolgreich gespeichert
      setInformationText('')
      setSelectedAction(null) // Aktions-Auswahl zurücksetzen
      setSelectedContactType(null) // Kontakttyp zurücksetzen
      fetchServiceDetails() // Aktivitätsverlauf aktualisieren
    } catch (error) {
      console.error('Fehler beim Senden der Information:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-500" />
      case 'IN_PROGRESS':
        return <AlertCircle className="w-5 h-5 text-blue-500" />
      case 'COMPLETED':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'REJECTED':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Ausstehend'
      case 'IN_PROGRESS':
        return 'In Bearbeitung'
      case 'COMPLETED':
        return 'Abgeschlossen'
      case 'REJECTED':
        return 'Abgelehnt'
      default:
        return status
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-orange-100 text-orange-800'
      case 'URGENT':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getDecisionColor = (decision: string | null) => {
    if (!decision) return 'bg-gray-100 text-gray-800'
    switch (decision) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      case 'RETURNED':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getDecisionText = (decision: string | null) => {
    if (!decision) return 'Keine Entscheidung'
    switch (decision) {
      case 'APPROVED':
        return 'Genehmigt'
      case 'REJECTED':
        return 'Abgelehnt'
      case 'RETURNED':
        return 'Zurückgewiesen'
      default:
        return decision
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const truncateTitle = (title: string, maxLength: number = 55) => {
    if (title.length <= maxLength) {
      return title
    }
    return title.substring(0, maxLength) + '...'
  }

  const generatePDF = () => {
    if (!service) return

    const doc = new jsPDF()
    
    // Titel
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    const title = `Teilhabegeldantrag #${service.id} vom ${formatDate(service.createdAt)}`
    doc.text(title, 20, 30)
    
    // Antragsinformationen
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    
    let yPosition = 50
    
    // Antragstitel
    doc.setFont('helvetica', 'bold')
    doc.text('Antragstitel:', 20, yPosition)
    doc.setFont('helvetica', 'normal')
    doc.text(service.title, 60, yPosition)
    yPosition += 10
    
    // Antrags-ID
    doc.setFont('helvetica', 'bold')
    doc.text('Antrags-ID:', 20, yPosition)
    doc.setFont('helvetica', 'normal')
    doc.text(`#${service.id}`, 60, yPosition)
    yPosition += 10
    
    // Erstellt am
    doc.setFont('helvetica', 'bold')
    doc.text('Erstellt am:', 20, yPosition)
    doc.setFont('helvetica', 'normal')
    doc.text(formatDate(service.createdAt), 60, yPosition)
    yPosition += 10
    
    // Status
    doc.setFont('helvetica', 'bold')
    doc.text('Status:', 20, yPosition)
    doc.setFont('helvetica', 'normal')
    doc.text(getStatusText(service.status), 60, yPosition)
    yPosition += 10
    
    // Entscheidung (falls vorhanden)
    if (service.decision) {
      doc.setFont('helvetica', 'bold')
      doc.text('Entscheidung:', 20, yPosition)
      doc.setFont('helvetica', 'normal')
      doc.text(getDecisionText(service.decision), 60, yPosition)
      yPosition += 10
    }
    
    // Priorität (falls vorhanden)
    if (service.priority) {
      doc.setFont('helvetica', 'bold')
      doc.text('Priorität:', 20, yPosition)
      doc.setFont('helvetica', 'normal')
      const priorityText = service.priority === 'HIGH' ? 'Hohe Priorität' : 'Höchste Priorität'
      doc.text(priorityText, 60, yPosition)
      yPosition += 10
    }
    
    // Zuweisung
    doc.setFont('helvetica', 'bold')
    doc.text('Zugewiesen an:', 20, yPosition)
    doc.setFont('helvetica', 'normal')
    const assignmentText = service.assignedToGroupRef 
      ? (service.assignedToGroupRef.description || service.assignedToGroupRef.name)
      : 'Nicht zugewiesen'
    doc.text(assignmentText, 60, yPosition)
    yPosition += 15
    
    // Antragsteller
    doc.setFont('helvetica', 'bold')
    doc.text('Antragsteller:', 20, yPosition)
    yPosition += 10
    
    doc.setFont('helvetica', 'normal')
    doc.text(`Name: ${service.createdByUser.firstName} ${service.createdByUser.lastName}`, 30, yPosition)
    yPosition += 7
    doc.text(`Buchnummer: ${service.createdByUser.username}`, 30, yPosition)
    yPosition += 7
    doc.text(`E-Mail: ${service.createdByUser.email}`, 30, yPosition)
    yPosition += 7
    doc.text(`Registriert am: ${new Date(service.createdByUser.createdAt).toLocaleDateString('de-DE')}`, 30, yPosition)
    yPosition += 7
    
    // Zellzuweisung (falls vorhanden)
    if (service.createdByUserAssignment) {
      const cellInfo = `${service.createdByUserAssignment.cell.number} - ${service.createdByUserAssignment.cell.station.name} ${service.createdByUserAssignment.cell.station.house.name}`
      doc.text(`Aktuelle Zuweisung: ${cellInfo}`, 30, yPosition)
      yPosition += 10
    } else {
      yPosition += 10
    }
    
    // Beschreibung
    doc.setFont('helvetica', 'bold')
    doc.text('Beschreibung:', 20, yPosition)
    yPosition += 10
    
    doc.setFont('helvetica', 'normal')
    // Beschreibung in mehrere Zeilen aufteilen
    const descriptionLines = doc.splitTextToSize(service.description, 170)
    doc.text(descriptionLines, 20, yPosition)
    yPosition += descriptionLines.length * 7 + 10
    
    // Prüfen ob neue Seite nötig ist
    if (yPosition > 250) {
      doc.addPage()
      yPosition = 20
    }
    
    // Entscheidungsdetails (falls vorhanden)
    if (service.decisionDetails) {
      doc.setFont('helvetica', 'bold')
      doc.text('Entscheidungsdetails:', 20, yPosition)
      yPosition += 10
      
      doc.setFont('helvetica', 'normal')
      
      // Entscheidung
      if (yPosition > 250) {
        doc.addPage()
        yPosition = 20
      }
      doc.text(`Entscheidung: ${getDecisionText(service.decisionDetails.decision)}`, 30, yPosition)
      yPosition += 7
      
      // Begründung mit automatischem Zeilenumbruch
      if (yPosition > 250) {
        doc.addPage()
        yPosition = 20
      }
      const reasonLines = doc.splitTextToSize(`Begründung: ${service.decisionDetails.reason}`, 160)
      reasonLines.forEach((line: string) => {
        if (yPosition > 250) {
          doc.addPage()
          yPosition = 20
        }
        doc.text(line, 30, yPosition)
        yPosition += 7
      })
      
      // Entschieden von
      if (yPosition > 250) {
        doc.addPage()
        yPosition = 20
      }
      doc.text(`Entschieden von: ${service.decisionDetails.who}`, 30, yPosition)
      yPosition += 7
      
      // Entschieden am
      if (yPosition > 250) {
        doc.addPage()
        yPosition = 20
      }
      doc.text(`Entschieden am: ${service.decisionDetails.when}`, 30, yPosition)
      yPosition += 10
    }
    
    // Aktivitätsverlauf
    doc.setFont('helvetica', 'bold')
    doc.text('Aktivitätsverlauf:', 20, yPosition)
    yPosition += 10
    
    doc.setFont('helvetica', 'normal')
    service.activities.forEach((activity) => {
      // Prüfen ob neue Seite nötig ist (mit mehr Platz für Aktivität)
      if (yPosition > 240) {
        doc.addPage()
        yPosition = 20
      }
      
      // Für Entscheidungsaktivitäten nur eine kurze Zusammenfassung anzeigen
      let activityText = `${formatDate(activity.when)} - ${getActionText(activity.action)}`
      
      if (activity.action === 'decision_made') {
        // Bei Entscheidungen nur den ersten Teil der Begründung anzeigen
        const shortDetails = activity.details.length > 100 
          ? activity.details.substring(0, 100) + '...' 
          : activity.details
        activityText += `: ${shortDetails}`
      } else {
        // Bei anderen Aktivitäten den kompletten Text anzeigen
        activityText += `: ${activity.details}`
      }
      
      const activityLines = doc.splitTextToSize(activityText, 170)
      
      // Prüfen ob Aktivität auf aktuelle Seite passt
      const requiredSpace = activityLines.length * 7 + 5
      if (yPosition + requiredSpace > 270) {
        doc.addPage()
        yPosition = 20
      }
      
      doc.text(activityLines, 20, yPosition)
      yPosition += requiredSpace
    })
    
    // PDF speichern
    const fileName = `Teilhabegeldantrag_${service.id}_${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(fileName)
  }

  const getActionText = (action: string) => {
    switch (action) {
      case 'created':
        return 'Antrag gestellt'
      case 'comment':
        return 'Kommentar'
      case 'inquiry':
        return 'Rückfrage an Insassen'
      case 'answer':
        return 'Antwort des Insassen'
      case 'information':
        return 'Information an Insassen gesendet'
      case 'forward':
        return 'Weiterleitung'
      case 'workflow_transition':
        return 'Status-Änderung'
      case 'status_changed':
        return 'Statusänderung'
      case 'decision_made':
        return 'Entscheidung'
      case 'personal_notification':
        return 'Persönliche Eröffnung'
      case 'personal_notification_completed':
        return 'Persönliche Eröffnung durchgeführt'
      case 'status_and_decision_updated':
        return 'Status und Entscheidung aktualisiert'
      case 'priority_changed':
        return 'Priorität geändert'
      case 'further_processing':
        return 'Weiterführende Bearbeitung'
      case 'returned':
        return 'Antrag zurückgewiesen'
      default:
        return action
    }
  }

  // Prüfen ob eine Entscheidung getroffen wurde
  const hasDecisionBeenMade = () => {
    return service?.decision !== null && service?.decision !== undefined
  }

  // Prüfen ob Benutzer berechtigt ist, diese Seite zu sehen
  const isUserAuthorized = () => {
    if (!user) return false
    
    // Insassen sind nicht berechtigt
    const isInmate = user.groups?.some(g => g.name === 'PS Inmates')
    if (isInmate) return false
    
    // Staff und Admins sind berechtigt
    const isStaff = user.groups?.some(g => 
      g.name.includes('PS General Enforcement Service') || 
      g.name.includes('PS Vollzugsabteilungsleitung') ||
      g.name.includes('PS Vollzugsleitung') ||
      g.name.includes('PS Anstaltsleitung') ||
      g.name.includes('PS Payments Office') ||
      g.name.includes('PS Medical Staff')
    )
    const isAdmin = user.groups?.some(g => g.name === 'PS Designers')
    
    return isStaff || isAdmin
  }



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Service nicht gefunden</h2>
        <button
          onClick={() => navigate(-1)}
          className="btn btn-primary"
        >
          Zurück
        </button>
      </div>
    )
  }

  // Berechtigungsprüfung - Insassen dürfen diese Seite nicht sehen
  if (!isUserAuthorized()) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Zugriff verweigert</h2>
        <p className="text-gray-600 mb-6">
          Sie haben keine Berechtigung, diese Seite zu sehen.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="btn btn-primary"
        >
          Zum Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{truncateTitle(service.title)}</h1>
          <p className="text-gray-600 mt-1">Teilhabegeldantrag #{service.id} vom {formatDate(service.createdAt)}</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-primary text-sm px-3 py-1.5"
          >
            Zurück
          </button>
          {(user?.groups?.some(g => g.name.includes('PS General Enforcement Service') || g.name.includes('PS Vollzugsabteilungsleitung') || g.name.includes('PS Vollzugsleitung') || g.name.includes('PS Anstaltsleitung') || g.name.includes('PS Payments Office') || g.name.includes('PS Medical Staff') || g.name === 'PS Designers')) && (
            <>
              <button
                onClick={() => setShowStatusModal(true)}
                className="btn btn-primary text-sm px-3 py-1.5"
              >
                Status ändern
              </button>
              <button
                onClick={() => {
                  setNewPriority(service.priority || '')
                  setShowPriorityModal(true)
                }}
                className="btn btn-primary text-sm px-3 py-1.5"
              >
                Antrag priorisieren
              </button>
            </>
          )}
          <button
            onClick={() => generatePDF()}
            className="btn btn-primary text-sm px-3 py-1.5"
          >
            PDF generieren
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hauptinhalt */}
        <div className="lg:col-span-2 space-y-6">
                    {/* Service Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              {/* Gruppenzuweisung oben links */}
              {service.assignedToGroupRef ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-1">
                  <span className="text-xs font-medium text-blue-600">Zugewiesen an: </span>
                  <span className="text-sm text-blue-800">{service.assignedToGroupRef.description || service.assignedToGroupRef.name}</span>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1">
                  <span className="text-xs font-medium text-gray-600">Zugewiesen an: </span>
                  <span className="text-sm text-gray-800">Antrag nicht zugewiesen</span>
                </div>
              )}
              
              {/* Entscheidung, Status und Priorität oben rechts */}
              <div className="flex items-center space-x-2">
                {service.decision && (
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getDecisionColor(service.decision)}`}>
                    {getDecisionText(service.decision)}
                  </span>
                )}
                {getStatusIcon(service.status)}
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(service.status)}`}>
                  {getStatusText(service.status)}
                </span>
                {service.priority && (
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getPriorityColor(service.priority)}`}>
                    {service.priority === 'HIGH' && 'Hohe Priorität'}
                    {service.priority === 'URGENT' && 'Höchste Priorität'}
                  </span>
                )}
              </div>
            </div>
            
            <div className="space-y-6">
              {/* Antragsteller mit allen Informationen kompakt */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Antragsteller</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 mb-1">Name</h4>
                    <p className="text-sm text-gray-900">{service.createdByUser.firstName} {service.createdByUser.lastName}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 mb-1">Buchnummer</h4>
                    <p className="text-sm text-gray-900">{service.createdByUser.username}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 mb-1">E-Mail</h4>
                    <p className="text-sm text-gray-900">{service.createdByUser.email}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 mb-1">Registriert am</h4>
                    <p className="text-sm text-gray-900">
                      {new Date(service.createdByUser.createdAt).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 mb-1">Aktuelle Zuweisung</h4>
                    <p className="text-sm text-gray-900">
                      {service.createdByUserAssignment ? 
                        `${service.createdByUserAssignment.cell.number} - ${service.createdByUserAssignment.cell.station.name} ${service.createdByUserAssignment.cell.station.house.name}` : 
                        'Keine Zuweisung'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Trennlinie */}
              <div className="border-t border-gray-200 my-6"></div>

              {/* Antragstitel und Beschreibung ganz unten */}
              <div>
                <div className="mb-4">
                  <span className="text-sm font-medium text-gray-700">Betreff: </span>
                  <span className="text-gray-900 font-medium">{service.title}</span>
                </div>
                
                <div className="mb-4">
                  <span className="text-sm font-medium text-gray-700">Beschreibung: </span>
                  <span className="text-gray-900">{service.description}</span>
                </div>

                {/* Entscheidungsinformationen */}
                {service.decisionDetails && (
                  <div className="border-t border-gray-200 pt-4">
                    <div className="mb-3">
                      <span className="text-sm font-medium text-gray-700">Entscheidung: </span>
                      <span className={`px-2 py-1 text-sm font-medium rounded-full ${getDecisionColor(service.decisionDetails.decision)}`}>
                        {getDecisionText(service.decisionDetails.decision)}
                      </span>
                    </div>
                    
                    <div className="mb-3">
                      <span className="text-sm font-medium text-gray-700">Begründung: </span>
                      <span className="text-gray-900">{service.decisionDetails.reason}</span>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      Entscheidung getroffen von {service.decisionDetails.who} am {formatDate(service.decisionDetails.when)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bearbeiter-Aktionen */}
          {(user?.groups?.some(g => g.name.includes('PS General Enforcement Service') || g.name.includes('PS Vollzugsabteilungsleitung') || g.name.includes('PS Vollzugsleitung') || g.name.includes('PS Anstaltsleitung') || g.name.includes('PS Payments Office') || g.name.includes('PS Medical Staff') || g.name === 'PS Designers')) && service.status !== 'COMPLETED' && (
                         <div className="bg-white rounded-lg shadow p-6">
               <div className="mb-4">
                 <h2 className="text-xl font-semibold text-gray-900">Sie haben folgende Auswahlmöglichkeiten:</h2>
               </div>
              
                             {/* Aktions-Buttons */}
               <div className="flex space-x-4 mb-6">
                 {service.status === 'PENDING' && (
                   <button
                     onClick={handleStatusToInProgress}
                     className="px-4 py-2 rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-colors"
                   >
                     In Bearbeitung setzen
                   </button>
                 )}
                 <button
                   onClick={() => setSelectedAction('insassen-kontaktieren')}
                   className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                     selectedAction === 'insassen-kontaktieren'
                       ? 'border-blue-500 bg-blue-50 text-blue-700'
                       : 'border-gray-300 hover:border-gray-400'
                   }`}
                 >
                   Insassen kontaktieren
                 </button>
                 <button
                   onClick={() => setSelectedAction('weiterleiten')}
                   className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                     selectedAction === 'weiterleiten'
                       ? 'border-blue-500 bg-blue-50 text-blue-700'
                       : 'border-gray-300 hover:border-gray-400'
                   }`}
                 >
                   Weiterleiten
                 </button>
                 {!service.decision && (
                   <button
                     onClick={() => setSelectedAction('entscheiden')}
                     className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                       selectedAction === 'entscheiden'
                         ? 'border-blue-500 bg-blue-50 text-blue-700'
                         : 'border-gray-300 hover:border-gray-400'
                     }`}
                   >
                     Entscheiden
                   </button>
                 )}
                                                    <button
                   onClick={() => setSelectedAction('kommentieren')}
                   className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                     selectedAction === 'kommentieren'
                       ? 'border-blue-500 bg-blue-50 text-blue-700'
                       : 'border-gray-300 hover:border-gray-400'
                   }`}
                 >
                   Kommentar erstellen
                 </button>
                 {hasDecisionBeenMade() && (
                   <button
                     onClick={handlePersonalNotification}
                     className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                       selectedAction === 'personal-notification'
                         ? 'border-green-500 bg-green-50 text-green-700'
                         : 'border-gray-300 hover:border-gray-400'
                     }`}
                   >
                     Persönliche Eröffnung
                   </button>
                 )}
               </div>

              {/* Insassen kontaktieren */}
              {selectedAction === 'insassen-kontaktieren' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Wie möchten Sie den Insassen kontaktieren?
                  </h3>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setSelectedContactType('rückfrage')}
                      className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                        selectedContactType === 'rückfrage'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      Rückfrage an Insassen
                    </button>
                    <button
                      onClick={() => setSelectedContactType('information')}
                      className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                        selectedContactType === 'information'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      Information an Insassen
                    </button>
                  </div>
                  
                  {/* Rückfrage an Insasse */}
                  {selectedContactType === 'rückfrage' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        Welche Rückfrage möchten Sie an den Insassen stellen?
                      </h3>
                      <div className="flex space-x-3">
                        <textarea
                          value={rückfrageText}
                          onChange={(e) => setRückfrageText(e.target.value)}
                          placeholder="Ihre Rückfrage..."
                          className="flex-1 input resize-none"
                          rows={4}
                        />
                        <button
                          onClick={handleSendInquiry}
                          className="btn btn-primary self-end"
                          disabled={!rückfrageText.trim()}
                        >
                          Rückfrage absenden
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Information an Insasse */}
                  {selectedContactType === 'information' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        Welche Information möchten Sie an den Insassen senden?
                      </h3>
                      <div className="flex space-x-3">
                        <textarea
                          value={informationText}
                          onChange={(e) => setInformationText(e.target.value)}
                          placeholder="Ihre Information..."
                          className="flex-1 input resize-none"
                          rows={4}
                        />
                        <button
                          onClick={handleSendInformation}
                          className="btn btn-primary self-end"
                          disabled={!informationText.trim()}
                        >
                          Information absenden
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

                             {/* Weiterleiten */}
               {selectedAction === 'weiterleiten' && (
                 <div className="space-y-4">
                   <div className="flex items-center space-x-3">
                     <h3 className="text-lg font-medium text-gray-900">
                       An wen möchten Sie den Antrag weiterleiten?
                     </h3>
                     <select
                       value={selectedStaffGroup}
                       onChange={(e) => setSelectedStaffGroup(e.target.value)}
                       className="input"
                       disabled={loadingStaffGroups}
                     >
                       <option value="">
                         {loadingStaffGroups ? 'Lade Gruppen...' : 'Staff-Gruppe auswählen'}
                       </option>
                       {staffGroups.map((group) => (
                         <option key={group.id} value={group.id}>
                           {group.description || group.name}
                         </option>
                       ))}
                     </select>
                   </div>
                   
                   <div className="space-y-2">
                     <h4 className="text-sm font-medium text-gray-700">
                       Ihr Bearbeitungskommentar und Hinweis für den nächsten Bearbeiter
                     </h4>
                     <div className="flex space-x-3">
                       <textarea
                         value={weiterleitungsKommentar}
                         onChange={(e) => setWeiterleitungsKommentar(e.target.value)}
                         placeholder="Ihr Kommentar..."
                         className="flex-1 input resize-none"
                         rows={4}
                       />
                       <button
                         onClick={handleForwardService}
                         className="btn btn-primary self-end"
                         disabled={!selectedStaffGroup || !weiterleitungsKommentar.trim() || forwardingService}
                       >
                         {forwardingService ? 'Weiterleiten...' : 'Absenden'}
                       </button>
                     </div>
                   </div>
                 </div>
               )}

                             {/* Entscheiden */}
               {selectedAction === 'entscheiden' && (
                 <div className="space-y-4">
                   <h3 className="text-lg font-medium text-gray-900">
                     Welche Entscheidung möchten Sie treffen?
                   </h3>
                                     <div className="flex space-x-4">
                    <button
                      onClick={() => handleDecisionSelect('APPROVED')}
                      className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                        selectedDecision === 'APPROVED'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Genehmigen</span>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => handleDecisionSelect('REJECTED')}
                      className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                        selectedDecision === 'REJECTED'
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span>Ablehnen</span>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => handleDecisionSelect('RETURNED')}
                      className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                        selectedDecision === 'RETURNED'
                          ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span>Zurückweisen</span>
                      </div>
                    </button>
                  </div>
                   
                                     {/* Begründungsfeld */}
                  {selectedDecision && (
                    <div className="space-y-3">
                      <div className="flex space-x-3">
                        <textarea
                          value={decisionReason}
                          onChange={(e) => setDecisionReason(e.target.value)}
                          placeholder="Bitte Begründung angeben"
                          className="flex-1 input resize-none"
                          rows={4}
                        />
                        {selectedDecision === 'APPROVED' && (
                          <button
                            onClick={() => setShowCalculationModal(true)}
                            className="btn btn-primary self-start"
                          >
                            Teilhabegeld berechnen
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Weitere Optionen */}
                  {selectedDecision && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-700">
                        Was soll als nächstes passieren?
                      </h4>
                      <div className="flex space-x-2">
                        <button
                          onClick={handleCompleteWithDecision}
                          className="btn btn-primary flex-1 text-center"
                        >
                          Ergebnis an den Insassen senden und Bearbeitung abschließen
                        </button>
                        <button
                          onClick={handleAvdNotification}
                          className="btn btn-primary flex-1 text-center"
                        >
                          Ergebnis persönlich durch den AVD eröffnen lassen
                        </button>
                        {(selectedDecision === 'APPROVED' || selectedDecision === 'REJECTED') && (
                          <button
                            onClick={() => setShowFurtherProcessing(true)}
                            className="btn btn-primary flex-1 text-center"
                          >
                            Weiterführende Bearbeitung
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Weiterführende Bearbeitung */}
                  {showFurtherProcessing && (
                    <div className="space-y-4 mt-4">
                      <h4 className="text-sm font-medium text-gray-700">
                        Weiterführende Bearbeitung
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Staff-Gruppe auswählen
                          </label>
                          <select
                            value={selectedFurtherProcessingGroup}
                            onChange={(e) => setSelectedFurtherProcessingGroup(e.target.value)}
                            className="input w-full"
                          >
                            <option value="">Gruppe auswählen</option>
                            {staffGroups.map((group) => (
                              <option key={group.id} value={group.id}>
                                {group.description || group.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex space-x-3">
                          <textarea
                            value={furtherProcessingNotes}
                            onChange={(e) => setFurtherProcessingNotes(e.target.value)}
                            placeholder="Bearbeitungshinweise für die nächste Staff-Gruppe..."
                            className="flex-1 input resize-none"
                            rows={4}
                          />
                          <button
                            onClick={handleFurtherProcessing}
                            className="btn btn-primary self-end"
                            disabled={!selectedFurtherProcessingGroup || !furtherProcessingNotes.trim()}
                          >
                            Absenden
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                 </div>
               )}

               {/* Kommentieren */}
               {selectedAction === 'kommentieren' && (
                 <div className="space-y-4">
                   <h3 className="text-lg font-medium text-gray-900">
                     Geben Sie einen Kommentar zum Antrag ein
                   </h3>
                   <div className="flex space-x-3">
                     <textarea
                       value={kommentarText}
                       onChange={(e) => setKommentarText(e.target.value)}
                       placeholder="Ihr Kommentar..."
                       className="flex-1 input resize-none"
                       rows={4}
                     />
                     <button
                       onClick={handleSaveComment}
                       className="btn btn-primary self-end"
                       disabled={!kommentarText.trim() || savingComment}
                     >
                       {savingComment ? 'Speichern...' : 'Kommentar speichern'}
                     </button>
                   </div>
                 </div>
               )}

               {/* Persönliche Eröffnung */}
               {selectedAction === 'personal-notification' && (
                 <div className="space-y-4">
                   <h3 className="text-lg font-medium text-gray-900">
                     Dokumentieren Sie die persönliche Eröffnung
                   </h3>
                   <div className="flex space-x-3">
                     <textarea
                       value={personalNotificationDetails}
                       onChange={(e) => setPersonalNotificationDetails(e.target.value)}
                       placeholder="Beschreiben Sie die persönliche Eröffnung..."
                       className="flex-1 input resize-none"
                       rows={4}
                     />
                     <button
                       onClick={confirmPersonalNotification}
                       className="btn btn-primary self-end"
                       disabled={!personalNotificationDetails.trim()}
                     >
                       Antrag abschließen
                     </button>
                   </div>
                 </div>
               )}
             </div>
           )}

          
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Aktivitätsverlauf */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Antragsverlauf</span>
            </h2>
            
                         <div className="space-y-0">
                              {service.activities.map((activity, index) => (
                 <div key={activity.id}>
                   <div className="flex items-start space-x-3 py-4">
                     <div className="flex-1">
                       <div className="flex items-center space-x-2 mb-1">
                         <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                           {getActionText(activity.action)}
                         </span>
                       </div>
                       <p className="text-sm text-gray-900">{activity.details}</p>
                       <div className="flex items-center space-x-2 mt-1">
                         <span className="text-xs text-gray-500">{activity.who}</span>
                         <span className="text-xs text-gray-400">•</span>
                         <span className="text-xs text-gray-500">{formatDate(activity.when)}</span>
                       </div>
                     </div>
                   </div>
                   {index < service.activities.length - 1 && (
                     <div className="border-t border-gray-200"></div>
                   )}
                 </div>
               ))}
            </div>
          </div>

          
        </div>
      </div>

      {/* Status- und Entscheidungs-Änderung Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Status oder Entscheidung ändern
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Neuer Status (optional)
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="input w-full"
                >
                  <option value="">Status auswählen</option>
                  <option value="PENDING">Ausstehend</option>
                  <option value="IN_PROGRESS">In Bearbeitung</option>
                  <option value="COMPLETED">Abgeschlossen</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Begründung für Status-Änderung
                </label>
                <textarea
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="Grund für die Status-Änderung..."
                  className="input w-full resize-none"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Neue Entscheidung (optional)
                </label>
                <select
                  value={newDecision}
                  onChange={(e) => setNewDecision(e.target.value)}
                  className="input w-full"
                >
                  <option value="">Entscheidung auswählen</option>
                  <option value="APPROVED">Genehmigen</option>
                  <option value="REJECTED">Ablehnen</option>
                  <option value="RETURNED">Zurückweisen</option>
                  <option value="RESET">Entscheidung zurücksetzen</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Begründung für Entscheidungs-Änderung
                </label>
                <textarea
                  value={manualDecisionReason}
                  onChange={(e) => setManualDecisionReason(e.target.value)}
                  placeholder="Grund für die Entscheidungs-Änderung..."
                  className="input w-full resize-none"
                  rows={2}
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowStatusModal(false)
                  setNewStatus('')
                  setStatusReason('')
                  setNewDecision('')
                  setManualDecisionReason('')
                }}
                className="btn btn-secondary flex-1"
              >
                Abbrechen
              </button>
              <button
                onClick={handleStatusChange}
                disabled={(!newStatus && !newDecision) || (!statusReason.trim() && !manualDecisionReason.trim())}
                className="btn btn-primary flex-1"
              >
                Änderungen speichern
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prioritäts-Änderung Modal */}
      {showPriorityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Antrag priorisieren
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priorität
                </label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="input w-full"
                >
                  <option value="">Keine besondere Priorität</option>
                  <option value="HIGH">Hohe Priorität</option>
                  <option value="URGENT">Höchste Priorität</option>
                </select>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowPriorityModal(false)
                  setNewPriority('')
                }}
                className="btn btn-secondary flex-1"
              >
                Abbrechen
              </button>
              <button
                onClick={handlePriorityChange}
                className="btn btn-primary flex-1"
              >
                Priorität speichern
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status-Änderung Dialog bei Kommentar */}
      {showStatusChangeDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Status-Änderung
            </h3>
            
            <p className="text-gray-700 mb-6">
              Der Status des Antrages ist aktuell <em>ausstehend</em>. Möchten Sie den Antrag auf <em>in Bearbeitung</em> setzen?
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => handleStatusChangeDialog(false)}
                className="btn btn-secondary flex-1"
              >
                Nein
              </button>
              <button
                onClick={() => handleStatusChangeDialog(true)}
                className="btn btn-primary flex-1"
              >
                Ja
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Entscheidungs-Bestätigungsmodal */}
      {showDecisionConfirmationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Entscheidung bestätigen
            </h3>
            
            <p className="text-gray-700 mb-6">
              Möchten Sie das Ergebnis an den Insassen senden und die Bearbeitung abschließen?
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDecisionConfirmationModal(false)}
                className="btn btn-secondary flex-1"
              >
                Nein
              </button>
              <button
                onClick={confirmCompleteWithDecision}
                className="btn btn-primary flex-1"
              >
                Ja
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AVD-Eröffnungs-Bestätigungsmodal */}
      {showAvdNotificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              AVD-Eröffnung bestätigen
            </h3>
            
            <p className="text-gray-700 mb-6">
              Möchten Sie das Ergebnis speichern und den Antrag der Gruppe der AVDs für die persönliche Eröffnung zuweisen?
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowAvdNotificationModal(false)}
                className="btn btn-secondary flex-1"
              >
                Nein
              </button>
              <button
                onClick={confirmAvdNotification}
                className="btn btn-primary flex-1"
              >
                Ja
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Status zu In Bearbeitung Modal */}
      {showStatusToInProgressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Status ändern
            </h3>
            
            <p className="text-gray-700 mb-6">
              Möchten Sie den Status des Antrages auf In Bearbeitung ändern?
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowStatusToInProgressModal(false)}
                className="btn btn-secondary flex-1"
              >
                Nein
              </button>
              <button
                onClick={confirmStatusToInProgress}
                className="btn btn-primary flex-1"
              >
                Ja
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Teilhabegeld Berechnung Modal */}
      {showCalculationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Teilhabegeld Berechnung
            </h3>
            
            <div className="space-y-4">
              {/* Formel-Darstellung */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-center">
                  {/* Titel */}
                  <div className="text-xl font-bold text-blue-800 mb-4">
                    Teilhabegeld =
                  </div>
                  
                  {/* Hauptformel */}
                  <div className="flex items-center justify-center gap-3">
                    {/* Linke Klammer */}
                    <div className="text-2xl text-blue-600 font-bold">[</div>
                    
                    {/* Bruch */}
                    <div className="flex flex-col items-center">
                      {/* Zähler */}
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-blue-600">(</span>
                        <span className="inline-block bg-white px-3 py-2 rounded border text-sm font-medium text-blue-800">
                          0,14 × Eckvergütung – Hausgeld – Eigengeld
                        </span>
                        <span className="text-blue-600">)</span>
                      </div>
                      
                      {/* Bruchstrich */}
                      <div className="w-full h-0.5 bg-blue-600 my-2"></div>
                      
                      {/* Nenner */}
                      <div className="flex items-center">
                        <span className="inline-block bg-white px-3 py-2 rounded border text-sm font-medium text-blue-800">
                          Arbeitstage im Monat
                        </span>
                      </div>
                    </div>
                    
                    {/* Rechte Klammer */}
                    <div className="text-2xl text-blue-600 font-bold">]</div>
                    
                    {/* Multiplikation */}
                    <div className="text-2xl text-blue-600 font-bold mx-2">×</div>
                    
                    {/* Anspruchstage */}
                    <div className="inline-block bg-white px-3 py-2 rounded border text-sm font-medium text-blue-800">
                      Anspruchstage
                    </div>
                  </div>
                </div>
              </div>

              {/* Eingabefelder für die Berechnung */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Eckvergütung (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={eckverguetung}
                    onChange={(e) => setEckverguetung(e.target.value)}
                    className="input w-full"
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hausgeld (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={hausgeld}
                    onChange={(e) => setHausgeld(e.target.value)}
                    className="input w-full"
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Eigengeld (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={eigengeld}
                    onChange={(e) => setEigengeld(e.target.value)}
                    className="input w-full"
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Arbeitstage im Monat
                  </label>
                  <input
                    type="number"
                    value={arbeitstage}
                    onChange={(e) => setArbeitstage(e.target.value)}
                    className="input w-full"
                    placeholder="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Anspruchstage
                  </label>
                  <input
                    type="number"
                    value={anspruchstage}
                    onChange={(e) => setAnspruchstage(e.target.value)}
                    className="input w-full"
                    placeholder="0"
                  />
                </div>
              </div>
              
              {/* Berechnung-Button und Ergebnis */}
              <div className="border-t pt-4">
                <button
                  onClick={calculateTeilhabegeld}
                  className="btn btn-primary mb-3"
                  disabled={!eckverguetung || !hausgeld || !eigengeld || !arbeitstage || !anspruchstage}
                >
                  Berechnung durchführen
                </button>
                
                {calculatedResult && (
                  <div className={`rounded-lg p-3 ${
                    calculatedResult.startsWith('Fehler:') 
                      ? 'bg-red-50 border border-red-200' 
                      : 'bg-green-50 border border-green-200'
                  }`}>
                    <p className={`text-sm font-medium mb-1 ${
                      calculatedResult.startsWith('Fehler:') 
                        ? 'text-red-800' 
                        : 'text-green-800'
                    }`}>
                      {calculatedResult.startsWith('Fehler:') ? 'Validierungsfehler:' : 'Berechnungsergebnis:'}
                    </p>
                    <p className={`text-lg font-bold ${
                      calculatedResult.startsWith('Fehler:') 
                        ? 'text-red-900' 
                        : 'text-green-900'
                    }`}>
                      {calculatedResult.startsWith('Fehler:') ? calculatedResult : `${calculatedResult}€`}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCalculationModal(false)}
                className="btn btn-secondary flex-1"
              >
                Abbrechen
              </button>
              <button
                onClick={applyCalculation}
                className="btn btn-primary flex-1"
                disabled={!calculatedResult}
              >
                Berechnung übernehmen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ServiceDetailParticipationMoney

