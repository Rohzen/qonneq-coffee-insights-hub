
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Cpu, Activity } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export const Hero = () => {
  const { t } = useLanguage();
  
  const keyPoints = [{
    icon: LayoutDashboard,
    title: t('keypoint.dashboard.title'),
    description: t('keypoint.dashboard.desc')
  }, {
    icon: Cpu,
    title: t('keypoint.consumption.title'),
    description: t('keypoint.consumption.desc')
  }, {
    icon: Activity,
    title: t('keypoint.monitoring.title'),
    description: t('keypoint.monitoring.desc')
  }];

  const scrollToForm = (e: React.MouseEvent) => {
    e.preventDefault();
    const formSection = document.getElementById('contattaci');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return <section className="pt-40 pb-16 bg-cover bg-center bg-no-repeat min-h-screen" style={{
    backgroundImage: 'url("/lovable-uploads/5de83f51-cef2-40e8-8031-710ecb2107be.png")'
  }}>
      <div className="container mx-auto px-4">
        <div className="max-w-4xl space-y-8">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-white">
            {t('hero.title')}
          </h1>
          <p className="text-lg md:text-xl text-gray-300">
            {t('hero.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button 
              className="bg-white text-qonneq-accent hover:bg-gray-100 text-lg py-6 px-8 shadow-lg"
              onClick={scrollToForm}
            >
              {t('hero.cta')}
            </Button>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          {keyPoints.map((point, index) => <div key={index} className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-white rounded-lg">
                  <point.icon className="w-6 h-6 text-qonneq-accent" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">{point.title}</h3>
                  <p className="text-white">{point.description}</p>
                </div>
              </div>
            </div>)}
        </div>
      </div>
    </section>;
};
