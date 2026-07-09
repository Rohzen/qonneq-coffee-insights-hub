import { useState } from "react";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import emailjs from "emailjs-com";
import { toast } from "@/components/ui/sonner";
import heroImage from "@/assets/guida-iot-hero.jpg.asset.json";
import pdfAsset from "@/assets/guida-iot-pdf.asset.json";
import {
  AlertTriangle,
  LineChart,
  Wrench,
  MessageCircle,
  TrendingUp,
  Smartphone,
  Download,
  ArrowRight,
} from "lucide-react";

const PDF_URL = pdfAsset.url;
const LEAD_SOURCE = "Lead from Guida IoT Connect";

const cards = [
  {
    icon: AlertTriangle,
    title: "Il problema del comodato",
    text: "Perché il cherry picking è più frequente di quanto pensi, e come riconoscerlo prima che ti costi mesi di margine.",
  },
  {
    icon: LineChart,
    title: "I 5 dati da controllare ogni settimana",
    text: "Erogazioni, pattern di calo, cicli di pulizia, temperatura, ore di funzionamento: cosa guardare e con quali soglie di allerta.",
  },
  {
    icon: Wrench,
    title: "Manutenzione predittiva",
    text: "La differenza tra un intervento pianificato e un guasto d'emergenza da 200-300 euro, e come prevenire l'80% dei problemi.",
  },
  {
    icon: MessageCircle,
    title: "La conversazione che cambia",
    text: "Come passare da \"mi sembra che ordini meno\" a una conversazione basata su dati concreti con i tuoi clienti.",
  },
  {
    icon: TrendingUp,
    title: "Recupero del margine",
    text: "Quanto puoi recuperare smettendo di regalare margine ai clienti che comprano altrove con la tua attrezzatura.",
  },
  {
    icon: Smartphone,
    title: "I dati in tempo reale",
    text: "Come vedere tutte le tue macchine, i consumi e gli alert direttamente da telefono o computer, senza andare fisicamente sul posto.",
  },
];

const GuidaIot = () => {
  const [form, setForm] = useState({ nome: "", email: "", azienda: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await emailjs.send(
        "service_5jqldhy",
        "template_n8xowrg",
        {
          to_email: "matteo.zoia@encodata.com",
          from_name: form.nome,
          from_email: form.email,
          company: form.azienda,
          phone: form.phone || "Non fornito",
          message: `${LEAD_SOURCE}\n\nNome e Cognome: ${form.nome}\nEmail: ${form.email}\nAzienda: ${form.azienda}\nTelefono (ricontatto): ${form.phone || "Non fornito"}`,
          lead_source: LEAD_SOURCE,
        },
        "QTwBeGH89PjccHI5t"
      );

      if (result.text === "OK") {
        toast.success("Grazie! Ti stiamo aprendo la guida.");
        window.open(PDF_URL, "_blank", "noopener,noreferrer");
        setForm({ nome: "", email: "", azienda: "", phone: "" });
      } else {
        throw new Error("Invio email fallito");
      }
    } catch (err) {
      console.error("Errore invio form guida:", err);
      toast.error("Si è verificato un errore. Riprova.");
    } finally {
      setSubmitting(false);
    }
  };

  const scrollToForm = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById("guida")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* SEZIONE 1 — Hero */}
      <section className="bg-gradient-to-br from-qonneq-dark via-qonneq to-qonneq-blu text-white pt-20 pb-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Immagine a sinistra */}
            <div className="order-2 lg:order-1 flex justify-center">
              <div className="w-full max-w-sm rounded-2xl overflow-hidden bg-white/10 backdrop-blur-sm border border-white/20 shadow-2xl flex items-center justify-center p-4">
                <img
                  src={heroImage.url}
                  alt="Guida IoT per macchine da caffè"
                  className="w-full h-auto object-contain"
                />
              </div>
            </div>

            {/* Contenuto a destra */}
            <div className="order-1 lg:order-2 space-y-6">
              <span className="inline-block px-4 py-1.5 rounded-full bg-qonneq-accent/20 border border-qonneq-accent/40 text-qonneq-azzurro text-sm font-semibold tracking-wider uppercase">
                Guida Pratica 2026
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Le tue macchine parlano. Tu le stai ascoltando?
              </h1>
              <p className="text-lg md:text-xl text-gray-200 leading-relaxed">
                Comodato, cherry picking, manutenzione, guasti. Tutto quello che
                succede alle tue macchine mentre non le guardi — e come smettere
                di scoprirlo sempre troppo tardi.
              </p>
              <div className="pt-4">
                <Button
                  onClick={scrollToForm}
                  className="bg-white text-qonneq-accent hover:bg-gray-100 text-lg py-6 px-8 shadow-lg"
                >
                  Scarica la guida gratuita
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEZIONE 2 — Cosa trovi dentro */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-qonneq-dark mb-4">
              Cosa trovi dentro
            </h2>
            <p className="text-lg text-gray-600">
              Una guida pratica pensata per chi gestisce macchine da caffè in
              comodato presso bar e locali HoReCa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {cards.map((card, i) => {
              const Icon = card.icon;
              return (
                <div
                  key={i}
                  className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-qonneq-accent/40 transition-all duration-300"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-qonneq-accent/10 mb-5">
                    <Icon className="w-6 h-6 text-qonneq-accent" />
                  </div>
                  <h3 className="text-xl font-bold text-qonneq-dark mb-3">
                    {card.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{card.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SEZIONE 3 — Form di download */}
      <section
        id="guida"
        className="py-20 bg-gradient-to-r from-qonneq to-qonneq-dark text-white"
      >
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Scarica la guida gratuitamente
            </h2>
            <p className="text-lg text-gray-200">
              Compila il form e ricevi subito il PDF. Si apre in una nuova
              scheda: puoi leggerlo o scaricarlo immediatamente.
            </p>
          </div>

          <div className="max-w-xl mx-auto bg-white/10 backdrop-blur-sm rounded-xl p-6 md:p-8 border border-white/20 shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-white">
                  Nome
                </Label>
                <Input
                  id="nome"
                  required
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Il tuo nome"
                  className="bg-white/10 border-white/20 placeholder:text-white/50 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="nome@azienda.com"
                  className="bg-white/10 border-white/20 placeholder:text-white/50 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="azienda" className="text-white">
                  Azienda
                </Label>
                <Input
                  id="azienda"
                  required
                  value={form.azienda}
                  onChange={(e) =>
                    setForm({ ...form, azienda: e.target.value })
                  }
                  placeholder="Nome della tua azienda"
                  className="bg-white/10 border-white/20 placeholder:text-white/50 text-white"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-qonneq-accent hover:bg-qonneq-purple py-6 text-lg font-medium"
              >
                <Download className="mr-2 h-5 w-5" />
                Scarica la guida
              </Button>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default GuidaIot;
