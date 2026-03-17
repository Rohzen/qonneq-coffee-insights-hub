
import { useLanguage } from "@/context/LanguageContext";

export const Integrazioni = () => {
  const { t } = useLanguage();
  
  const integrationOptions = [
    {
      id: 1,
      title: t('integrazioni.option1.title'),
      image: "/lovable-uploads/4dc9d9f9-427c-43c5-8192-25b5e981b9b3.png",
      points: [
        t('integrazioni.option1.point1'),
        t('integrazioni.option1.point2'),
        t('integrazioni.option1.point3')
      ]
    },
    {
      id: 2,
      title: t('integrazioni.option2.title'),
      image: "/lovable-uploads/3e174691-13e4-45f0-adc3-fa637448e22c.png",
      points: [
        t('integrazioni.option2.point1'),
        t('integrazioni.option2.point2'),
        t('integrazioni.option2.point3')
      ]
    }
  ];

  return (
    <section id="integrazioni" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-qonneq mb-4">{t('integrazioni.title')}</h2>
          <p className="text-lg text-gray-600">
            {t('integrazioni.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {integrationOptions.map((option) => (
            <div key={option.id} className="flex flex-col items-center">
              <div className="relative mb-8">
                <div className="absolute -left-4 -top-4 w-10 h-10 rounded-full bg-qonneq flex items-center justify-center text-white font-bold text-xl">
                  {option.id}.
                </div>
                <div className="bg-gradient-to-br from-qonneq-light to-qonneq p-1 rounded-xl shadow-xl">
                  <div className="bg-white p-4 rounded-lg flex items-center justify-center h-64">
                    <img 
                      src={option.image} 
                      alt={option.title} 
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-qonneq mb-4">
                {option.title}
              </h3>
              
              <ul className="space-y-4">
                {option.points.map((point, index) => (
                  <li key={index} className="flex items-start">
                    <div className="mt-1 mr-3 p-1 bg-qonneq-accent/10 rounded-full">
                      <div className="w-4 h-4 bg-qonneq-accent rounded-full"></div>
                    </div>
                    <p className="text-gray-700">{point}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
