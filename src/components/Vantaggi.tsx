
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/context/LanguageContext";

export const Vantaggi = () => {
  const isMobile = useIsMobile();
  const { t } = useLanguage();
  
  const datiCategories = [
    {
      id: "utilizzi",
      label: t('vantaggi.tab1'),
      items: [
        t('vantaggi.tab1.item1'),
        t('vantaggi.tab1.item2'),
        t('vantaggi.tab1.item3')
      ],
      color: "from-blue-400 to-blue-600"
    }, 
    {
      id: "stato",
      label: t('vantaggi.tab2'),
      items: [
        t('vantaggi.tab2.item1'),
        t('vantaggi.tab2.item2'),
        t('vantaggi.tab2.item3')
      ],
      color: "from-purple-400 to-purple-600"
    }, 
    {
      id: "manutenzione",
      label: t('vantaggi.tab3'),
      items: [
        t('vantaggi.tab3.item1'),
        t('vantaggi.tab3.item2'),
        t('vantaggi.tab3.item3')
      ],
      color: "from-indigo-400 to-indigo-600"
    }, 
    {
      id: "qualita",
      label: t('vantaggi.tab4'),
      items: [
        t('vantaggi.tab4.item1'),
        t('vantaggi.tab4.item2'),
        t('vantaggi.tab4.item3')
      ],
      color: "from-sky-400 to-sky-600"
    }
  ];
  
  return (
    <section id="vantaggi" className="py-20 bg-qonneq relative">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMjIiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptNi02aDZ2LTZoLTZ2NnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-10"></div>
      <div className="container mx-auto px-4 relative">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t('vantaggi.title')}</h2>
          <p className="text-lg text-gray-300">{t('vantaggi.subtitle')}</p>
        </div>
        
        <Tabs defaultValue="utilizzi" className="max-w-4xl mx-auto">
          <TabsList className={`grid grid-cols-2 md:grid-cols-4 bg-white/10 p-1 rounded-xl ${isMobile ? 'mb-16' : 'mb-8'}`}>
            {datiCategories.map(category => (
              <TabsTrigger 
                key={category.id} 
                value={category.id} 
                className="text-sm py-3 text-gray-300 data-[state=active]:bg-qonneq-accent data-[state=active]:text-white rounded-lg transition-all"
              >
                {category.label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {datiCategories.map(category => (
            <TabsContent key={category.id} value={category.id} className="mt-6">
              <Card className="overflow-hidden border-0 shadow-lg bg-white/5 backdrop-blur-sm">
                <div className={`h-2 bg-gradient-to-r ${category.color}`}></div>
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {category.items.map((item, index) => (
                      <div key={index} className="bg-white/10 p-5 rounded-lg border border-white/10 shadow-sm">
                        <div className={`h-1.5 w-10 bg-gradient-to-r mb-3 rounded-full ${category.color}`}></div>
                        <p className="font-medium text-gray-100">{item}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 bg-white/5 p-6 rounded-lg">
                    <h4 className="font-semibold text-qonneq-accent mb-3">{t('vantaggi.integration')}</h4>
                    <p className="text-gray-300">
                      {t('vantaggi.integration.desc')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
};
