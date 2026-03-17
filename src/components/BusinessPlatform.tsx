
import { Database, Computer, Briefcase } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface FeatureBlockProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

const FeatureBlock = ({
  icon: Icon,
  title,
  description
}: FeatureBlockProps) => {
  return (
    <div className="flex flex-col items-start p-6 bg-white rounded-lg shadow-md border border-gray-100">
      <div className="rounded-full bg-[#5820e3]/10 p-3 mb-4">
        <Icon className="w-6 h-6 text-qonneq-viola" />
      </div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

export const BusinessPlatform = () => {
  const { t } = useLanguage();
  
  const features = [
    {
      icon: Database,
      title: t('business.feature1.title'),
      description: t('business.feature1.desc')
    }, 
    {
      icon: Computer,
      title: t('business.feature2.title'),
      description: t('business.feature2.desc')
    }, 
    {
      icon: Briefcase,
      title: t('business.feature3.title'),
      description: t('business.feature3.desc')
    }
  ];
  
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('business.title')}</h2>
          <p className="text-lg text-gray-700">{t('business.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureBlock 
              key={index} 
              icon={feature.icon} 
              title={feature.title} 
              description={feature.description} 
            />
          ))}
        </div>
      </div>
    </section>
  );
};
