import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useContent } from '../hooks/useContent';
import { useSeo } from '../hooks/useSeo';
import { Editable } from '../components/edit/Editable';

export function AboutPage() {
  const { aboutPage } = useContent();
  const hero = aboutPage.hero || {};
  useSeo({ title: hero.tagline || 'Про нас', description: hero.title1 });
  const cta = aboutPage.cta || {};
  const story = aboutPage.story || {};
  const sections = story.sections || [];

  return (
    <div className="min-h-screen bg-noir pt-24">
      <section className="relative h-[70vh] overflow-hidden">
        <div className="absolute inset-0"><img src={hero.image} alt="" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-r from-noir via-noir/60 to-transparent" /><div className="absolute inset-0 bg-gradient-to-t from-noir via-transparent to-noir/50" /></div>
        <div className="relative z-10 h-full flex flex-col justify-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <p className="section-subtitle mb-4"><Editable path="about.hero.tagline" as="span">{hero.tagline}</Editable></p>
            <h1 className="section-title max-w-2xl"><Editable path="about.hero.title1" as="span">{hero.title1}</Editable> <br /><span className="text-blood"><Editable path="about.hero.title2" as="span">{hero.title2}</Editable></span></h1>
          </motion.div>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <h2 className="font-display text-3xl md:text-4xl font-light text-white mb-8"><Editable path="about.story.title" as="span">{story.title}</Editable></h2>
            <p className="text-white/80 font-body text-lg leading-relaxed mb-12">
              <Editable path="about.story.intro" as="span">{story.intro}</Editable>
            </p>
          </motion.div>

          <div className="space-y-16">
            {sections.map((sec: { title: string; paragraphs: string[] }, si: number) => (
              <motion.div key={si} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
                <h3 className="font-heading text-xl tracking-wider text-blood mb-6"><Editable path={`about.story.sections.${si}.title`} as="span">{sec.title}</Editable></h3>
                <div className="space-y-5 text-white/70 font-body leading-relaxed">
                  {sec.paragraphs.map((para: string, pi: number) => (
                    <p key={pi}><Editable path={`about.story.sections.${si}.paragraphs.${pi}`} as="span">{para}</Editable></p>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-ash">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-light mb-6"><Editable path="about.cta.title1" as="span">{cta.title1}</Editable> <span className="text-blood"><Editable path="about.cta.title2" as="span">{cta.title2}</Editable></span></h2>
            <p className="text-white/60 font-body max-w-xl mx-auto mb-10"><Editable path="about.cta.description" as="span">{cta.description}</Editable></p>
            <Link to="/shop" className="btn-primary inline-flex items-center gap-3"><Editable path="about.cta.button" as="span">{cta.button}</Editable><ArrowRight size={18} /></Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
