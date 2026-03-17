
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useLanguage } from "@/context/LanguageContext";
import { LogIn } from "lucide-react";

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const isMobile = useIsMobile();
  const { t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [scrolled]);

  const scrollToForm = (e: React.MouseEvent) => {
    e.preventDefault();
    const formSection = document.getElementById('contattaci');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white py-2 shadow-md" : "bg-white py-4"
      }`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <a href="/" className="flex items-center">
          <img 
            src="/lovable-uploads/898be41c-5d3b-4c22-bd82-7a29cb864aea.png" 
            alt="qonneq" 
            className="h-10" 
          />
        </a>
        <div className="flex items-center space-x-4">
          <LanguageSwitcher />
          <Link to="/login">
            <Button
              variant="outline"
              className="border-qonneq-accent text-qonneq-accent hover:bg-qonneq-accent hover:text-white transition-all"
            >
              <LogIn className="h-4 w-4 mr-2" />
              {isMobile ? "" : "Login"}
            </Button>
          </Link>
          {!isMobile && (
            <Button
              className="bg-qonneq-accent hover:bg-qonneq-purple text-white shadow-lg transition-all"
              onClick={scrollToForm}
            >
              {t('demo.request')}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
