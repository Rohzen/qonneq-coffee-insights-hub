
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Shield, ShieldX, Cookie } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Link } from "react-router-dom";

export const CookieBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  
  const [preferences, setPreferences] = useState({
    necessary: true, // Always true and disabled
    analytics: false,
    functional: false,
    targeting: false
  });

  useEffect(() => {
    // Check if user has already made a choice
    const cookieConsent = localStorage.getItem("cookie-consent");
    if (!cookieConsent) {
      // Show banner if no choice has been made
      setShowBanner(true);
    } else {
      // Load saved preferences
      try {
        const savedPreferences = JSON.parse(cookieConsent);
        setPreferences(prev => ({ ...prev, ...savedPreferences }));
      } catch (e) {
        console.error("Error parsing cookie preferences", e);
      }
    }
  }, []);

  const acceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      functional: true,
      targeting: true
    };
    
    setPreferences(allAccepted);
    localStorage.setItem("cookie-consent", JSON.stringify(allAccepted));
    setShowBanner(false);
  };

  const rejectAll = () => {
    const allRejected = {
      necessary: true, // Necessary cookies are always accepted
      analytics: false,
      functional: false,
      targeting: false
    };
    
    setPreferences(allRejected);
    localStorage.setItem("cookie-consent", JSON.stringify(allRejected));
    setShowBanner(false);
  };

  const savePreferences = () => {
    localStorage.setItem("cookie-consent", JSON.stringify(preferences));
    setShowBanner(false);
    setShowPreferences(false);
  };

  const handlePreferenceChange = (key: keyof typeof preferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (!showBanner) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg z-50 border-t border-gray-200">
        <div className="container mx-auto p-4 md:p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Cookie className="h-6 w-6 text-qonneq-accent flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg">Utilizziamo i cookie</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Utilizziamo i cookie per migliorare la tua esperienza sul nostro sito. Puoi personalizzare le tue preferenze o accettare tutti i cookie.
                  <Link to="/cookie-policy" className="text-qonneq-accent hover:underline ml-1">
                    Scopri di più
                  </Link>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 ml-9 md:ml-0">
              <Button 
                variant="outline" 
                onClick={() => setShowPreferences(true)}
              >
                Personalizza
              </Button>
              <Button 
                variant="outline" 
                onClick={rejectAll}
                className="flex items-center gap-2"
              >
                <ShieldX className="w-4 h-4" />
                Rifiuta tutti
              </Button>
              <Button 
                onClick={acceptAll}
                className="bg-qonneq-accent hover:bg-qonneq-accent/90 text-white flex items-center gap-2"
              >
                <Shield className="w-4 h-4" />
                Accetta tutti
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Preferenze Cookie</DialogTitle>
            <DialogDescription>
              Personalizza le tue preferenze sui cookie. I cookie necessari non possono essere disattivati in quanto essenziali per il funzionamento del sito.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Cookie necessari</h4>
                <p className="text-sm text-gray-500">Essenziali per il funzionamento del sito</p>
              </div>
              <input 
                type="checkbox" 
                checked={preferences.necessary} 
                disabled={true}
                className="h-4 w-4 accent-qonneq-accent"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Cookie analitici</h4>
                <p className="text-sm text-gray-500">Ci aiutano a capire come utilizzi il sito</p>
              </div>
              <input 
                type="checkbox" 
                checked={preferences.analytics} 
                onChange={() => handlePreferenceChange("analytics")}
                className="h-4 w-4 accent-qonneq-accent"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Cookie funzionali</h4>
                <p className="text-sm text-gray-500">Per funzionalità personalizzate</p>
              </div>
              <input 
                type="checkbox" 
                checked={preferences.functional} 
                onChange={() => handlePreferenceChange("functional")}
                className="h-4 w-4 accent-qonneq-accent"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Cookie di targeting</h4>
                <p className="text-sm text-gray-500">Per pubblicità personalizzata</p>
              </div>
              <input 
                type="checkbox" 
                checked={preferences.targeting} 
                onChange={() => handlePreferenceChange("targeting")}
                className="h-4 w-4 accent-qonneq-accent"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowPreferences(false)}>
              Annulla
            </Button>
            <Button 
              onClick={savePreferences}
              className="bg-qonneq-accent hover:bg-qonneq-accent/90 text-white"
            >
              Salva preferenze
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
