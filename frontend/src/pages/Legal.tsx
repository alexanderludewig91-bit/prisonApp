import React from 'react'

const Legal: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-[#060E5D] to-[#1a47a3] px-8 py-8">
            <h1 className="text-2xl md:text-3xl font-bold text-white">Impressum & Datenschutz</h1>
          </div>

          <div className="p-8 space-y-8">
            {/* Impressum */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900">Impressum</h2>
              <p className="text-gray-700 leading-relaxed">
                Anbieter: Dr. Alexander Hayward
              </p>
              <p className="text-gray-700 leading-relaxed">
                Kontakt: <a href="mailto:Alexander.Hayward@pd-g.de" className="text-[#060E5D] hover:underline">Alexander.Hayward@pd-g.de</a>
               <p>
               Hinweis: Es handelt sich um eine nicht-kommerzielle Demonstrationsanwendung. Eine ladungsfähige Anschrift wird aus Datenschutzgründen nicht veröffentlicht.
               </p>
               
              </p>
              <p className="text-gray-700 leading-relaxed">
                Prisoner Services - Diese Anwendung befindet sich in Entwicklung und dient ausschließlich der Demonstration von Konzepten. Sie erhebt keine personenbezogenen Daten realer Nutzer.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Geltungsbereich: Diese Angaben gelten für die unter <a href="https://frontend-production-3082.up.railway.app/" className="text-[#060E5D] hover:underline">https://frontend-production-3082.up.railway.app/</a> erreichbare Anwendung.
              </p>
              
            </section>

            {/* Haftung/Urheberrecht */}
            <section className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">Haftung & Urheberrecht</h3>
              <p className="text-gray-700 leading-relaxed">
                Die Inhalte dieser Anwendung wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte kann keine Gewähr  übernommen werden. Alle Inhalte unterliegen dem deutschen Urheberrecht.
              </p>
            </section>

            {/* Datenschutz */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900">Datenschutz</h2>
              <p className="text-gray-700 leading-relaxed">
                Diese Datenschutzhinweise gelten für die Anwendung „Prisoner Services“.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Zweck der Verarbeitung: Demonstration einer Softwarelösung für das digitale Antragswesen im deutschen Justizvollzug (Demo-/Testbetrieb). Es werden ausschließlich Testkonten und Testdaten verwendet.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Es werden keine Tracking- oder Marketing-Cookies eingesetzt. Es erfolgt keine Protokollierung oder Analyse über das technisch notwendige Maß hinaus.
              </p>
              <p className="text-gray-700 leading-relaxed">
              Rechtsgrundlagen: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse: Demonstration und Funktionsprüfung der Software), ggf. Art. 6 Abs. 1 lit. b DSGVO für die Bereitstellung von Test-Logins.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Empfänger/Drittland: KI-Funktionen nutzen OpenAI als Dienstleister. Hierbei kann eine Datenübermittlung in Drittländer (z. B. USA) erfolgen. OpenAI setzt unter anderem EU-Standardvertragsklauseln ein, um ein angemessenes Datenschutzniveau zu gewährleisten.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Speicherdauer: Testdaten werden nur für den Demo-/Testzweck vorgehalten. Personenbeziehbarkeit ist nicht Gegenstand der Demonstration; es findet kein Tracking der einzelnen Nutzer statt.
              </p>
              
              <p className="text-gray-500 text-sm">Stand: 2. November 2025, Version 1.0</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Legal
