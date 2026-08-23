import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useContent } from '../hooks/useContent';
import { useSeo } from '../hooks/useSeo';
import { NotFoundPage } from './NotFoundPage';

export function InfoPage() {
  const { t } = useTranslation();
  const { infoPages } = useContent();
  const { slug } = useParams<{ slug: string }>();
  const page = slug ? (infoPages as Record<string, { title: string; content: string }>)[slug] : undefined;

  useSeo({ title: page?.title, description: page?.title });

  if (!page) {
    return <NotFoundPage />;
  }

  return (
    <div className="min-h-screen bg-noir pt-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://buksy.shop/" },
            { "@type": "ListItem", "position": 2, "name": page.title, "item": window.location.href }
          ]
        }) }}
      />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors duration-300 mb-8 font-body text-sm"
        >
          <ArrowLeft size={18} />
          {t('common.backToHome')}
        </Link>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="font-display text-4xl md:text-5xl font-light mb-6">{page.title}</h1>
          <div className="h-px bg-blood/30 mb-8" />
          <p className="text-white/70 font-body leading-relaxed text-lg whitespace-pre-line">
            {page.content}
          </p>
          <div className="mt-12">
            <Link to="/contact" className="btn-primary inline-flex items-center gap-3">
              {t('info.contactSupport')}
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
