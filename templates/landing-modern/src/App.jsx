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
import { ThemeProvider } from './components/ui/ThemeProvider.jsx';

export default function App() {
  return (
    <ThemeProvider>
      <AnimationProvider>
        <div className="lm-template min-h-screen relative">
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
