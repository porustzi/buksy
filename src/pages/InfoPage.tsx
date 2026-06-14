import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

const pages: Record<string, { title: string; content: string }> = {
  faq: {
    title: 'FAQ',
    content: 'Find answers to common questions about shipping, returns, sizing, and more. If you need further assistance, feel free to contact our support team.',
  },
  shipping: {
    title: 'Shipping & Returns',
    content: 'We offer free worldwide shipping on orders over $150. Standard shipping takes 5-7 business days. Express shipping (2-3 days) is available for an additional fee. Returns are accepted within 30 days of delivery for unworn items in original packaging.',
  },
  'size-guide': {
    title: 'Size Guide',
    content: 'Our pieces are designed with a modern, relaxed fit. We recommend sizing true for a relaxed silhouette, or sizing down for a more fitted look. Refer to the measurements on each product page for detailed sizing information.',
  },
  track: {
    title: 'Track Order',
    content: 'Once your order ships, you will receive an email with tracking information. You can also track your order through your account dashboard or contact our support team for assistance.',
  },
  privacy: {
    title: 'Privacy Policy',
    content: 'We respect your privacy and are committed to protecting your personal data. This policy outlines how we collect, use, and safeguard your information when you use our website and services.',
  },
  terms: {
    title: 'Terms of Service',
    content: 'By using our website and purchasing our products, you agree to these terms. Please read them carefully. We reserve the right to update these terms at any time.',
  },
  cookies: {
    title: 'Cookie Policy',
    content: 'We use cookies to enhance your browsing experience, analyze site traffic, and provide personalized content. By continuing to use our site, you consent to our use of cookies.',
  },
};

export function InfoPage() {
  const { slug } = useParams<{ slug: string }>();
  const page = slug ? pages[slug] : undefined;

  if (!page) {
    return (
      <div className="min-h-screen bg-noir pt-24 flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-4xl font-light mb-4">Page Not Found</h1>
          <p className="text-white/60 font-body mb-6">"{slug}" — this page doesn't exist.</p>
          <Link to="/" className="text-blood hover:underline">Return Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-noir pt-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors duration-300 mb-8 font-body text-sm"
        >
          <ArrowLeft size={18} />
          Back to Home
        </Link>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="font-display text-4xl md:text-5xl font-light mb-6">{page.title}</h1>
          <div className="h-px bg-blood/30 mb-8" />
          <p className="text-white/70 font-body leading-relaxed text-lg">
            {page.content}
          </p>
          <div className="mt-12">
            <Link to="/contact" className="btn-primary inline-flex items-center gap-3">
              Contact Support
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
