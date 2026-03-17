
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ScrollToTop } from "@/components/ScrollToTop";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="container mx-auto px-4 py-24">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
        
        <div className="prose max-w-none">
          <p className="mb-4">Ultimo aggiornamento: {new Date().toLocaleDateString('it-IT')}</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduzione</h2>
          <p className="mb-4">
            Benvenuti nella Privacy Policy di qonneq. Questa policy descrive come Encodata S.r.l. ("noi", "nostro" o "Società") 
            raccoglie, utilizza, condivide e protegge le informazioni personali degli utenti quando utilizzano il nostro sito web 
            e i nostri servizi.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Titolare del Trattamento</h2>
          <p className="mb-4">
            Il titolare del trattamento dei dati personali è:<br />
            Encodata S.r.l.<br />
            Via Enrico Fermi, 20<br />
            20057 Assago (MI)<br />
            Email: info@encodata.com<br />
            P.IVA: 13419330157
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Dati Raccolti</h2>
          <p className="mb-4">Raccogliamo i seguenti tipi di informazioni:</p>
          <ul className="list-disc pl-6 mb-6">
            <li>Dati forniti volontariamente: nome, cognome, email, numero di telefono e azienda quando compilate i moduli di contatto.</li>
            <li>Dati di utilizzo: informazioni su come interagite con il nostro sito web, inclusi gli indirizzi IP, il browser utilizzato, le pagine visitate e il tempo trascorso sul sito.</li>
            <li>Cookie e tecnologie simili: utilizziamo cookie per migliorare l'esperienza dell'utente. Per maggiori informazioni, consultate la nostra Cookie Policy.</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Finalità del Trattamento</h2>
          <p className="mb-4">Utilizziamo i dati raccolti per:</p>
          <ul className="list-disc pl-6 mb-6">
            <li>Fornire i nostri servizi e rispondere alle vostre richieste.</li>
            <li>Inviare comunicazioni relative ai nostri servizi, inclusi aggiornamenti e informazioni sui prodotti.</li>
            <li>Migliorare e personalizzare la vostra esperienza sul nostro sito web.</li>
            <li>Analizzare l'utilizzo del nostro sito per ottimizzarlo.</li>
            <li>Adempiere a obblighi legali e proteggere i nostri diritti.</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Base Giuridica del Trattamento</h2>
          <p className="mb-4">Il trattamento dei vostri dati personali è basato su:</p>
          <ul className="list-disc pl-6 mb-6">
            <li>Il vostro consenso (ad es. quando compilate un modulo di contatto).</li>
            <li>La necessità di eseguire un contratto di cui siete parte.</li>
            <li>Il legittimo interesse della nostra azienda a migliorare i servizi e comunicare con gli utenti.</li>
            <li>L'adempimento di obblighi legali.</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Conservazione dei Dati</h2>
          <p className="mb-4">
            Conserviamo i vostri dati personali solo per il tempo necessario a raggiungere le finalità per cui sono stati raccolti, 
            a meno che non sia richiesto o consentito dalla legge un periodo di conservazione più lungo.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Condivisione dei Dati</h2>
          <p className="mb-4">
            Non vendiamo i vostri dati personali. Possiamo condividere i vostri dati con:
          </p>
          <ul className="list-disc pl-6 mb-6">
            <li>Fornitori di servizi che ci supportano nell'erogazione dei nostri servizi (come provider di hosting o servizi email).</li>
            <li>Autorità pubbliche o enti governativi quando richiesto dalla legge.</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">8. I Vostri Diritti</h2>
          <p className="mb-4">
            In conformità con il GDPR, avete i seguenti diritti:
          </p>
          <ul className="list-disc pl-6 mb-6">
            <li>Diritto di accesso: potete richiedere una copia dei vostri dati personali.</li>
            <li>Diritto di rettifica: potete richiedere la correzione di dati inesatti.</li>
            <li>Diritto alla cancellazione: potete richiedere la cancellazione dei vostri dati.</li>
            <li>Diritto di limitazione: potete richiedere la limitazione del trattamento dei vostri dati.</li>
            <li>Diritto alla portabilità dei dati: potete richiedere il trasferimento dei vostri dati.</li>
            <li>Diritto di opposizione: potete opporvi al trattamento dei vostri dati.</li>
          </ul>
          <p className="mb-4">
            Per esercitare questi diritti, contattateci all'indirizzo info@encodata.com.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">9. Sicurezza dei Dati</h2>
          <p className="mb-4">
            Adottiamo misure di sicurezza tecniche e organizzative appropriate per proteggere i vostri dati personali da perdita, 
            accesso non autorizzato, divulgazione, alterazione o distruzione.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">10. Modifiche alla Privacy Policy</h2>
          <p className="mb-4">
            Possiamo aggiornare questa privacy policy periodicamente. In caso di modifiche sostanziali, vi informeremo 
            pubblicando un avviso sul nostro sito web prima che le modifiche diventino effettive.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">11. Contatti</h2>
          <p className="mb-4">
            Se avete domande o preoccupazioni riguardo la nostra privacy policy o le pratiche relative ai dati, 
            contattateci a:<br />
            Email: info@encodata.com<br />
            Encodata S.r.l.<br />
            Via Enrico Fermi, 20<br />
            20057 Assago (MI)
          </p>
        </div>
      </div>
      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default PrivacyPolicy;
