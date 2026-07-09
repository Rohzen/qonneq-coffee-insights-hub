
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useLanguage } from "@/context/LanguageContext";
import { LogIn, Menu } from "lucide-react";

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const { t } = useLanguage();
  const location = useLocation();

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

  const navItems = [
    { label: t('nav.home'), href: '/', isHash: false },
    { label: t('nav.solutions'), href: '#soluzioni', isHash: true },
    { label: t('nav.benefits'), href: '#vantaggi', isHash: true },
    { label: t('nav.integrations'), href: '#integrazioni', isHash: true },
    { label: t('nav.about'), href: '#chi-siamo', isHash: true },
    { label: t('nav.guide'), href: '/guida-iot', isHash: false },
    { label: t('nav.contact'), href: '#contattaci', isHash: true },
  ];

  const scrollToForm = (e: React.MouseEvent) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (location.pathname !== '/') {
      window.location.href = '/#contattaci';
      return;
    }
    const formSection = document.getElementById('contattaci');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleNavClick = (e: React.MouseEvent, href: string, isHash: boolean) => {
    setMobileMenuOpen(false);
    if (!isHash) return;
    e.preventDefault();
    if (location.pathname !== '/') {
      window.location.href = `/${href}`;
      return;
    }
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const renderNavItem = (item: typeof navItems[0], mobile = false) => {
    const baseClasses = mobile
      ? "text-lg font-medium text-gray-700 hover:text-qonneq-accent transition-colors py-2"
      : "text-sm font-medium text-gray-700 hover:text-qonneq-accent transition-colors";

    if (item.isHash) {
      return (
        <a
          key={item.href}
          href={item.href}
          onClick={(e) => handleNavClick(e, item.href, item.isHash)}
          className={baseClasses}
        >
          {item.label}
        </a>
      );
    }

    return (
      <Link
        key={item.href}
        to={item.href}
        onClick={() => {
          setMobileMenuOpen(false);
          if (location.pathname === item.href) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        className={baseClasses}
      >
        {item.label}
      </Link>
    );
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white py-2 shadow-md" : "bg-white py-4"
      }`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img 
            src="/lovable-uploads/898be41c-5d3b-4c22-bd82-7a29cb864aea.png" 
            alt="qonneq" 
            className="h-10" 
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex flex-1 items-center justify-center space-x-6 lg:space-x-8">
          {navItems.map((item) => renderNavItem(item))}
        </nav>

        <div className="flex items-center space-x-2 md:space-x-4">
          <LanguageSwitcher />
          
          {!isMobile && (
            <Link to="/login">
              <Button
                variant="outline"
                className="border-qonneq-accent text-qonneq-accent hover:bg-qonneq-accent hover:text-white transition-all"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Login
              </Button>
            </Link>
          )}
          
          {!isMobile && (
            <Button
              className="bg-qonneq-accent hover:bg-qonneq-purple text-white shadow-lg transition-all"
              onClick={scrollToForm}
            >
              {t('demo.request')}
            </Button>
          )}

          {/* Mobile menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6 text-gray-700" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] pt-12">
              <div className="flex flex-col space-y-2">
                {navItems.map((item) => renderNavItem(item, true))}
                <hr className="my-4 border-gray-200" />
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-lg font-medium text-gray-700 hover:text-qonneq-accent transition-colors py-2"
                >
                  Login
                </Link>
                <Button
                  className="bg-qonneq-accent hover:bg-qonneq-purple text-white shadow-lg transition-all mt-2"
                  onClick={scrollToForm}
                >
                  {t('demo.request')}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
