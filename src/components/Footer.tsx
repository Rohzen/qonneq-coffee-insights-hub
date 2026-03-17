
import { useLanguage } from "@/context/LanguageContext";

export const Footer = ({ minimal = false }: { minimal?: boolean }) => {
  const { t } = useLanguage();
  
  return (
    <footer id="contatti" className="bg-qonneq-dark text-white pt-16 pb-8">
      <div className="container mx-auto px-4">
        {!minimal && (
          <div className="flex flex-col md:flex-row justify-between items-start mb-12">
            {/* Logo on the left */}
            <div>
              <img 
                src="/lovable-uploads/febd1485-4559-4067-b510-e4cc83f4334a.png" 
                alt="qonneq" 
                className="h-10" 
              />
            </div>
            
            {/* Company info on the right */}
            <div className="mt-6 md:mt-0">
              <p className="text-gray-400">
                {t('footer.company')}<br />
                {t('footer.address')}
              </p>
            </div>
          </div>
        )}
        
        {!minimal && (
          <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              {t('footer.copyright').replace('{year}', new Date().getFullYear().toString())}
            </p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a href="/privacy-policy" className="text-gray-400 hover:text-white transition-colors">{t('footer.privacy')}</a>
              <a href="/cookie-policy" className="text-gray-400 hover:text-white transition-colors">{t('footer.cookies')}</a>
            </div>
          </div>
        )}
      </div>
    </footer>
  );
};
