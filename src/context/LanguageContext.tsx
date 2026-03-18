
import React, { createContext, useState, useContext, ReactNode } from 'react';

export type Language = 'it' | 'en' | 'es' | 'de';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const translations = {
  it: {
    // Navbar
    'demo.request': 'Richiedi Demo',
    'dashboard': 'Dashboard',
    
    // Hero
    'hero.title': 'La Rivoluzione IoT per l\'HoReCa e le macchine da caffè Professionali',
    'hero.subtitle': 'Monitora, analizza e ottimizza i tuoi dispositivi in tempo reale con una piattaforma unica e centralizzata.',
    'hero.cta': 'Richiedi una demo gratuita',
    
    // Key points
    'keypoint.dashboard.title': 'Un\'unica dashboard multibrand',
    'keypoint.dashboard.desc': 'Gestisci tutte le tue macchine da caffè da un\'unica interfaccia intuitiva',
    'keypoint.consumption.title': 'Consumo elettrico su singole unità grazie all\'IoT',
    'keypoint.consumption.desc': 'Connettività nativa con le macchine di ultima generazione',
    'keypoint.monitoring.title': 'Controllo in tempo reale',
    'keypoint.monitoring.desc': 'Monitora ogni parametro della macchina, istante per istante',
    
    // Sfide section
    'sfide.title': 'Perché scegliere una piattaforma IoT?',
    'sfide.subtitle': 'I dati parlano chiaro: il monitoraggio remoto delle macchine da caffè porta vantaggi concreti in termini di efficienza, risparmio e qualità del servizio.',
    'sfide.stat1.title': 'fermi macchina grazie alla manutenzione predittiva IoT',
    'sfide.stat1.desc': 'Le soluzioni IoT riducono drasticamente i tempi di inattività, evitando guasti improvvisi.',
    'sfide.stat1.source': 'Fonte: Highgear.com',
    'sfide.stat2.title': 'consumo elettrico su singole unità grazie all\'IoT',
    'sfide.stat2.desc': 'Monitorando attrezzature come gruppi frigo e macchine, si tagliano i costi energetici e si migliora la sostenibilità.',
    'sfide.stat2.source': 'Fonte: best.energy',
    'sfide.stat3.title': 'interventi tecnici on-site grazie al controllo da remoto',
    'sfide.stat3.desc': 'L\'IoT consente di diagnosticare o risolvere problemi a distanza, riducendo le uscite tecniche e i relativi costi.',
    'sfide.stat3.source': 'Fonte: cadservices.nl',
    'sfide.stat4.title': 'dei clienti sceglie un bar per la qualità del caffè',
    'sfide.stat4.desc': 'Una macchina mal calibrata compromette il gusto. L\'IoT garantisce costanza e qualità su ogni erogazione.',
    'sfide.stat4.source': 'Fonte: caffebenessere.it',
    
    // UnisolSolution
    'unisol.title': 'Tutti i dati, un\'unica soluzione',
    'unisol.subtitle': 'La piattaforma qonneq centralizza il monitoraggio di tutti i tuoi dispositivi per un controllo completo e senza complicazioni.',
    'unisol.feature1.title': 'Multibrand, un\'unica piattaforma',
    'unisol.feature1.desc': 'Qonneq aggrega dati da diverse macchine e accessori senza bisogno di più applicazioni, offrendo una gestione centralizzata e semplificata.',
    'unisol.feature2.title': 'Monitoraggio real time',
    'unisol.feature2.desc': 'Verifica e controllo di tutti i parametri della macchina in tempo reale.',
    'unisol.feature3.title': 'Nessun hardware aggiuntivo',
    'unisol.feature3.desc': 'Non servono installazioni fisiche sulle macchine: qonneq sfrutta apparecchiature di ultima generazione con connessione nativa.',
    'unisol.feature4.title': 'Manutenzione predittiva',
    'unisol.feature4.desc': 'Previeni i guasti e riduci i fermi macchina intervenendo tempestivamente.',

    // Vantaggi (Dati sotto controllo)
    'vantaggi.title': 'Tutti i dati sotto controllo',
    'vantaggi.subtitle': 'qonneq raccoglie e analizza i parametri chiave per un controllo totale',
    'vantaggi.tab1': 'Utilizzi e consumi',
    'vantaggi.tab1.item1': 'Numero di erogazioni effettuate',
    'vantaggi.tab1.item2': 'Tipologia di bevande preparate',
    'vantaggi.tab1.item3': 'Consumo totale di acqua e caffè',
    'vantaggi.tab2': 'Stato della macchina',
    'vantaggi.tab2.item1': 'Pressione e temperatura di erogazione',
    'vantaggi.tab2.item2': 'Livelli di usura dei componenti',
    'vantaggi.tab2.item3': 'Segnalazioni di anomalie o guasti',
    'vantaggi.tab3': 'Manutenzione e performance',
    'vantaggi.tab3.item1': 'Stato dei filtri e necessità di sostituzione',
    'vantaggi.tab3.item2': 'Rilevazione breakdown e fermo macchina',
    'vantaggi.tab3.item3': 'Monitoraggio del rendimento energetico',
    'vantaggi.tab4': 'Qualità del caffè',
    'vantaggi.tab4.item1': 'Controllo taratura e macinatura dosi',
    'vantaggi.tab4.item2': 'Conformità ai parametri ottimali',
    'vantaggi.tab4.item3': 'Variazioni nei pattern di consumo',
    'vantaggi.integration': 'Integrazione con i Sistemi di Pagamento',
    'vantaggi.integration.desc': 'qonneq è in grado di rilevare i dati dai sistemi di pagamento integrati nelle macchine, inclusi lettori carta e contactless.',
    
    // Integrazioni
    'integrazioni.title': 'Massima libertà di integrazione',
    'integrazioni.subtitle': 'Scegli la soluzione più adatta alle tue esigenze',
    'integrazioni.option1.title': 'Integrazione con il tuo ERP',
    'integrazioni.option1.point1': 'Se hai già un gestionale, qonneq funziona come dashboard esterna',
    'integrazioni.option1.point2': 'Accesso ai dati e controllo completo, senza cambiare sistema',
    'integrazioni.option1.point3': 'Interfaccia intuitiva per monitorare ogni macchina in tempo reale',
    'integrazioni.option2.title': 'Integrazione con Todo',
    'integrazioni.option2.point1': 'qonneq diventa un modulo integrato in Todo, il nostro ERP per torrefattori',
    'integrazioni.option2.point2': 'Tutto in un unico ambiente, direttamente dal gestionale',
    'integrazioni.option2.point3': 'Massima efficienza: senza bisogno di soluzioni esterne',
    
    // Chi Siamo
    'chisiamo.title': 'Chi siamo',
    'chisiamo.description': 'qonneq nasce da un team di esperti del settore caffè, con l\'obiettivo di rivoluzionare la gestione delle macchine da caffè attraverso soluzioni IoT innovative per digitalizzare le aziende di ogni settore e dimensione.',
    'chisiamo.feature1.title': '+50 Clienti',
    'chisiamo.feature1.desc': 'Collaboriamo con oltre 50 Torrefazioni, offrendo soluzioni personalizzate e di alta qualità. Il nostro obiettivo è supportare i nostri Clienti nell\'ottimizzazione dei loro processi produttivi.',
    'chisiamo.feature2.title': 'Milano/Roma',
    'chisiamo.feature2.desc': 'Alla nostra presenza storica su Milano, si è aggiunta la neonata sede su Roma. Questo ci consente di rispondere prontamente alle esigenze del mercato e di garantire un supporto diretto.',
    'chisiamo.feature3.title': '+25 anni',
    'chisiamo.feature3.desc': 'Da oltre un quarto di secolo, lavoriamo fianco a fianco con le Torrefazioni, sviluppando competenze e conoscenze approfondite nel settore del caffè. La nostra esperienza ci permette di proporre soluzioni innovative e di qualità superiore.',
    
    // BusinessPlatform
    'business.title': 'Servizi a valore aggiunto',
    'business.subtitle': 'Un supporto completo per accompagnarti nella digitalizzazione',
    'business.feature1.title': 'Consulenza IT e assistenza',
    'business.feature1.desc': 'Centro di assistenza dedicato. Helpdesk a supporto dei Clienti',
    'business.feature2.title': 'Industrial IoT e Web Technologies',
    'business.feature2.desc': 'Team dedicato allo studio delle nuove tecnologie e sviluppo di App aziendali',
    'business.feature3.title': 'Consulenza ERP personalizzata',
    'business.feature3.desc': 'Team di consulenti dedicati alla consulenza specifica in ambito ERP e torrefazione digitale',
    
    // CTA
    'cta.title': 'Pronto a semplificare la gestione delle tue macchine da caffè?',
    'cta.subtitle': 'Scopri come qonneq può rivoluzionare il monitoraggio e la manutenzione delle tue apparecchiature.',
    'cta.success.title': 'Grazie per il tuo messaggio!',
    'cta.success.message': 'Ti contatteremo al più presto.',
    'cta.form.name': 'Nome e Cognome',
    'cta.form.name.placeholder': 'Inserisci il tuo nome completo',
    'cta.form.company': 'Azienda',
    'cta.form.company.placeholder': 'Nome della tua azienda',
    'cta.form.email': 'Email',
    'cta.form.email.placeholder': 'La tua email',
    'cta.form.phone': 'Telefono',
    'cta.form.phone.placeholder': 'Numero di telefono',
    'cta.form.message': 'Messaggio',
    'cta.form.message.placeholder': 'Scrivi qui il tuo messaggio...',
    'cta.form.privacy': 'Con l\'invio del seguente modulo dichiaro di aver letto l\'informativa privacy ed autorizzo il titolare a rispondermi per quanto espresso dell\'informativa privacy.',
    'cta.form.submit': 'Invia messaggio',
    'cta.form.sending': 'Invio in corso...',
    
    // Form validation messages
    'validation.name': 'Il nome deve avere almeno 2 caratteri',
    'validation.company': 'L\'azienda deve avere almeno 2 caratteri',
    'validation.email': 'Email non valida',
    'validation.phone': 'Inserire un numero di telefono valido',
    'validation.message': 'Il messaggio deve avere almeno 10 caratteri',
    
    // Success/error messages
    'message.success': 'Messaggio inviato con successo!',
    'message.error': 'Errore durante l\'invio del messaggio. Riprova più tardi.',
    
    // Footer
    'footer.company': 'qonneq by Encodata S.r.l.',
    'footer.address': 'Strada 4 - Palazzo Q7 - Centro Direzionale MilanoFiori - 20057 Assago (MI) - P.IVA: 13419330157',
    'footer.copyright': '© {year} qonneq. Tutti i diritti riservati.',
    'footer.privacy': 'Privacy',
    'footer.cookies': 'Cookie',

    // Dashboard Page
    'dashboard.title': 'Dashboard',
    'dashboard.subtitle': 'Monitora tutte le tue macchine da caffè in un\'unica interfaccia',
    'dashboard.description': 'Accedi a statistiche e metriche in tempo reale'
  },
  en: {
    // Navbar
    'demo.request': 'Request Demo',
    'dashboard': 'Control Panel',
    
    // Hero
    'hero.title': 'The IoT Revolution for HoReCa and Professional Coffee Machines',
    'hero.subtitle': 'Monitor, analyze, and optimize your devices in real-time with a unique, centralized platform.',
    'hero.cta': 'Request a free demo',
    
    // Key points
    'keypoint.dashboard.title': 'A single multibrand dashboard',
    'keypoint.dashboard.desc': 'Manage all your coffee machines from one intuitive interface',
    'keypoint.consumption.title': 'Power consumption on individual units thanks to IoT',
    'keypoint.consumption.desc': 'Native connectivity with the latest generation machines',
    'keypoint.monitoring.title': 'Real-time control',
    'keypoint.monitoring.desc': 'Monitor every parameter of the machine, moment by moment',
    
    // Sfide section
    'sfide.title': 'Why choose an IoT platform?',
    'sfide.subtitle': 'The data is clear: remote monitoring of coffee machines brings concrete advantages in terms of efficiency, savings, and service quality.',
    'sfide.stat1.title': 'machine downtime thanks to IoT predictive maintenance',
    'sfide.stat1.desc': 'IoT solutions dramatically reduce downtime by preventing sudden breakdowns.',
    'sfide.stat1.source': 'Source: Highgear.com',
    'sfide.stat2.title': 'power consumption on single units thanks to IoT',
    'sfide.stat2.desc': 'By monitoring equipment like refrigeration units and machines, energy costs are cut and sustainability improves.',
    'sfide.stat2.source': 'Source: best.energy',
    'sfide.stat3.title': 'on-site technical interventions thanks to remote control',
    'sfide.stat3.desc': 'IoT enables remote diagnosis or problem-solving, reducing technical visits and related costs.',
    'sfide.stat3.source': 'Source: cadservices.nl',
    'sfide.stat4.title': 'of customers choose a café for its coffee quality',
    'sfide.stat4.desc': 'A poorly calibrated machine compromises taste. IoT ensures consistency and quality for every cup.',
    'sfide.stat4.source': 'Source: caffebenessere.it',
    
    // UnisolSolution
    'unisol.title': 'All data, one solution',
    'unisol.subtitle': 'The qonneq platform centralizes the monitoring of all your devices for complete control without complications.',
    'unisol.feature1.title': 'Multibrand, a single platform',
    'unisol.feature1.desc': 'Qonneq aggregates data from different machines and accessories without requiring multiple applications, offering centralized and simplified management.',
    'unisol.feature2.title': 'Real-time monitoring',
    'unisol.feature2.desc': 'Verify and control all machine parameters in real time.',
    'unisol.feature3.title': 'No additional hardware',
    'unisol.feature3.desc': 'No physical installations needed on machines: qonneq leverages latest generation equipment with native connectivity.',
    'unisol.feature4.title': 'Predictive maintenance',
    'unisol.feature4.desc': 'Prevent breakdowns and reduce machine downtime with timely interventions.',

    // Vantaggi (Dati sotto controllo)
    'vantaggi.title': 'All data under control',
    'vantaggi.subtitle': 'qonneq collects and analyzes key parameters for total control',
    'vantaggi.tab1': 'Usage and consumption',
    'vantaggi.tab1.item1': 'Number of dispensations made',
    'vantaggi.tab1.item2': 'Types of beverages prepared',
    'vantaggi.tab1.item3': 'Total water and coffee consumption',
    'vantaggi.tab2': 'Machine status',
    'vantaggi.tab2.item1': 'Dispensing pressure and temperature',
    'vantaggi.tab2.item2': 'Component wear levels',
    'vantaggi.tab2.item3': 'Anomalies or breakdowns alerts',
    'vantaggi.tab3': 'Maintenance and performance',
    'vantaggi.tab3.item1': 'Filter status and replacement needs',
    'vantaggi.tab3.item2': 'Breakdown detection and machine stoppage',
    'vantaggi.tab3.item3': 'Energy performance monitoring',
    'vantaggi.tab4': 'Coffee quality',
    'vantaggi.tab4.item1': 'Dose calibration and grinding control',
    'vantaggi.tab4.item2': 'Conformity to optimal parameters',
    'vantaggi.tab4.item3': 'Variations in consumption patterns',
    'vantaggi.integration': 'Integration with Payment Systems',
    'vantaggi.integration.desc': 'qonneq can detect data from payment systems integrated into machines, including card readers and contactless systems.',
    
    // Integrazioni
    'integrazioni.title': 'Maximum integration freedom',
    'integrazioni.subtitle': 'Choose the solution that best suits your needs',
    'integrazioni.option1.title': 'Integration with your ERP',
    'integrazioni.option1.point1': 'If you already have a management system, qonneq works as an external dashboard',
    'integrazioni.option1.point2': 'Data access and complete control, without changing your system',
    'integrazioni.option1.point3': 'Intuitive interface to monitor each machine in real-time',
    'integrazioni.option2.title': 'Integration with Todo',
    'integrazioni.option2.point1': 'qonneq becomes an integrated module in Todo, our ERP for coffee roasters',
    'integrazioni.option2.point2': 'Everything in one environment, directly from the management system',
    'integrazioni.option2.point3': 'Maximum efficiency: no need for external solutions',
    
    // Chi Siamo
    'chisiamo.title': 'Who we are',
    'chisiamo.description': 'qonneq is born from a team of coffee industry experts, with the aim of revolutionizing coffee machine management through innovative IoT solutions to digitize companies of all sectors and sizes.',
    'chisiamo.feature1.title': '+50 Clients',
    'chisiamo.feature1.desc': 'We collaborate with over 50 Coffee Roasters, offering customized and high-quality solutions. Our goal is to support our clients in optimizing their production processes.',
    'chisiamo.feature2.title': 'Milan/Rome',
    'chisiamo.feature2.desc': 'In addition to our historical presence in Milan, we have added a new office in Rome. This allows us to respond promptly to market needs and provide direct support.',
    'chisiamo.feature3.title': '+25 years',
    'chisiamo.feature3.desc': 'For over a quarter of a century, we have been working side by side with Coffee Roasters, developing deep knowledge and expertise in the coffee sector. Our experience allows us to offer innovative and superior quality solutions.',
    
    // BusinessPlatform
    'business.title': 'Value-added services',
    'business.subtitle': 'A complete support to accompany you in digitization',
    'business.feature1.title': 'IT consultancy and assistance',
    'business.feature1.desc': 'Dedicated service center. Helpdesk to support Customers',
    'business.feature2.title': 'Industrial IoT and Web Technologies',
    'business.feature2.desc': 'Team dedicated to studying new technologies and developing company Apps',
    'business.feature3.title': 'Customized ERP consulting',
    'business.feature3.desc': 'Team of consultants dedicated to specific consulting in the ERP and digital coffee roasting field',
    
    // CTA
    'cta.title': 'Ready to simplify the management of your coffee machines?',
    'cta.subtitle': 'Discover how qonneq can revolutionize the monitoring and maintenance of your equipment.',
    'cta.success.title': 'Thank you for your message!',
    'cta.success.message': 'We will contact you soon.',
    'cta.form.name': 'Full Name',
    'cta.form.name.placeholder': 'Enter your full name',
    'cta.form.company': 'Company',
    'cta.form.company.placeholder': 'Your company name',
    'cta.form.email': 'Email',
    'cta.form.email.placeholder': 'Your email',
    'cta.form.phone': 'Phone',
    'cta.form.phone.placeholder': 'Phone number',
    'cta.form.message': 'Message',
    'cta.form.message.placeholder': 'Write your message here...',
    'cta.form.privacy': 'By submitting this form, I declare that I have read the privacy policy and authorize the owner to respond to me as expressed in the privacy policy.',
    'cta.form.submit': 'Send message',
    'cta.form.sending': 'Sending...',
    
    // Form validation messages
    'validation.name': 'Name must be at least 2 characters',
    'validation.company': 'Company must be at least 2 characters',
    'validation.email': 'Invalid email',
    'validation.phone': 'Enter a valid phone number',
    'validation.message': 'Message must be at least 10 characters',
    
    // Success/error messages
    'message.success': 'Message sent successfully!',
    'message.error': 'Error sending message. Please try again later.',
    
    // Footer
    'footer.company': 'qonneq by Encodata S.r.l.',
    'footer.address': 'Strada 4 - Palazzo Q7 - Centro Direzionale MilanoFiori - 20057 Assago (MI) - VAT: 13419330157',
    'footer.copyright': '© {year} qonneq. All rights reserved.',
    'footer.privacy': 'Privacy',
    'footer.cookies': 'Cookies',

    // Dashboard Page
    'dashboard.title': 'Control Panel',
    'dashboard.subtitle': 'Monitor all your coffee machines in a single interface',
    'dashboard.description': 'Access statistics and metrics in real-time'
  },
  es: {
    // Navbar
    'demo.request': 'Solicitar Demo',
    'dashboard': 'Panel de Control',
    
    // Hero
    'hero.title': 'La Revolución IoT para HoReCa y Máquinas de Café Profesionales',
    'hero.subtitle': 'Monitorea, analiza y optimiza tus dispositivos en tiempo real con una plataforma única y centralizada.',
    'hero.cta': 'Solicita una demo gratuita',
    
    // Key points
    'keypoint.dashboard.title': 'Un único panel de control multimarca',
    'keypoint.dashboard.desc': 'Gestiona todas tus máquinas de café desde una interfaz intuitiva',
    'keypoint.consumption.title': 'Consumo eléctrico en unidades individuales gracias al IoT',
    'keypoint.consumption.desc': 'Conectividad nativa con máquinas de última generación',
    'keypoint.monitoring.title': 'Control en tiempo real',
    'keypoint.monitoring.desc': 'Monitorea cada parámetro de la máquina, instante a instante',
    
    // Sfide section
    'sfide.title': '¿Por qué elegir una plataforma IoT?',
    'sfide.subtitle': 'Los datos hablan claro: el monitoreo remoto de máquinas de café aporta ventajas concretas en términos de eficiencia, ahorro y calidad del servicio.',
    'sfide.stat1.title': 'paradas de máquinas gracias al mantenimiento predictivo IoT',
    'sfide.stat1.desc': 'Las soluciones IoT reducen drásticamente los tiempos de inactividad, evitando averías repentinas.',
    'sfide.stat1.source': 'Fuente: Highgear.com',
    'sfide.stat2.title': 'consumo eléctrico en unidades individuales gracias al IoT',
    'sfide.stat2.desc': 'Al monitorear equipos como unidades de refrigeración y máquinas, se reducen los costos energéticos y mejora la sostenibilidad.',
    'sfide.stat2.source': 'Fuente: best.energy',
    'sfide.stat3.title': 'intervenciones técnicas in situ gracias al control remoto',
    'sfide.stat3.desc': 'El IoT permite diagnosticar o resolver problemas a distancia, reduciendo las visitas técnicas y los costos relacionados.',
    'sfide.stat3.source': 'Fuente: cadservices.nl',
    'sfide.stat4.title': 'de los clientes elige un bar por la calidad del café',
    'sfide.stat4.desc': 'Una máquina mal calibrada compromete el sabor. El IoT garantiza consistencia y calidad en cada servicio.',
    'sfide.stat4.source': 'Fuente: caffebenessere.it',
    
    // UnisolSolution
    'unisol.title': 'Todos los datos, una única solución',
    'unisol.subtitle': 'La plataforma qonneq centraliza el monitoreo de todos tus dispositivos para un control completo y sin complicaciones.',
    'unisol.feature1.title': 'Multimarca, una única plataforma',
    'unisol.feature1.desc': 'Qonneq agrega datos de diferentes máquinas y accesorios sin necesidad de múltiples aplicaciones, ofreciendo una gestión centralizada y simplificada.',
    'unisol.feature2.title': 'Monitoreo en tiempo real',
    'unisol.feature2.desc': 'Verifica y controla todos los parámetros de la máquina en tiempo real.',
    'unisol.feature3.title': 'Sin hardware adicional',
    'unisol.feature3.desc': 'No se necesitan instalaciones físicas en las máquinas: qonneq aprovecha equipos de última generación con conectividad nativa.',
    'unisol.feature4.title': 'Mantenimiento predictivo',
    'unisol.feature4.desc': 'Previene averías y reduce el tiempo de inactividad de las máquinas con intervenciones oportunas.',

    // Vantaggi (Dati sotto controllo)
    'vantaggi.title': 'Todos los datos bajo control',
    'vantaggi.subtitle': 'qonneq recopila y analiza parámetros clave para un control total',
    'vantaggi.tab1': 'Usos y consumos',
    'vantaggi.tab1.item1': 'Número de dispensaciones realizadas',
    'vantaggi.tab1.item2': 'Tipos de bebidas preparadas',
    'vantaggi.tab1.item3': 'Consumo total de agua y café',
    'vantaggi.tab2': 'Estado de la máquina',
    'vantaggi.tab2.item1': 'Presión y temperatura de dispensación',
    'vantaggi.tab2.item2': 'Niveles de desgaste de componentes',
    'vantaggi.tab2.item3': 'Alertas de anomalías o averías',
    'vantaggi.tab3': 'Mantenimiento y rendimiento',
    'vantaggi.tab3.item1': 'Estado del filtro y necesidades de reemplazo',
    'vantaggi.tab3.item2': 'Detección de averías y paradas de máquina',
    'vantaggi.tab3.item3': 'Monitoreo del rendimiento energético',
    'vantaggi.tab4': 'Calidad del café',
    'vantaggi.tab4.item1': 'Control de calibración y molienda de dosis',
    'vantaggi.tab4.item2': 'Conformidad con parámetros óptimos',
    'vantaggi.tab4.item3': 'Variaciones en los patrones de consumo',
    'vantaggi.integration': 'Integración con Sistemas de Pago',
    'vantaggi.integration.desc': 'qonneq puede detectar datos de los sistemas de pago integrados en las máquinas, incluidos lectores de tarjetas y sistemas sin contacto.',
    
    // Integrazioni
    'integrazioni.title': 'Máxima libertad de integración',
    'integrazioni.subtitle': 'Elige la solución que mejor se adapte a tus necesidades',
    'integrazioni.option1.title': 'Integración con tu ERP',
    'integrazioni.option1.point1': 'Si ya tienes un sistema de gestión, qonneq funciona como un panel de control externo',
    'integrazioni.option1.point2': 'Acceso a datos y control completo, sin cambiar tu sistema',
    'integrazioni.option1.point3': 'Interfaz intuitiva para monitorear cada máquina en tiempo real',
    'integrazioni.option2.title': 'Integración con Todo',
    'integrazioni.option2.point1': 'qonneq se convierte en un módulo integrado en Todo, nuestro ERP para tostadores de café',
    'integrazioni.option2.point2': 'Todo en un solo ambiente, directamente desde el sistema de gestión',
    'integrazioni.option2.point3': 'Máxima eficiencia: sin necesidad de soluciones externas',
    
    // Chi Siamo
    'chisiamo.title': 'Quiénes somos',
    'chisiamo.description': 'qonneq nace de un equipo de expertos en la industria del café, con el objetivo de revolucionar la gestión de máquinas de café a través de soluciones IoT innovadoras para digitalizar empresas de todos los sectores y tamaños.',
    'chisiamo.feature1.title': '+50 Clientes',
    'chisiamo.feature1.desc': 'Colaboramos con más de 50 Tostadores de Café, ofreciendo soluciones personalizadas y de alta calidad. Nuestro objetivo es apoyar a nuestros clientes en la optimización de sus procesos de producción.',
    'chisiamo.feature2.title': 'Milán/Roma',
    'chisiamo.feature2.desc': 'Además de nuestra presencia histórica en Milán, hemos añadido una nueva oficina en Roma. Esto nos permite responder con prontitud a las necesidades del mercado y brindar soporte directo.',
    'chisiamo.feature3.title': '+25 años',
    'chisiamo.feature3.desc': 'Durante más de un cuarto de siglo, hemos trabajado codo a codo con Tostadores de Café, desarrollando conocimientos y experiencia profundos en el sector cafetero. Nuestra experiencia nos permite ofrecer soluciones innovadoras y de calidad superior.',
    
    // BusinessPlatform
    'business.title': 'Servicios de valor añadido',
    'business.subtitle': 'Un soporte completo para acompañarte en la digitalización',
    'business.feature1.title': 'Consultoría y asistencia IT',
    'business.feature1.desc': 'Centro de servicio dedicado. Mesa de ayuda para apoyar a los Clientes',
    'business.feature2.title': 'IoT Industrial y Tecnologías Web',
    'business.feature2.desc': 'Equipo dedicado al estudio de nuevas tecnologías y desarrollo de Apps empresariales',
    'business.feature3.title': 'Consultoría ERP personalizada',
    'business.feature3.desc': 'Equipo de consultores dedicados a consultoría específica en el campo de ERP y tostado digital de café',
    
    // CTA
    'cta.title': '¿Listo para simplificar la gestión de tus máquinas de café?',
    'cta.subtitle': 'Descubre cómo qonneq puede revolucionar el monitoreo y mantenimiento de tu equipo.',
    'cta.success.title': '¡Gracias por tu mensaje!',
    'cta.success.message': 'Te contactaremos pronto.',
    'cta.form.name': 'Nombre completo',
    'cta.form.name.placeholder': 'Introduce tu nombre completo',
    'cta.form.company': 'Empresa',
    'cta.form.company.placeholder': 'Nombre de tu empresa',
    'cta.form.email': 'Email',
    'cta.form.email.placeholder': 'Tu email',
    'cta.form.phone': 'Teléfono',
    'cta.form.phone.placeholder': 'Número de teléfono',
    'cta.form.message': 'Mensaje',
    'cta.form.message.placeholder': 'Escribe tu mensaje aquí...',
    'cta.form.privacy': 'Al enviar este formulario, declaro que he leído la política de privacidad y autorizo al propietario a responderme según lo expresado en la política de privacidad.',
    'cta.form.submit': 'Enviar mensaje',
    'cta.form.sending': 'Enviando...',
    
    // Form validation messages
    'validation.name': 'El nombre debe tener al menos 2 caracteres',
    'validation.company': 'La empresa debe tener al menos 2 caracteres',
    'validation.email': 'Email inválido',
    'validation.phone': 'Introduce un número de teléfono válido',
    'validation.message': 'El mensaje debe tener al menos 10 caracteres',
    
    // Success/error messages
    'message.success': '¡Mensaje enviado con éxito!',
    'message.error': 'Error al enviar el mensaje. Por favor, inténtalo de nuevo más tarde.',
    
    // Footer
    'footer.company': 'qonneq by Encodata S.r.l.',
    'footer.address': 'Strada 4 - Palazzo Q7 - Centro Direzionale MilanoFiori - 20057 Assago (MI) - NIF: 13419330157',
    'footer.copyright': '© {year} qonneq. Todos los derechos reservados.',
    'footer.privacy': 'Privacidad',
    'footer.cookies': 'Cookies',

    // Dashboard Page
    'dashboard.title': 'Panel de Control',
    'dashboard.subtitle': 'Monitorea todas tus máquinas de café en una sola interfaz',
    'dashboard.description': 'Accede a estadísticas y métricas en tiempo real'
  },
  de: {
    // Navbar
    'demo.request': 'Demo anfordern',
    'dashboard': 'Kontrollzentrum',
    
    // Hero
    'hero.title': 'Die IoT-Revolution für HoReCa und professionelle Kaffeemaschinen',
    'hero.subtitle': 'Überwachen, analysieren und optimieren Sie Ihre Geräte in Echtzeit mit einer einzigartigen, zentralisierten Plattform.',
    'hero.cta': 'Fordern Sie eine kostenlose Demo an',
    
    // Key points
    'keypoint.dashboard.title': 'Ein einziges Multimarken-Dashboard',
    'keypoint.dashboard.desc': 'Verwalten Sie all Ihre Kaffeemaschinen über eine intuitive Benutzeroberfläche',
    'keypoint.consumption.title': 'Stromverbrauch einzelner Geräte dank IoT',
    'keypoint.consumption.desc': 'Native Konnektivität mit Maschinen der neuesten Generation',
    'keypoint.monitoring.title': 'Echtzeit-Kontrolle',
    'keypoint.monitoring.desc': 'Überwachen Sie jeden Parameter der Maschine, Moment für Moment',
    
    // Sfide section
    'sfide.title': 'Warum eine IoT-Plattform wählen?',
    'sfide.subtitle': 'Die Daten sprechen eine klare Sprache: Die Fernüberwachung von Kaffeemaschinen bringt konkrete Vorteile in Bezug auf Effizienz, Einsparungen und Servicequalität.',
    'sfide.stat1.title': 'Maschinenausfallzeiten dank IoT-Predictive-Maintenance',
    'sfide.stat1.desc': 'IoT-Lösungen reduzieren Ausfallzeiten drastisch, indem sie plötzliche Ausfälle verhindern.',
    'sfide.stat1.source': 'Quelle: Highgear.com',
    'sfide.stat2.title': 'Stromverbrauch bei einzelnen Geräten dank IoT',
    'sfide.stat2.desc': 'Durch die Überwachung von Geräten wie Kühlaggregaten und Maschinen werden Energiekosten gesenkt und die Nachhaltigkeit verbessert.',
    'sfide.stat2.source': 'Quelle: best.energy',
    'sfide.stat3.title': 'Technische Einsätze vor Ort dank Fernsteuerung',
    'sfide.stat3.desc': 'IoT ermöglicht Ferndiagnose oder Problemlösung und reduziert so technische Besuche und die damit verbundenen Kosten.',
    'sfide.stat3.source': 'Quelle: cadservices.nl',
    'sfide.stat4.title': 'der Kunden wählen ein Café wegen der Kaffeequalität',
    'sfide.stat4.desc': 'Eine schlecht kalibrierte Maschine beeinträchtigt den Geschmack. IoT gewährleistet Konsistenz und Qualität bei jeder Tasse.',
    'sfide.stat4.source': 'Quelle: caffebenessere.it',
    
    // UnisolSolution
    'unisol.title': 'Alle Daten, eine Lösung',
    'unisol.subtitle': 'Die qonneq-Plattform zentralisiert die Überwachung all Ihrer Geräte für eine vollständige Kontrolle ohne Komplikationen.',
    'unisol.feature1.title': 'Multimarke, eine einzige Plattform',
    'unisol.feature1.desc': 'Qonneq aggregiert Daten von verschiedenen Maschinen und Zubehör ohne mehrere Anwendungen zu benötigen und bietet eine zentralisierte und vereinfachte Verwaltung.',
    'unisol.feature2.title': 'Echtzeit-Überwachung',
    'unisol.feature2.desc': 'Überprüfen und kontrollieren Sie alle Maschinenparameter in Echtzeit.',
    'unisol.feature3.title': 'Keine zusätzliche Hardware',
    'unisol.feature3.desc': 'Keine physischen Installationen an Maschinen erforderlich: qonneq nutzt Geräte der neuesten Generation mit nativer Konnektivität.',
    'unisol.feature4.title': 'Vorausschauende Wartung',
    'unisol.feature4.desc': 'Verhindern Sie Ausfälle und reduzieren Sie Maschinenausfallzeiten durch rechtzeitige Eingriffe.',

    // Vantaggi (Dati sotto controllo)
    'vantaggi.title': 'Alle Daten unter Kontrolle',
    'vantaggi.subtitle': 'qonneq sammelt und analysiert Schlüsselparameter für vollständige Kontrolle',
    'vantaggi.tab1': 'Nutzung und Verbrauch',
    'vantaggi.tab1.item1': 'Anzahl der getätigten Ausgaben',
    'vantaggi.tab1.item2': 'Arten der zubereiteten Getränke',
    'vantaggi.tab1.item3': 'Gesamtverbrauch von Wasser und Kaffee',
    'vantaggi.tab2': 'Maschinenstatus',
    'vantaggi.tab2.item1': 'Ausgabedruck und -temperatur',
    'vantaggi.tab2.item2': 'Komponentenverschleißniveau',
    'vantaggi.tab2.item3': 'Anomalie- oder Ausfallmeldungen',
    'vantaggi.tab3': 'Wartung und Leistung',
    'vantaggi.tab3.item1': 'Filterstatus und Austauschbedarf',
    'vantaggi.tab3.item2': 'Ausfallserkennung und Maschinenstillstand',
    'vantaggi.tab3.item3': 'Überwachung der Energieleistung',
    'vantaggi.tab4': 'Kaffeequalität',
    'vantaggi.tab4.item1': 'Dosierungskalibrierung und Mahlkontrolle',
    'vantaggi.tab4.item2': 'Konformität mit optimalen Parametern',
    'vantaggi.tab4.item3': 'Variationen in Verbrauchsmustern',
    'vantaggi.integration': 'Integration mit Zahlungssystemen',
    'vantaggi.integration.desc': 'qonneq kann Daten von in Maschinen integrierten Zahlungssystemen erfassen, einschließlich Kartenlesern und kontaktlosen Systemen.',
    
    // Integrazioni
    'integrazioni.title': 'Maximale Integrationsfreiheit',
    'integrazioni.subtitle': 'Wählen Sie die Lösung, die am besten zu Ihren Bedürfnissen passt',
    'integrazioni.option1.title': 'Integration mit Ihrem ERP',
    'integrazioni.option1.point1': 'Wenn Sie bereits ein Managementsystem haben, funktioniert qonneq als externes Dashboard',
    'integrazioni.option1.point2': 'Datenzugriff und vollständige Kontrolle, ohne Ihr System zu ändern',
    'integrazioni.option1.point3': 'Intuitive Schnittstelle zur Echtzeitüberwachung jeder Maschine',
    'integrazioni.option2.title': 'Integration mit Todo',
    'integrazioni.option2.point1': 'qonneq wird zu einem integrierten Modul in Todo, unserem ERP für Kaffeeröster',
    'integrazioni.option2.point2': 'Alles in einer Umgebung, direkt aus dem Managementsystem',
    'integrazioni.option2.point3': 'Maximale Effizienz: keine externe Lösungen erforderlich',
    
    // Chi Siamo
    'chisiamo.title': 'Wer wir sind',
    'chisiamo.description': 'qonneq entstand aus einem Team von Kaffeebranchenexperten mit dem Ziel, das Management von Kaffeemaschinen durch innovative IoT-Lösungen zu revolutionieren, um Unternehmen aller Branchen und Größen zu digitalisieren.',
    'chisiamo.feature1.title': '+50 Kunden',
    'chisiamo.feature1.desc': 'Wir arbeiten mit über 50 Kaffeeröstern zusammen und bieten maßgeschneiderte Lösungen von hoher Qualität. Unser Ziel ist es, unsere Kunden bei der Optimierung ihrer Produktionsprozesse zu unterstützen.',
    'chisiamo.feature2.title': 'Mailand/Rom',
    'chisiamo.feature2.desc': 'Zusätzlich zu unserer historischen Präsenz in Mailand haben wir ein neues Büro in Rom eröffnet. Dies ermöglicht es uns, schnell auf Marktbedürfnisse zu reagieren und direkten Support zu bieten.',
    'chisiamo.feature3.title': '+25 Jahre',
    'chisiamo.feature3.desc': 'Seit über einem Vierteljahrhundert arbeiten wir Seite an Seite mit Kaffeeröstern und entwickeln tiefes Wissen und Expertise im Kaffeesektor. Unsere Erfahrung ermöglicht es uns, innovative Lösungen von überragender Qualität anzubieten.',
    
    // BusinessPlatform
    'business.title': 'Mehrwertdienste',
    'business.subtitle': 'Eine umfassende Unterstützung zur Begleitung bei der Digitalisierung',
    'business.feature1.title': 'IT-Beratung und Unterstützung',
    'business.feature1.desc': 'Dediziertes Servicecenter. Helpdesk zur Unterstützung der Kunden',
    'business.feature2.title': 'Industrial IoT und Web-Technologien',
    'business.feature2.desc': 'Team für die Erforschung neuer Technologien und die Entwicklung von Unternehmens-Apps',
    'business.feature3.title': 'Maßgeschneiderte ERP-Beratung',
    'business.feature3.desc': 'Team von Beratern für spezifische Beratung im Bereich ERP und digitale Kaffeeröstung',
    
    // CTA
    'cta.title': 'Bereit, das Management Ihrer Kaffeemaschinen zu vereinfachen?',
    'cta.subtitle': 'Entdecken Sie, wie qonneq die Überwachung und Wartung Ihrer Geräte revolutionieren kann.',
    'cta.success.title': 'Vielen Dank für Ihre Nachricht!',
    'cta.success.message': 'Wir werden Sie in Kürze kontaktieren.',
    'cta.form.name': 'Vollständiger Name',
    'cta.form.name.placeholder': 'Geben Sie Ihren vollständigen Namen ein',
    'cta.form.company': 'Unternehmen',
    'cta.form.company.placeholder': 'Name Ihres Unternehmens',
    'cta.form.email': 'E-Mail',
    'cta.form.email.placeholder': 'Ihre E-Mail',
    'cta.form.phone': 'Telefon',
    'cta.form.phone.placeholder': 'Telefonnummer',
    'cta.form.message': 'Nachricht',
    'cta.form.message.placeholder': 'Schreiben Sie Ihre Nachricht hier...',
    'cta.form.privacy': 'Durch das Absenden dieses Formulars erkläre ich, dass ich die Datenschutzrichtlinie gelesen habe und den Eigentümer autorisiere, mir gemäß der Datenschutzrichtlinie zu antworten.',
    'cta.form.submit': 'Nachricht senden',
    'cta.form.sending': 'Wird gesendet...',
    
    // Form validation messages
    'validation.name': 'Name muss mindestens 2 Zeichen lang sein',
    'validation.company': 'Unternehmen muss mindestens 2 Zeichen lang sein',
    'validation.email': 'Ungültige E-Mail',
    'validation.phone': 'Geben Sie eine gültige Telefonnummer ein',
    'validation.message': 'Nachricht muss mindestens 10 Zeichen lang sein',
    
    // Success/error messages
    'message.success': 'Nachricht erfolgreich gesendet!',
    'message.error': 'Fehler beim Senden der Nachricht. Bitte versuchen Sie es später erneut.',
    
    // Footer
    'footer.company': 'qonneq by Encodata S.r.l.',
    'footer.address': 'Strada 4 - Palazzo Q7 - Centro Direzionale MilanoFiori - 20057 Assago (MI) - USt-IdNr.: 13419330157',
    'footer.copyright': '© {year} qonneq. Alle Rechte vorbehalten.',
    'footer.privacy': 'Datenschutz',
    'footer.cookies': 'Cookies',

    // Dashboard Page
    'dashboard.title': 'Kontrollzentrum',
    'dashboard.subtitle': 'Überwachen Sie alle Ihre Kaffeemaschinen über eine einzige Schnittstelle',
    'dashboard.description': 'Zugriff auf Statistiken und Metriken in Echtzeit'
  }
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('it');

  const t = (key: string): string => {
    // Correzione della funzione t per gestire meglio le chiavi mancanti
    if (!key) return '';
    
    const currentTranslations = translations[language];
    if (!currentTranslations) return key;
    
    const translation = currentTranslations[key as keyof typeof currentTranslations];
    return translation !== undefined ? translation : key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
