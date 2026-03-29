import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { homeMessages } from '../../messages/home.messages';

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative h-dvh flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <img
        src="/hero.png"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover object-center"
      />
      {/* Dark overlay so text stays readable */}
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-accent text-sm font-medium tracking-[0.3em] uppercase mb-4"
        >
          {homeMessages.heroSubtitle}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-white text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-none"
        >
          {homeMessages.heroTitle}
        </motion.h1>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <button
            onClick={() => navigate('/map')}
            className="px-8 py-3.5 bg-accent text-white font-semibold rounded-full hover:opacity-90 transition-opacity shadow-lg shadow-accent/20 cursor-pointer text-base"
          >
            {homeMessages.heroCta}
          </button>
        </motion.div>
      </div>
    </section>
  );
}
