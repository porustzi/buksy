import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { aboutPage } from '../data/content';

export function AboutPage() {
  const { t } = useTranslation();
  const a = aboutPage || {};

  return (
    <div className="min-h-screen bg-noir pt-24">
      {/* Hero */}
      <section className="relative h-[70vh] overflow-hidden">
        <div className="absolute inset-0">
          <img src={a.hero?.image} alt="BUKSY Editorial" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-noir via-noir/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-noir via-transparent to-noir/50" />
        </div>
        <div className="relative z-10 h-full flex flex-col justify-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <p className="section-subtitle mb-4">{a.hero?.tagline || t('about.ourStory')}</p>
            <h1 className="section-title max-w-2xl">
              {a.hero?.title1 || t('about.heroTitle1')} <br />
              <span className="text-blood">{a.hero?.title2 || t('about.heroTitle2')}</span>
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
              <p className="font-heading text-6xl md:text-7xl lg:text-8xl font-light text-white/5 absolute -left-4 top-0 select-none">" "</p>
              <blockquote className="relative">
                <p className="font-display text-2xl md:text-3xl font-light text-white leading-relaxed mb-6">
                  {a.philosophy?.quote || t('about.philosophyQuote')}
                </p>
                <footer className="text-white/60 font-body">
                  <span className="text-blood">—</span> {a.philosophy?.author || t('about.theFounders')}
                </footer>
              </blockquote>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2 }} className="relative">
              <div className="aspect-[3/4] overflow-hidden">
                <img src={a.philosophy?.image} alt="Atelier craftsmanship" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-8 -left-8 w-32 h-32 border border-blood/30" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-ash">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <p className="section-subtitle mb-3">{a.values?.tagline || t('about.whatWeStandFor')}</p>
            <h2 className="section-title">{a.values?.title || t('about.ourValues')} <span className="text-blood">.</span></h2>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {(a.values?.items?.length
              ? a.values.items
              : [
                  { title: t('about.valueIntentionality'), description: t('about.valueIntentionalityDesc') },
                  { title: t('about.valueQuality'), description: t('about.valueQualityDesc') },
                  { title: t('about.valueRebellion'), description: t('about.valueRebellionDesc') },
                  { title: t('about.valueSustainable'), description: t('about.valueSustainableDesc') },
                ]
            ).map((v: any, index: number) => (
              <motion.div key={v.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="group p-6 border border-white/5 hover:border-blood/30 transition-colors duration-500">
                <span className="font-mono text-blood text-sm mb-4 block">0{index + 1}</span>
                <h3 className="font-heading text-lg tracking-wider mb-3 group-hover:text-blood transition-colors duration-300">{v.title}</h3>
                <p className="text-white/60 font-body text-sm leading-relaxed">{v.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Atelier */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="lg:col-span-2">
              <div className="aspect-[16/9] overflow-hidden">
                <img src={a.atelier?.image} alt="BUKSY Studio" className="w-full h-full object-cover" />
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="flex flex-col justify-center space-y-6">
              <h3 className="font-heading text-2xl tracking-wider">{a.atelier?.title || t('about.theAtelier')}</h3>
              <p className="text-white/70 font-body leading-relaxed">{a.atelier?.description1 || t('about.atelierDesc1')}</p>
              <p className="text-white/70 font-body leading-relaxed">{a.atelier?.description2 || t('about.atelierDesc2')}</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-24 bg-ash">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <p className="section-subtitle mb-3">{a.timeline?.tagline || t('about.ourJourney')}</p>
            <h2 className="section-title">{a.timeline?.title || t('about.milestones')} <span className="text-blood">.</span></h2>
          </motion.div>
          <div className="relative">
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-blood/20 hidden md:block" />
            <div className="space-y-12">
              {(a.timeline?.events || []).map((item: any, index: number) => (
                <motion.div key={item.year} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="flex flex-col md:flex-row items-center gap-6">
                  <div className={`flex-1 text-center ${index % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>
                    {index % 2 === 0 ? (<><span className="font-mono text-blood text-3xl">{item.year}</span><h4 className="font-heading text-lg mt-2">{item.event}</h4></>) : <div className="hidden md:block" />}
                  </div>
                  <div className="w-4 h-4 bg-blood rounded-full relative z-10 hidden md:block flex-shrink-0" />
                  <div className={`flex-1 text-center ${index % 2 === 1 ? 'md:text-left' : 'md:text-right'}`}>
                    {index % 2 === 1 ? (<><span className="font-mono text-blood text-3xl">{item.year}</span><h4 className="font-heading text-lg mt-2">{item.event}</h4></>) : <div className="hidden md:block" />}
                  </div>
                  <div className="flex items-center gap-4 md:hidden">
                    <span className="font-mono text-blood text-2xl">{item.year}</span>
                    <h4 className="font-heading text-base">{item.event}</h4>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-light mb-6">
              {a.cta?.title1 || t('about.joinMovement')} <span className="text-blood">{a.cta?.title2 || t('about.movement')}</span>
            </h2>
            <p className="text-white/60 font-body max-w-xl mx-auto mb-10">{a.cta?.description || t('about.joinDesc')}</p>
            <Link to="/shop" className="btn-primary inline-flex items-center gap-3">
              {a.cta?.button || t('about.exploreCollection')}
              <ArrowRight size={18} />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
