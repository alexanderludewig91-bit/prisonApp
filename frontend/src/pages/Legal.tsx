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
                Verantwortlich für den Inhalt: Dr. Alexander Hayward
              </p>
              <p className="text-gray-700 leading-relaxed">
                Kontakt:{' '}
                <a href="mailto:Datenschutz@Hayward-Consulting.de" className="text-[#060E5D] hover:underline">
                  Datenschutz@Hayward-Consulting.de
                </a>
              </p>
              <p className="text-gray-700 leading-relaxed">
                Art des Angebots: Bei „Prisoner Services“ handelt es sich um ein privates, nicht-kommerzielles
                Demonstrationsprojekt. Die Anwendung wird ohne Gewinnerzielungsabsicht bereitgestellt, es werden
                keine Leistungen angeboten, beworben oder gegen Entgelt erbracht und es findet keine
                Vertragsanbahnung statt. Sie dient ausschließlich der Veranschaulichung technischer und fachlicher
                Konzepte.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Die Anwendung befindet sich in Entwicklung. Sämtliche dargestellten Personen, Vorgänge und
                Dokumente sind frei erfunden; es werden keine personenbezogenen Daten realer Inhaftierter oder
                Bediensteter verarbeitet.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Geltungsbereich: Diese Angaben gelten für die unter{' '}
                <a
                  href="https://frontend-production-3082.up.railway.app/"
                  className="text-[#060E5D] hover:underline"
                >
                  https://frontend-production-3082.up.railway.app/
                </a>{' '}
                erreichbare Anwendung.
              </p>
            </section>

            {/* Haftung/Urheberrecht */}
            <section className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">Haftung & Urheberrecht</h3>
              <p className="text-gray-700 leading-relaxed">
                Die Inhalte dieser Anwendung wurden mit größter Sorgfalt erstellt. Für die Richtigkeit,
                Vollständigkeit und Aktualität der Inhalte kann keine Gewähr übernommen werden. Alle Inhalte
                unterliegen dem deutschen Urheberrecht.
              </p>
            </section>

            {/* Datenschutz */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900">Datenschutz</h2>
              <p className="text-gray-700 leading-relaxed">
                Diese Datenschutzhinweise gelten für die Anwendung „Prisoner Services“.
              </p>

              <h3 className="text-base font-semibold text-gray-900 pt-2">Verantwortlicher</h3>
              <p className="text-gray-700 leading-relaxed">
                Verantwortlicher im Sinne des Art. 4 Nr. 7 DSGVO ist Dr. Alexander Hayward, erreichbar unter{' '}
                <a href="mailto:Datenschutz@Hayward-Consulting.de" className="text-[#060E5D] hover:underline">
                  Datenschutz@Hayward-Consulting.de
                </a>
                . Ein Datenschutzbeauftragter ist nicht bestellt, da die gesetzlichen Voraussetzungen hierfür
                nicht vorliegen.
              </p>

              <h3 className="text-base font-semibold text-gray-900 pt-2">Zweck und Rechtsgrundlagen</h3>
              <p className="text-gray-700 leading-relaxed">
                Zweck der Verarbeitung: Demonstration einer Softwarelösung für das digitale Antragswesen im
                deutschen Justizvollzug (Demo-/Testbetrieb). Es werden ausschließlich Testkonten und Testdaten
                verwendet.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Rechtsgrundlagen: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der Demonstration,
                Funktionsprüfung und am sicheren Betrieb der Anwendung) sowie Art. 6 Abs. 1 lit. b DSGVO für die
                Bereitstellung und Nutzung der Test-Logins.
              </p>

              <h3 className="text-base font-semibold text-gray-900 pt-2">Hosting und Server-Logfiles</h3>
              <p className="text-gray-700 leading-relaxed">
                Die Anwendung wird bei Railway Corporation, San Francisco, USA, gehostet, die als
                Auftragsverarbeiterin nach Art. 28 DSGVO tätig wird. Beim Aufruf der Anwendung verarbeitet der
                Server technisch notwendige Zugriffsdaten (IP-Adresse, Zeitpunkt der Anfrage, aufgerufene
                Ressource, Statuscode, übertragene Datenmenge, Referrer und User-Agent). Diese Daten sind für die
                Auslieferung und die Betriebssicherheit erforderlich und werden nicht zur Profilbildung genutzt.
              </p>

              <h3 className="text-base font-semibold text-gray-900 pt-2">Cookies und lokale Speicherung</h3>
              <p className="text-gray-700 leading-relaxed">
                Es werden keine Tracking- oder Marketing-Cookies eingesetzt und es findet keine Analyse des
                Nutzungsverhaltens statt. Im lokalen Speicher (localStorage) Ihres Browsers werden lediglich das
                Anmelde-Token sowie einzelne Oberflächeneinstellungen abgelegt. Diese sind für die Nutzung der
                Anwendung technisch erforderlich, verbleiben auf Ihrem Endgerät und können jederzeit über die
                Einstellungen Ihres Browsers gelöscht werden.
              </p>

              <h3 className="text-base font-semibold text-gray-900 pt-2">
                KI-Funktionen und Übermittlung in Drittländer
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Für die KI-gestützten Funktionen (unter anderem Übersetzung, Textvorschläge, Kategorisierung und
                der Chat-Assistent) werden je nach Konfiguration folgende Dienstleister eingesetzt: OpenAI,
                Anthropic (Claude) und Google (Gemini). Die von Ihnen eingegebenen Inhalte werden zur Verarbeitung
                an den jeweiligen Anbieter übermittelt.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Sofern Sie die Spracheingabe nutzen, wird die aufgezeichnete Audiodatei zur Transkription an
                OpenAI (Whisper) übermittelt; für die Sprachausgabe wird der jeweilige Text
                an den Text-to-Speech-Dienst von OpenAI übermittelt. Die Spracheingabe erfolgt freiwillig und nur auf Ihre ausdrückliche
                Auslösung hin.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Dabei kann eine Datenübermittlung in Drittländer, insbesondere die USA, erfolgen. Die genannten
                Anbieter setzen hierfür unter anderem EU-Standardvertragsklauseln ein, um ein angemessenes
                Datenschutzniveau zu gewährleisten. Bitte geben Sie in der Demo dennoch keine echten
                personenbezogenen oder vertraulichen Daten ein.
              </p>

              <h3 className="text-base font-semibold text-gray-900 pt-2">Speicherdauer</h3>
              <p className="text-gray-700 leading-relaxed">
                Testdaten werden nur für den Demo- und Testzweck vorgehalten und können jederzeit ohne
                Vorankündigung zurückgesetzt oder gelöscht werden. Server-Logfiles werden nur so lange
                gespeichert, wie es für den sicheren Betrieb erforderlich ist. Eine Personenbeziehbarkeit ist
                nicht Gegenstand der Demonstration; ein Tracking einzelner Nutzerinnen und Nutzer findet nicht
                statt.
              </p>

              <h3 className="text-base font-semibold text-gray-900 pt-2">Ihre Rechte</h3>
              <p className="text-gray-700 leading-relaxed">
                Sie haben im Rahmen der gesetzlichen Voraussetzungen das Recht auf Auskunft über die zu Ihrer
                Person verarbeiteten Daten (Art. 15 DSGVO), auf Berichtigung (Art. 16 DSGVO), auf Löschung
                (Art. 17 DSGVO), auf Einschränkung der Verarbeitung (Art. 18 DSGVO) sowie auf Datenübertragbarkeit
                (Art. 20 DSGVO).
              </p>
              <p className="text-gray-700 leading-relaxed">
                Soweit die Verarbeitung auf Art. 6 Abs. 1 lit. f DSGVO beruht, haben Sie das Recht, aus Gründen,
                die sich aus Ihrer besonderen Situation ergeben, jederzeit Widerspruch gegen die Verarbeitung
                einzulegen (Art. 21 DSGVO). Eine erteilte Einwilligung können Sie jederzeit mit Wirkung für die
                Zukunft widerrufen.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Zur Ausübung dieser Rechte genügt eine Nachricht an{' '}
                <a href="mailto:Datenschutz@Hayward-Consulting.de" className="text-[#060E5D] hover:underline">
                  Datenschutz@Hayward-Consulting.de
                </a>
                .
              </p>
              <p className="text-gray-700 leading-relaxed">
                Unabhängig davon steht Ihnen nach Art. 77 DSGVO ein Beschwerderecht bei einer
                Datenschutz-Aufsichtsbehörde zu, insbesondere bei der Behörde Ihres gewöhnlichen Aufenthaltsorts,
                Ihres Arbeitsplatzes oder des Orts des mutmaßlichen Verstoßes.
              </p>

              <p className="text-gray-500 text-sm pt-2">Stand: 25. August 2026, Version 1.1</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Legal
