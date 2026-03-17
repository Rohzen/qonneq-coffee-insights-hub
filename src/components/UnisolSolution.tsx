
import { Database, WifiIcon, Clock, MonitorIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/context/LanguageContext";

const FeatureItem = ({
  title,
  description,
  isLeft,
  icon: Icon
}: {
  title: string;
  description: string;
  isLeft: boolean;
  icon: React.ElementType;
}) => {
  return (
    <div className={`mb-8 ${isLeft ? 'text-right pr-8' : 'text-left pl-8'}`}>
      <div className={`flex items-center mb-3 ${isLeft ? 'justify-end' : 'justify-start'}`}>
        <div className="rounded-full bg-[#5820e3]/10 p-2 w-12 h-12 flex items-center justify-center">
          <Icon className="w-6 h-6 text-[#4067ea]" />
        </div>
      </div>
      <h3 className="text-xl font-bold mb-2 text-black">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

export const UnisolSolution = () => {
  const isMobile = useIsMobile();
  const { t } = useLanguage();
  
  const leftFeatures = [
    {
      icon: Database,
      title: t('unisol.feature1.title'),
      description: t('unisol.feature1.desc')
    }, 
    {
      icon: Clock,
      title: t('unisol.feature2.title'),
      description: t('unisol.feature2.desc')
    }
  ];
  
  const rightFeatures = [
    {
      icon: WifiIcon,
      title: t('unisol.feature3.title'),
      description: t('unisol.feature3.desc')
    }, 
    {
      icon: MonitorIcon,
      title: t('unisol.feature4.title'),
      description: t('unisol.feature4.desc')
    }
  ];
  
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('unisol.title')}
          </h2>
          <p className="text-lg text-gray-700">{t('unisol.subtitle')}</p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center">
          {/* Left features */}
          <div className="md:w-1/4 space-y-8">
            {leftFeatures.map((feature, index) => 
              <FeatureItem 
                key={index} 
                title={feature.title} 
                description={feature.description} 
                icon={feature.icon} 
                isLeft={true} 
              />
            )}
          </div>

          {/* Central image - adjusted size to be smaller on mobile */}
          <div className="md:w-2/4 p-6 flex justify-center">
            <img 
              src="/lovable-uploads/df1bfa35-44c9-430d-85e7-31e66e836ad8.png" 
              alt="Qonneq Platform Hub" 
              className={`w-auto ${isMobile ? 'h-auto max-w-[250px]' : 'h-auto max-w-lg'}`} 
            />
          </div>

          {/* Right features */}
          <div className="md:w-1/4 space-y-8">
            {rightFeatures.map((feature, index) => 
              <FeatureItem 
                key={index} 
                title={feature.title} 
                description={feature.description} 
                icon={feature.icon} 
                isLeft={false} 
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
