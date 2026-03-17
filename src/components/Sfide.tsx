
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/context/LanguageContext";

export const Sfide = () => {
  const { t } = useLanguage();

  const stats = [
    {
      percentage: "-50%",
      title: t('sfide.stat1.title'),
      description: t('sfide.stat1.desc'),
      source: t('sfide.stat1.source')
    },
    {
      percentage: "-34%",
      title: t('sfide.stat2.title'),
      description: t('sfide.stat2.desc'),
      source: t('sfide.stat2.source')
    },
    {
      percentage: "-42%",
      title: t('sfide.stat3.title'),
      description: t('sfide.stat3.desc'),
      source: t('sfide.stat3.source')
    },
    {
      percentage: "40%",
      title: t('sfide.stat4.title'),
      description: t('sfide.stat4.desc'),
      source: t('sfide.stat4.source')
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-qonneq-DEFAULT mb-4">
            {t('sfide.title')}
          </h2>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            {t('sfide.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <Card key={index} className="bg-gray-50 border border-gray-200 shadow-md">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <p className="text-5xl font-bold text-qonneq-accent">
                    {stat.percentage}
                  </p>
                  <h3 className="text-xl font-semibold text-qonneq-DEFAULT leading-tight">
                    {stat.title}
                  </h3>
                  <p className="text-gray-700">
                    {stat.description}
                  </p>
                  <p className="text-sm text-gray-500 italic">
                    {stat.source}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
