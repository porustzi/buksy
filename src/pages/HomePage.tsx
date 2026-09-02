import { useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useContent, useProducts } from '../hooks/useContent';
import { ProductCard } from '../components/ProductCard';
import { useSeo } from '../hooks/useSeo';
import { Editable } from '../components/edit/Editable';

export function HomePage() {
  const { t } = useTranslation();
  const { homepage } = useContent();
  const products = useProducts();
  useSeo({ title: 'Преміальний темний стрітвір' });
  const hotProducts = useMemo(() => products.filter((p) => p.isHot || p.isBestseller), [products]);
  const hero = homepage.hero || {};
  const best = homepage.bestsellers || {};
  const coll = homepage.collections || {};
  const heroImg = hero.image || 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=1200';
  const heroVideo = hero.video || '';
  const useVideo = !!hero.useVideo && !!heroVideo;
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (useVideo && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [useVideo]);

  return (
    <div className="overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          "name": "BUKSY Bestsellers",
          "url": "https://buksy.shop/shop",
          "itemListElement": hotProducts.slice(0, 5).map((p, i) => ({
            "@type": "ListItem",
            "position": i + 1,
            "url": "https://buksy.shop/product/" + p.slug,
            "name": "BUKSY " + p.name
          }))
        }) }}
      />
      <section className="relative h-screen">
        <div className="absolute inset-0">
          {useVideo ? (
            <video ref={videoRef} src={heroVideo} autoPlay muted loop playsInline preload="auto" className="w-full h-full object-cover" />
          ) : (
            <img src={heroImg} alt="BUKSY Dark Luxury Streetwear" fetchPriority="high" className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-noir via-noir/80 to-noir/40" /><div className="absolute inset-0 bg-gradient-to-t from-noir via-transparent to-noir/50" />
        </div>
        <div className="relative z-10 h-full flex flex-col justify-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.2 }} className="max-w-2xl">
            <p className="font-heading text-sm tracking-[0.4em] text-blood mb-4"><Editable path="homepage.hero.tagline" as="span">{hero.tagline}</Editable></p>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-light text-white leading-tight mb-6"><Editable path="homepage.hero.title1" as="span">{hero.title1}</Editable><br /><span className="text-blood"><Editable path="homepage.hero.title2" as="span">{hero.title2}</Editable></span></h1>
            <p className="text-lg text-white/70 leading-relaxed mb-10 max-w-lg"><Editable path="homepage.hero.description" as="span">{hero.description}</Editable></p>
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="absolute bottom-28 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="text-white/40 text-xs tracking-[0.2em] font-body">{hero.scroll}</span>
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity }}><ChevronDown size={20} className="text-blood" /></motion.div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.6 }} className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col sm:flex-row gap-4 z-10 w-full max-w-lg px-4 justify-center">
          <Link to="/shop" className="btn-primary flex items-center justify-center gap-3"><Editable path="homepage.hero.shopNow" as="span">{hero.shopNow}</Editable><ArrowRight size={18} /></Link>
          <Link to="/about" className="btn-secondary text-center"><Editable path="homepage.hero.ourStory" as="span">{hero.ourStory}</Editable></Link>
        </motion.div>
      </section>

      <section className="py-24 bg-noir">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12"><p className="section-subtitle mb-3">{best.tagline}</p><h2 className="section-title">{best.title} <span className="text-blood">.</span></h2></motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">{hotProducts.map((p, i) => (<ProductCard key={p.id} product={p} index={i} />))}</div>
        </div>
      </section>

      <section className="py-24 bg-ash">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12"><p className="section-subtitle mb-3">{coll.tagline}</p><h2 className="section-title">{coll.title} <span className="text-blood">.</span></h2></motion.div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[{ nameKey: 'shop.categoryTShirts', slug: 't-shirts', image: products.find(p => p.category === 't-shirts')?.images[0] || '' },{ nameKey: 'shop.categoryShorts', slug: 'shorts', image: products.find(p => p.category === 'shorts')?.images[0] || '' },{ nameKey: 'shop.categoryLongsleeves', slug: 'longsleeves', image: products.find(p => p.category === 'longsleeves')?.images[0] || '' }].map((cat, i) => (
              <motion.div key={cat.slug} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Link to={`/shop?category=${cat.slug}`} className="group relative block aspect-[4/3] overflow-hidden bg-noir"><img src={cat.image} alt={t(cat.nameKey)} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" /><div className="absolute inset-0 bg-gradient-to-t from-noir via-noir/40 to-transparent" /><div className="absolute bottom-4 left-4 right-4"><h3 className="font-heading text-lg tracking-[0.2em] text-white group-hover:text-blood transition-colors duration-300">{t(cat.nameKey).toUpperCase()}</h3></div></Link>
              </motion.div>))}
          </div>
        </div>
      </section>
    </div>
  );
}
