
import { Users, MapPin, Clock } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useLanguage } from "@/context/LanguageContext";

export const ChiSiamo = () => {
  const { t } = useLanguage();
  
  const features = [
    {
      title: t('chisiamo.feature1.title'),
      icon: Users,
      description: t('chisiamo.feature1.desc')
    }, 
    {
      title: t('chisiamo.feature2.title'),
      icon: MapPin,
      description: t('chisiamo.feature2.desc')
    }, 
    {
      title: t('chisiamo.feature3.title'),
      icon: Clock,
      description: t('chisiamo.feature3.desc')
    }
  ];
  
  return (
    <section id="chi-siamo" className="py-20 bg-qonneq-dark">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-2 text-white">{t('chisiamo.title')}</h2>
          
          <div className="flex justify-center my-8">
            <div className="w-64 h-16">
              <AspectRatio ratio={3 / 1}>
                <img src="/lovable-uploads/0d2bdf31-de5f-4426-a0f8-96bed3585949.png" alt="Encodata Logo" className="w-full h-full object-contain" />
              </AspectRatio>
            </div>
          </div>
          
          <p className="text-gray-300 max-w-3xl mx-auto text-lg">{t('chisiamo.description')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-qonneq/10 backdrop-blur-sm border border-qonneq-azzurro/20 rounded-lg p-8 text-center">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-qonneq-azzurro to-qonneq-viola flex items-center justify-center">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-qonneq-azzurro mb-4">{feature.title}</h3>
              <p className="text-gray-300">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
