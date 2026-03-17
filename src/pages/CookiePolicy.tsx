
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ScrollToTop } from "@/components/ScrollToTop";

const CookiePolicy = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="container mx-auto px-4 py-24">
        <h1 className="text-3xl font-bold mb-8">Cookie Policy</h1>
        
        <div className="prose max-w-none">
          <p className="mb-4">Ultimo aggiornamento: {new Date().toLocaleDateString('it-IT')}</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Cosa sono i cookie?</h2>
          <p className="mb-4">
            I cookie sono piccoli file di testo che i siti web inseriscono sul vostro dispositivo durante la navigazione. 
            Sono ampiamente utilizzati per far funzionare i siti web o per farli funzionare in modo più efficiente, 
            nonché per fornire informazioni ai proprietari del sito.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Come utilizziamo i cookie</h2>
          <p className="mb-4">Utilizziamo diversi tipi di cookie per le seguenti finalità:</p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Cookie tecnici (necessari)</h3>
          <p className="mb-4">
            Questi cookie sono essenziali per il corretto funzionamento del nostro sito web. Vi permettono di navigare 
            e utilizzare le funzioni essenziali, come accedere ad aree sicure del sito. Senza questi cookie, non possiamo 
            offrire determinati servizi richiesti.
          </p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Cookie analitici/di prestazione</h3>
          <p className="mb-4">
            Ci aiutano a capire come i visitatori interagiscono con il nostro sito web, raccogliendo e riferendo informazioni 
            in forma anonima. Ci permettono di migliorare costantemente il nostro sito web.
          </p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Cookie di funzionalità</h3>
          <p className="mb-4">
            Permettono al sito web di ricordare le scelte che fate (come il vostro nome utente, la lingua o la regione in 
            cui vi trovate) e forniscono funzionalità migliorate e personalizzate.
          </p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Cookie di targeting/pubblicitari</h3>
          <p className="mb-4">
            Questi cookie registrano la vostra visita al nostro sito web, le pagine visitate e i link seguiti. 
            Utilizzeremo queste informazioni per rendere il nostro sito web e la pubblicità visualizzata più pertinenti 
            ai vostri interessi. Possiamo anche condividere queste informazioni con terze parti a questo scopo.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Controllo dei cookie</h2>
          <p className="mb-4">
            Potete decidere se accettare o rifiutare i cookie. Potete esercitare i vostri diritti sui cookie attraverso 
            il banner che appare quando accedete per la prima volta al nostro sito web o attraverso le impostazioni del 
            vostro browser.
          </p>
          <p className="mb-4">
            La maggior parte dei browser web permette un certo controllo sulla maggior parte dei cookie attraverso le 
            impostazioni del browser. Per saperne di più sui cookie, incluso come vedere quali cookie sono stati impostati e 
            come gestirli ed eliminarli, visitate www.allaboutcookies.org.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Cookie di terze parti</h2>
          <p className="mb-4">
            Il nostro sito web può utilizzare servizi di terze parti, come Google Analytics, che possono utilizzare i propri 
            cookie. Non abbiamo il controllo sulla distribuzione di questi cookie. Per ulteriori informazioni, consultate 
            le politiche sulla privacy di questi servizi.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Durata dei cookie</h2>
          <p className="mb-4">
            I cookie di sessione vengono eliminati quando chiudete il browser, mentre i cookie persistenti rimangono sul 
            vostro dispositivo per un periodo più lungo o finché non li eliminate manualmente.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Aggiornamenti alla Cookie Policy</h2>
          <p className="mb-4">
            Possiamo aggiornare questa Cookie Policy di tanto in tanto. Vi incoraggiamo a rivedere periodicamente questa 
            pagina per rimanere informati su come utilizziamo i cookie.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Contatti</h2>
          <p className="mb-4">
            Se avete domande sulla nostra Cookie Policy, contattateci a:<br />
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

export default CookiePolicy;
