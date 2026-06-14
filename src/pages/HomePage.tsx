import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { products, heroImage, editorialImage } from '../data/products';
import { ProductCard } from '../components/ProductCard';

export function HomePage() {
  const featuredProducts = products.filter((p) => p.isFeatured);
  const bestsellers = products.filter((p) => p.isBestseller);

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-screen">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Hero"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-noir via-noir/80 to-noir/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-noir via-transparent to-noir/50" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 h-full flex flex-col justify-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="max-w-2xl"
          >
            <p className="font-heading text-sm tracking-[0.4em] text-blood mb-4">
              DARK LUXURY STREETWEAR
            </p>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-light text-white leading-tight mb-6">
              Embrace the
              <br />
              <span className="text-blood">Shadows</span>
            </h1>
            <p className="text-lg text-white/70 leading-relaxed mb-10 max-w-lg">
              Premium streetwear for those who walk their own path. Crafted with intention,
              designed for the unconventional.
            </p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-wrap gap-4"
            >
              <Link to="/shop" className="btn-primary flex items-center gap-3">
                SHOP NOW
                <ArrowRight size={18} />
              </Link>
              <Link to="/about" className="btn-secondary">
                OUR STORY
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-white/40 text-xs tracking-[0.2em] font-body">SCROLL</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ChevronDown size={20} className="text-blood" />
          </motion.div>
        </motion.div>

        {/* Decorative Elements */}
        <div className="absolute top-1/4 right-8 lg:right-16 opacity-10">
          <svg width="200" height="200" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="95" fill="none" stroke="#B10006" strokeWidth="1" />
            <circle cx="100" cy="100" r="80" fill="none" stroke="#B10006" strokeWidth="0.5" />
          </svg>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 bg-noir">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-12"
          >
            <div>
              <p className="section-subtitle mb-3">SELECTED FOR YOU</p>
              <h2 className="section-title">
                Featured <span className="text-blood">.</span>
              </h2>
            </div>
            <Link
              to="/shop"
              className="group flex items-center gap-2 text-white/60 hover:text-white transition-colors duration-300"
            >
              <span className="font-body text-sm tracking-wider">VIEW ALL</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {featuredProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Brand Story Preview */}
      <section className="relative py-32 bg-ash">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="aspect-[4/5] overflow-hidden">
              <img
                src={editorialImage}
                alt="BUKSY Editorial"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 w-48 h-48 border border-blood/30 hidden lg:block" />
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:pl-8"
          >
            <p className="section-subtitle mb-3">OUR PHILOSOPHY</p>
            <h2 className="section-title mb-8">
              Born from <br />Darkness
            </h2>
            <div className="space-y-6 text-white/70 font-body leading-relaxed">
              <p>
                BUKSY exists at the intersection of luxury and rebellion. We believe that
                true style doesn't demand attention—it commands it through subtlety,
                quality, and intention.
              </p>
              <p>
                Every piece is crafted with obsessive attention to detail, using only the
                finest materials: heavyweight Japanese cotton, Italian leather, and
                Swiss hardware. Our designs are minimal yet memorable, timeless yet
                distinctly modern.
              </p>
              <p>
                We create for those who reject the ordinary, who find beauty in shadows,
                and who understand that luxury is not about logos—it's about excellence.
              </p>
            </div>
            <Link to="/about" className="btn-primary inline-flex items-center gap-3 mt-10">
              EXPLORE OUR STORY
              <ArrowRight size={18} />
            </Link>
          </motion.div>
        </div>

        {/* Decorative */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blood/5 to-transparent pointer-events-none" />
      </section>

      {/* Bestsellers */}
      <section className="py-24 bg-noir">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="section-subtitle mb-3">MOST WANTED</p>
            <h2 className="section-title">
              Bestsellers <span className="text-blood">.</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {bestsellers.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-24 bg-ash">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="section-subtitle mb-3">SHOP BY CATEGORY</p>
            <h2 className="section-title">
              Collections <span className="text-blood">.</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'Hoodies', slug: 'hoodies', image: products.find(p => p.category === 'hoodies')?.images[0] },
              { name: 'T-Shirts', slug: 't-shirts', image: products.find(p => p.category === 't-shirts')?.images[0] },
              { name: 'Jackets', slug: 'jackets', image: products.find(p => p.category === 'jackets')?.images[0] },
              { name: 'Pants', slug: 'pants', image: products.find(p => p.category === 'pants')?.images[0] },
              { name: 'Accessories', slug: 'accessories', image: products.find(p => p.category === 'accessories')?.images[0] },
              { name: 'Footwear', slug: 'footwear', image: products.find(p => p.category === 'footwear')?.images[0] },
            ].map((category, index) => (
              <motion.div
                key={category.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  to={`/shop?category=${category.slug}`}
                  className="group relative block aspect-[4/3] overflow-hidden bg-noir"
                >
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-noir via-noir/40 to-transparent" />
                  <div className="absolute inset-0 bg-blood/0 group-hover:bg-blood/10 transition-colors duration-500" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="font-heading text-lg tracking-[0.2em] text-white group-hover:text-blood transition-colors duration-300">
                      {category.name.toUpperCase()}
                    </h3>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Instagram Feed / Lookbook */}
      <section className="py-24 bg-noir">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="section-subtitle mb-3">@BUKSY.OFFICIAL</p>
            <h2 className="section-title">
              Follow the <span className="text-blood">Movement</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {[
              'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=400',
              'https://images.pexels.com/photos/2062587/pexels-photo-2062587.jpeg?auto=compress&cs=tinysrgb&w=400',
              'https://images.pexels.com/photos/6311387/pexels-photo-6311387.jpeg?auto=compress&cs=tinysrgb&w=400',
              'https://images.pexels.com/photos/1126964/pexels-photo-1126964.jpeg?auto=compress&cs=tinysrgb&w=400',
              'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=400',
              'https://images.pexels.com/photos/5632402/pexels-photo-5632402.jpeg?auto=compress&cs=tinysrgb&w=400',
            ].map((img, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="aspect-square overflow-hidden"
              >
                <img
                  src={img}
                  alt={`Instagram post ${index + 1}`}
                  className="w-full h-full object-cover filter grayscale hover:grayscale-0 transition-filter duration-500"
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
