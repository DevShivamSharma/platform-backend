import { useEffect } from 'react';
import Navbar from './components/layout/Navbar.jsx';
import Footer from './components/layout/Footer.jsx';
import Hero from './components/sections/Hero.jsx';
import About from './components/sections/About.jsx';
import Skills from './components/sections/Skills.jsx';
import Projects from './components/sections/Projects.jsx';
import Experience from './components/sections/Experience.jsx';
import Services from './components/sections/Services.jsx';
import Contact from './components/sections/Contact.jsx';
import CustomCursor from './components/ui/CustomCursor.jsx';
import AnimationProvider from './components/ui/AnimationProvider.jsx';
import { ThemeProvider } from './hooks/useTheme.jsx';
import { templateConfig } from './config.js';

// Drive document-level metadata from config so the content layer fully owns it.
function useDocumentMeta() {
  useEffect(() => {
    const { document: doc, effects } = templateConfig;
    if (doc.title) document.title = doc.title;
    if (doc.lang) document.documentElement.lang = doc.lang;

    const ensureMeta = (name) => {
      let el = document.querySelector(`meta[name="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('name', name);
        document.head.appendChild(el);
      }
      return el;
    };
    if (doc.description) ensureMeta('description').setAttribute('content', doc.description);
    if (effects.themeColorMeta) ensureMeta('theme-color').setAttribute('content', effects.themeColorMeta);
  }, []);
}

export default function App() {
  useDocumentMeta();
  return (
    <ThemeProvider>
      <AnimationProvider>
        {/* lm-root scopes the template so its styles never leak into a host page. */}
        <div className="lm-root min-h-screen relative bg-base">
          <CustomCursor />
          <Navbar />
          <main>
            <Hero />
            <About />
            <Skills />
            <Projects />
            <Experience />
            <Services />
            <Contact />
          </main>
          <Footer />
        </div>
      </AnimationProvider>
    </ThemeProvider>
  );
}
