import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";

interface AntragCard {
  id: string;
  title: string;
  description: string;
  category: string;
  color: string;
  icon: string;
  items: string[];
  onClick: () => void;
}

export default function NewApplicationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedAntragstyp, setSelectedAntragstyp] = useState<'Freitextantrag' | 'Taschengeld-Antrag' | 'Besuch' | 'Gesundheit' | 'Vollzugslockerung' | null>(null);
  const [betreff, setBetreff] = useState('');
  const [begruendung, setBegruendung] = useState('');
  const [monat, setMonat] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Prüfen ob der Benutzer ein Insasse ist
  const userGroups = user?.groups?.map(g => g.name) || [];
  const isInmate = userGroups.some(group => group === 'PS Inmates');
  
  if (!isInmate) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="max-w-md mx-auto px-6 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
            Zugriff verweigert
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-300 mb-6">
            Verwaltungsbenutzer können keine neuen Anträge erstellen. Diese Funktion steht nur Insassen zur Verfügung.
          </p>
          <button
            onClick={() => navigate('/my-services')}
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200"
          >
            Zurück zur Antragsübersicht
          </button>
        </div>
      </div>
    );
  }

  // Favoriten aus localStorage laden
  useEffect(() => {
    const savedFavorites = localStorage.getItem('antragFavorites');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (error) {
        console.error('Fehler beim Laden der Favoriten:', error);
        setFavorites([]);
      }
    }
  }, []);

  const handleAntragstypSelect = (antragstyp: 'Freitextantrag' | 'Taschengeld-Antrag' | 'Besuch' | 'Gesundheit' | 'Vollzugslockerung') => {
    setSelectedAntragstyp(antragstyp);
    setShowModal(true);
  };

  // Alle Antragskarten definieren
  const allCards: AntragCard[] = [
    // Finanzen
    {
      id: 'taschengeld',
      title: 'Taschengeld-Antrag',
      description: 'Antrag auf Taschengeld für einen bestimmten Monat',
      category: 'Finanzen',
      color: 'emerald',
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1',
      items: ['Gewünschter Monat'],
      onClick: () => handleAntragstypSelect('Taschengeld-Antrag')
    },
    {
      id: 'geld',
      title: 'Geld',
      description: 'Finanzbezogene Anträge',
      category: 'Finanzen',
      color: 'yellow',
      icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
      items: ['Überweisung von Hausgeld / Eigengeld / Überbrückungsgeld', 'Antrag auf Haupteinkauf', 'Antrag auf Auszahlung zum Freigang'],
      onClick: () => alert('Demnächst verfügbar')
    },
    {
      id: 'teilhabe-geld',
      title: 'Teilhabe-Geld',
      description: 'Antrag auf Gewährung von Teilhabegeld',
      category: 'Finanzen',
      color: 'green',
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1',
      items: ['Soziale Teilhabe', 'Freizeitaktivitäten'],
      onClick: () => alert('Demnächst verfügbar')
    },
    
    // Soziales & Familie
         {
       id: 'besuch',
       title: 'Besuch',
       description: 'Beantragung von Besuchspersonen',
       category: 'Soziales & Familie',
       color: 'purple',
       icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
       items: ['Besuchsanmeldung', 'Besuchseintragung', 'Besuchszusammenführung', 'Videobesuch', 'Langzeitbesuch'],
       onClick: () => handleAntragstypSelect('Besuch')
     },
    {
      id: 'gespraech',
      title: 'Gespräch',
      description: 'Terminwunsch für Gespräche innerhalb/außerhalb des Vollzugs',
      category: 'Soziales & Familie',
      color: 'pink',
      icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
      items: ['Anstaltsleiter (Vollzugsleiter)', 'Arbeitsinspektor', 'Ausländerbeauftragter'],
      onClick: () => alert('Demnächst verfügbar')
    },
    {
      id: 'freizeit-bildung',
      title: 'Freizeit & Bildung',
      description: 'Aktivitäten und Weiterbildungsangebote',
      category: 'Soziales & Familie',
      color: 'cyan',
      icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
      items: ['Spielegruppe', 'Gottesdienst', 'Elterntraining', 'Vater-Kind-Gruppe', 'Soziales Training', 'Bücherei', 'Friseur', 'Sportausweis'],
      onClick: () => alert('Demnächst verfügbar')
    },
    
    // Unterstützung & Beratung
    {
      id: 'beratung',
      title: 'Beratung & Unterstützung',
      description: 'Zugang zu Beratungs- und Unterstützungsangeboten',
      category: 'Unterstützung & Beratung',
      color: 'teal',
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      items: ['Kodrobs', 'Urkundsbeamter/ÖRA', 'Schuldnerberatung', 'Entlassenenhilfe', 'Übergangsmanagement (FÜMA)', 'Überleitungsmanagement'],
      onClick: () => alert('Demnächst verfügbar')
    },
         {
       id: 'gesundheit',
       title: 'Gesundheit',
       description: 'Gespräche/Unterstützung bei körperlichen oder psychischen Beschwerden',
       category: 'Unterstützung & Beratung',
       color: 'red',
       icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
       items: ['Arzt', 'Soziales Training', 'Anti-Aggressionstraining (AAT)', 'Pastor', 'Diakon', 'Psychologe'],
       onClick: () => handleAntragstypSelect('Gesundheit')
     },
    
    // Organisation & Rechte
    {
      id: 'habe',
      title: 'Habe',
      description: 'Herausgabe von persönlichen Gegenständen aus der Kammer',
      category: 'Organisation & Rechte',
      color: 'indigo',
      icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
      items: ['Kleidung tauschen', 'Kleidung aufstocken', 'Handynummer herausschreiben'],
      onClick: () => alert('Demnächst verfügbar')
    },
    {
      id: 'paketsendung',
      title: 'Paketsendung',
      description: 'Antrag auf Genehmigung und Annahme einer Paketsendung',
      category: 'Organisation & Rechte',
      color: 'orange',
      icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
      items: ['Genehmigung erforderlich', 'Inhaltskontrolle'],
      onClick: () => alert('Demnächst verfügbar')
    },
         {
       id: 'vollzugslockerung',
       title: 'Vollzugslockerung',
       description: 'Antrag auf Lockerung des Vollzugs (z. B. Freistellung / Ausgang)',
       category: 'Organisation & Rechte',
       color: 'lime',
       icon: 'M13 10V3L4 14h7v7l9-11h-7z',
       items: ['Freistellung', 'Ausgang'],
       onClick: () => handleAntragstypSelect('Vollzugslockerung')
     },
    {
      id: 'arbeit-schule',
      title: 'Arbeit & Schule',
      description: 'Tätigkeit und schulische Weiterbildung',
      category: 'Organisation & Rechte',
      color: 'amber',
      icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6',
      items: ['Arbeitsplatzzuweisung', 'Arbeitsplatzwechsel', 'Teilnahme an schulischen Angeboten', 'Freistellung von Arbeitspflicht', 'Freistellung arbeitsfreie Tage'],
      onClick: () => alert('Demnächst verfügbar')
    },
         {
       id: 'freitextantrag',
       title: 'Sonstiges Anliegen',
       description: 'Allgemeiner Antrag mit freier Begründung für verschiedene Anliegen',
       category: 'Organisation & Rechte',
       color: 'blue',
       icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
       items: ['Betreff des Antrags', 'Detaillierte Begründung'],
       onClick: () => handleAntragstypSelect('Freitextantrag')
     },
    
  ];

  // Kategorien definieren
  const categories = [
    { id: 'finanzen', title: 'Finanzen', description: 'Finanzbezogene Anträge und Geldangelegenheiten' },
    { id: 'soziales', title: 'Soziales & Familie', description: 'Besuche, Gespräche und soziale Aktivitäten' },
    { id: 'unterstuetzung', title: 'Unterstützung & Beratung', description: 'Beratungsangebote und gesundheitliche Unterstützung' },
    { id: 'organisation', title: 'Organisation & Rechte', description: 'Organisatorische Anliegen und allgemeine Anträge' }
  ];

  // Filtere Karten basierend auf Suchbegriff
  const filteredCards = allCards.filter(card =>
    card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.items.some(item => item.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Gruppiere gefilterte Karten nach Kategorien
  const groupedCards = categories.map(category => ({
    ...category,
    cards: filteredCards.filter(card => card.category === category.title)
  })).filter(category => category.cards.length > 0);

  // Favoriten-Karten filtern
  const favoriteCards = allCards.filter(card => favorites.includes(card.id));

  // Hilfsfunktion für dynamische Farbklassen
  const getColorClasses = (color: string) => {
    const colorMap: { [key: string]: { bg: string; text: string; border: string; bullet: string } } = {
      blue: { bg: 'bg-blue-100 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200/50 dark:border-blue-700/50', bullet: 'bg-blue-600 dark:bg-blue-400' },
      emerald: { bg: 'bg-emerald-100 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200/50 dark:border-emerald-700/50', bullet: 'bg-emerald-600 dark:bg-emerald-400' },
      purple: { bg: 'bg-purple-100 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200/50 dark:border-purple-700/50', bullet: 'bg-purple-600 dark:bg-purple-400' },
      orange: { bg: 'bg-orange-100 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200/50 dark:border-orange-700/50', bullet: 'bg-orange-600 dark:bg-orange-400' },
      green: { bg: 'bg-green-100 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400', border: 'border-green-200/50 dark:border-green-700/50', bullet: 'bg-green-600 dark:bg-green-400' },
      indigo: { bg: 'bg-indigo-100 dark:bg-indigo-900/20', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-200/50 dark:border-indigo-700/50', bullet: 'bg-indigo-600 dark:bg-indigo-400' },
      teal: { bg: 'bg-teal-100 dark:bg-teal-900/20', text: 'text-teal-600 dark:text-teal-400', border: 'border-teal-200/50 dark:border-teal-700/50', bullet: 'bg-teal-600 dark:bg-teal-400' },
      cyan: { bg: 'bg-cyan-100 dark:bg-cyan-900/20', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-200/50 dark:border-cyan-700/50', bullet: 'bg-cyan-600 dark:bg-cyan-400' },
      red: { bg: 'bg-red-100 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400', border: 'border-red-200/50 dark:border-red-700/50', bullet: 'bg-red-600 dark:bg-red-400' },
      yellow: { bg: 'bg-yellow-100 dark:bg-yellow-900/20', text: 'text-yellow-600 dark:text-yellow-400', border: 'border-yellow-200/50 dark:border-yellow-700/50', bullet: 'bg-yellow-600 dark:bg-yellow-400' },
      pink: { bg: 'bg-pink-100 dark:bg-pink-900/20', text: 'text-pink-600 dark:text-pink-400', border: 'border-pink-200/50 dark:border-pink-700/50', bullet: 'bg-pink-600 dark:bg-pink-400' },
      lime: { bg: 'bg-lime-100 dark:bg-lime-900/20', text: 'text-lime-600 dark:text-lime-400', border: 'border-lime-200/50 dark:border-lime-700/50', bullet: 'bg-lime-600 dark:bg-lime-400' },
      amber: { bg: 'bg-amber-100 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200/50 dark:border-amber-700/50', bullet: 'bg-amber-600 dark:bg-amber-400' },
      slate: { bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-200/50 dark:border-slate-600/50', bullet: 'bg-slate-600 dark:bg-slate-400' }
    };
    return colorMap[color] || colorMap.slate;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
         if (selectedAntragstyp === 'Freitextantrag' || selectedAntragstyp === 'Besuch' || selectedAntragstyp === 'Gesundheit' || selectedAntragstyp === 'Vollzugslockerung') {
       if (!betreff.trim()) {
         alert('Bitte geben Sie einen Betreff ein.');
         return;
       }
       if (!begruendung.trim()) {
         alert('Bitte geben Sie eine Begründung ein.');
         return;
       }
     }

     if (selectedAntragstyp === 'Taschengeld-Antrag' && !monat.trim()) {
       alert('Bitte wählen Sie einen Monat aus.');
       return;
     }

    // Automatischen Betreff für Taschengeld-Antrag generieren
    const generateBetreff = () => {
      if (selectedAntragstyp === 'Taschengeld-Antrag' && monat) {
        const [year, month] = monat.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        const monthName = date.toLocaleDateString('de-DE', { month: 'long' });
        return `Taschengeld-Antrag für ${monthName} ${year}`;
      }
      return betreff.trim();
    };

    try {
      setSaving(true);
      
             // Anpassung an die bestehende API-Struktur
       const serviceData = {
         title: generateBetreff(),
         description: begruendung.trim() || `Antragstyp: ${selectedAntragstyp}${monat ? ` für ${monat}` : ''}`,
         priority: 'MEDIUM',
         antragstyp: selectedAntragstyp
       };

      const response = await api.post('/services/my/services', serviceData);

      if (response.data) {
        setSuccess(true);
        // Formular zurücksetzen
        setBetreff('');
        setBegruendung('');
        setMonat('');
        setSelectedAntragstyp(null);
        setShowModal(false);
        
        // Erfolgsmeldung nach 3 Sekunden ausblenden
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Fehler beim Erstellen des Antrags:', error);
      alert('Fehler beim Erstellen des Antrags');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setBetreff('');
    setBegruendung('');
    setMonat('');
    setSelectedAntragstyp(null);
    setShowModal(false);
  };

  const toggleFavorite = (cardId: string) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(cardId) 
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId];
      
      // Favoriten in localStorage speichern
      localStorage.setItem('antragFavorites', JSON.stringify(newFavorites));
      
      return newFavorites;
    });
  };

  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

     return (
     <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
       <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Success Message */}
        {success && (
          <div className="mb-8 p-6 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border border-emerald-200/70 dark:border-emerald-700/50 rounded-2xl shadow-md">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-emerald-600 dark:bg-emerald-500 rounded-full flex items-center justify-center mr-4">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-emerald-800 dark:text-emerald-200 font-semibold text-lg">
                  Antrag erfolgreich erstellt!
                </p>
                <p className="text-emerald-700 dark:text-emerald-300 text-sm mt-1">
                  Ihr Antrag wurde an die Verwaltung weitergeleitet.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight mb-4">
            Neuen Antrag erstellen
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            Wählen Sie den gewünschten Antragstyp aus
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8 flex justify-center">
          <input
            type="text"
            placeholder="Suche nach Antragstypen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
          />
        </div>

        {/* Favoriten Sektion */}
        {favoriteCards.length > 0 && (
          <div className="mb-12">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Favoriten</h2>
              <p className="text-lg text-slate-600 dark:text-slate-300">Ihre favorisierten Antragstypen</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {favoriteCards.map((card) => {
                const colorClasses = getColorClasses(card.color);
                return (
                  <div
                    key={card.id}
                    className="group bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 rounded-2xl shadow-md hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 ease-in-out hover:-translate-y-1 cursor-pointer p-8 relative"
                  >
                    {/* Favoriten-Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(card.id);
                      }}
                      className="absolute top-4 right-4 z-10 p-2 text-red-500 hover:text-red-600 transition-colors duration-200"
                    >
                      <svg className="w-6 h-6 fill-current" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                    
                    <div className="text-center" onClick={card.onClick}>
                      <div className={`w-20 h-20 ${colorClasses.bg} rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200`}>
                        <svg className={`w-10 h-10 ${colorClasses.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={card.icon} />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-3">{card.title}</h3>
                      <p className="text-base text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">{card.description}</p>
                      <div className={`${colorClasses.bg} border ${colorClasses.border} rounded-xl p-5 text-left`}>
                        <h4 className={`font-semibold ${colorClasses.text} mb-3`}>
                          Benötigte Informationen:
                        </h4>
                        <ul className={`text-sm ${colorClasses.text} list-disc list-outside pl-6 space-y-2 marker:${colorClasses.text} marker:leading-none`}>
                          {card.items.map((item, index) => (
                            <li key={index} className="pl-0 leading-relaxed">{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Kategorien */}
        <div className="space-y-12 max-w-6xl mx-auto mb-12">
          {groupedCards.map((category) => (
            <div key={category.id}>
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">{category.title}</h2>
                <p className="text-lg text-slate-600 dark:text-slate-300">{category.description}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {category.cards.map((card) => {
                  const colorClasses = getColorClasses(card.color);
                  return (
                    <div
                      key={card.id}
                      className="group bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 rounded-2xl shadow-md hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 ease-in-out hover:-translate-y-1 cursor-pointer p-8 relative"
                    >
                      {/* Favoriten-Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(card.id);
                        }}
                        className={`absolute top-4 right-4 z-10 p-2 transition-colors duration-200 ${
                          favorites.includes(card.id) 
                            ? 'text-red-500 hover:text-red-600' 
                            : 'text-slate-400 hover:text-red-500'
                        }`}
                      >
                        <svg 
                          className={`w-6 h-6 ${favorites.includes(card.id) ? 'fill-current' : 'fill-none'}`} 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>
                      
                      <div className="text-center" onClick={card.onClick}>
                        <div className={`w-20 h-20 ${colorClasses.bg} rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200`}>
                          <svg className={`w-10 h-10 ${colorClasses.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={card.icon} />
                          </svg>
                        </div>
                        <h3 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-3">{card.title}</h3>
                        <p className="text-base text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">{card.description}</p>
                        <div className={`${colorClasses.bg} border ${colorClasses.border} rounded-xl p-5 text-left`}>
                          <h4 className={`font-semibold ${colorClasses.text} mb-3`}>
                            Benötigte Informationen:
                          </h4>
                          <ul className={`text-sm ${colorClasses.text} list-disc list-outside pl-6 space-y-2 marker:${colorClasses.text} marker:leading-none`}>
                            {card.items.map((item, index) => (
                              <li key={index} className="pl-0 leading-relaxed">{item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200/50 dark:border-blue-700/50 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 ease-in-out hover:-translate-y-1 p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Wichtige Hinweise:
              </h3>
              <ul className="text-slate-700 dark:text-slate-300 space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Anträge werden automatisch mit dem Status "PENDING" erstellt</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Sie können den Status Ihrer Anträge in der Antragsübersicht einsehen</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Taschengeld-Anträge können nur für zukünftige Monate erstellt werden</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Alle Anträge werden mit Ihren persönlichen Daten verknüpft</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Modal für Antragsdaten */}
        {showModal && selectedAntragstyp && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 rounded-2xl shadow-xl max-w-md w-full mx-4 transition-all duration-200 ease-in-out">
              <div className="px-8 py-6 border-b border-slate-200/70 dark:border-slate-700">
                <div className="flex justify-between items-center">
                                                      <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                      {selectedAntragstyp === 'Freitextantrag' ? 'Sonstiges Anliegen' : 
                       selectedAntragstyp === 'Taschengeld-Antrag' ? 'Taschengeld-Antrag' :
                       selectedAntragstyp === 'Besuch' ? 'Besuchsantrag' :
                       selectedAntragstyp === 'Gesundheit' ? 'Gesundheitsantrag' :
                       selectedAntragstyp === 'Vollzugslockerung' ? 'Vollzugslockerung' : 'Antrag'} erstellen
                    </h2>
                  <button
                    onClick={handleCancel}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-200"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="px-8 py-6">
                <div className="space-y-6">
                                     {/* Betreff (für alle Antragstypen außer Taschengeld) */}
                   {selectedAntragstyp !== 'Taschengeld-Antrag' && (
                     <div>
                       <label className="block text-base font-medium text-slate-700 dark:text-slate-300 mb-2">
                         Betreff *
                       </label>
                       <input
                         type="text"
                         value={betreff}
                         onChange={(e) => setBetreff(e.target.value)}
                         className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                         placeholder={
                           selectedAntragstyp === 'Freitextantrag' ? 'Kurze Beschreibung des Antrags' :
                           selectedAntragstyp === 'Besuch' ? 'Art des Besuchs (z.B. Familienbesuch, Anwalt)' :
                           selectedAntragstyp === 'Gesundheit' ? 'Gesundheitsanliegen (z.B. Arzttermin, Therapie)' :
                           selectedAntragstyp === 'Vollzugslockerung' ? 'Art der Lockerung (z.B. Freistellung, Ausgang)' :
                           'Kurze Beschreibung des Antrags'
                         }
                         required
                       />
                     </div>
                   )}

                   {/* Begründung (für alle Antragstypen außer Taschengeld) */}
                   {selectedAntragstyp !== 'Taschengeld-Antrag' && (
                     <div>
                       <label className="block text-base font-medium text-slate-700 dark:text-slate-300 mb-2">
                         Begründung *
                       </label>
                       <textarea
                         value={begruendung}
                         onChange={(e) => setBegruendung(e.target.value)}
                         rows={4}
                         className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 resize-none"
                         placeholder={
                           selectedAntragstyp === 'Freitextantrag' ? 'Detaillierte Begründung für Ihren Antrag' :
                           selectedAntragstyp === 'Besuch' ? 'Detaillierte Begründung für den Besuchsantrag' :
                           selectedAntragstyp === 'Gesundheit' ? 'Detaillierte Beschreibung der gesundheitlichen Anliegen' :
                           selectedAntragstyp === 'Vollzugslockerung' ? 'Detaillierte Begründung für die Vollzugslockerung' :
                           'Detaillierte Begründung für Ihren Antrag'
                         }
                         required
                       />
                     </div>
                   )}

                   {/* Monat (nur für Taschengeld-Antrag) */}
                   {selectedAntragstyp === 'Taschengeld-Antrag' && (
                     <div>
                       <label className="block text-base font-medium text-slate-700 dark:text-slate-300 mb-2">
                         Monat *
                       </label>
                       <input
                         type="month"
                         value={monat}
                         onChange={(e) => setMonat(e.target.value)}
                         min={getCurrentMonth()}
                         className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                         required
                       />
                       <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                         Wählen Sie den Monat, für den Sie Taschengeld beantragen möchten
                       </p>
                     </div>
                   )}
                </div>

                <div className="mt-8 flex gap-4 justify-end">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={saving}
                    className="px-6 py-3 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-all duration-200 ease-in-out hover:-translate-y-1 disabled:opacity-50 disabled:hover:transform-none"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl transition-all duration-200 ease-in-out hover:-translate-y-1 shadow-md hover:shadow-lg disabled:hover:transform-none flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Erstelle Antrag...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Antrag erstellen
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
