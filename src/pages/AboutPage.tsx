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
            <h2 className="font-display text-3xl md:text-4xl font-light text-white mb-8">Історія <span className="text-blood">BUKSY</span></h2>
            <p className="text-white/80 font-body text-lg leading-relaxed mb-12">
              Мене звати Денис, але більшість знає мене як <span className="text-white font-heading">mYnY bYk</span>. Я — засновник бренду BUKSY.
            </p>
          </motion.div>

          <div className="space-y-16">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
              <h3 className="font-heading text-xl tracking-wider text-blood mb-6">2022–2024</h3>
              <div className="space-y-5 text-white/70 font-body leading-relaxed">
                <p>Історія BUKSY почалася не з фабрики, не з інвестицій і не з великої команди. Вона почалася у 2022 році в невеликому місті Умань, коли мені було лише 11–12 років.</p>
                <p>Тоді я побачив, як люди ходять на завози секонд-хенду, знаходять цікаві речі й перепродають їх. Мені теж захотілося спробувати. Одного ранку, перед школою, я вперше сам пішов на завоз. Саме там я знайшов свою першу річ — дитячу кофту CP Company.</p>
                <p>Я майже не розумівся на брендах. Один хлопець сказав, що вона не оригінальна, і повісив її назад. Але щось підказало мені повернутися й усе ж купити її. Це були мої останні 350 гривень.</p>
                <p>Пізніше я продав цю кофту другові за 150 гривень, думаючи, що вона нічого не варта. Через деякий час він написав мені, що це був оригінал і він перепродав її за 1000 гривень.</p>
                <p>Саме тоді я зрозумів дві речі. Перша — знання коштують дорожче за будь-яку річ. Друга — на цьому можна заробити.</p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
              <h3 className="font-heading text-xl tracking-wider text-blood mb-6">Перші 100 доларів у 12 років</h3>
              <div className="space-y-5 text-white/70 font-body leading-relaxed">
                <p>З того дня разом із другом Захаром почалися постійні завози, ранні підйоми, пошук брендів, перші продажі на OLX, помилки, втрати й маленькі перемоги. Часто я повертався додому з порожніми руками, коли друг знаходив хороші речі. Це засмучувало, але змушувало працювати ще більше.</p>
                <p>Саме в той період у мене з'явилося прізвисько mYnY bYk, яке залишилося зі мною до сьогодні й стало частиною історії бренду.</p>
                <p>Згодом я почав заробляти більше та пробував себе в різних напрямках. Створював YouTube-контент, набрав понад 1000 підписників, займався арбітражем трафіку, будував власну команду, проходив через зради партнерів, втрачав гроші та починав усе заново.</p>
                <p>Кожен із цих етапів навчив мене головного — ніколи не здаватися після невдач.</p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
              <h3 className="font-heading text-xl tracking-wider text-blood mb-6">2024–2026</h3>
              <div className="space-y-5 text-white/70 font-body leading-relaxed">
                <p>Після цього я відкрив власний магазин buk_shop.ua і почав замовляти перші речі з Китаю. Перші продажі були невеликими, але кожен новий дроп ставав більшим за попередній.</p>
                <p>У 2025 році продажі виросли в рази. Попри втрати через браковані партії, я не зупинився. Саме того року, у 13 років, мені вдалося заробити свої перші 1000 доларів.</p>
                <p>Тоді я зрозумів, що більше не хочу просто продавати чужі речі. Я захотів створити щось своє.</p>
                <p className="text-white font-heading text-lg tracking-wide">Так народився BUKSY.</p>
                <p>Назва бренду поєднує історію мого магазину buk_shop.ua та моє багаторічне прізвисько mYnY bYk. Для мене це не просто слово. Це символ усього шляху, який я пройшов.</p>
                <p>Перші дизайни я створював сам. Не було досвіду, не було великих бюджетів і не було гарантій успіху. Було лише бажання зробити одяг, який хотілося б носити самому.</p>
                <p>У 14 років я заробив свої перші 5000 доларів на товарному бізнесі. Попри це, я вирішив залишити його. Гроші — не були моєю кінцевою ціллю. Я хотів створити бренд, який залишиться надовго.</p>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="border-l-2 border-blood pl-6">
              <h3 className="font-heading text-xl tracking-wider text-blood mb-6">2026 — BUKSY 🩸</h3>
              <p className="text-white/80 font-body text-lg leading-relaxed mb-4">
                Сьогодні BUKSY — це не просто одяг.
              </p>
              <p className="text-white/70 font-body leading-relaxed mb-4">
                Це історія хлопця з невеликого міста, який почав із секонд-хенду, пройшов через помилки, втрати, зради, десятки невдалих спроб і тисячі годин роботи, щоб одного дня створити щось своє.
              </p>
              <p className="text-white font-heading text-lg tracking-wide">Це лише початок.</p>
            </motion.div>
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
