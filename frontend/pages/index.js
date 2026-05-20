import { useEffect, useState } from 'react';
import Head from 'next/head';
import Navbar      from '../components/Navbar';
import Hero        from '../components/Hero';
import Stats       from '../components/Stats';
import About       from '../components/About';
import Skills      from '../components/Skills';
import TechMarquee from '../components/TechMarquee';
import Projects    from '../components/Projects';
import Experience  from '../components/Experience';
import Contact     from '../components/Contact';
import Footer      from '../components/Footer';
import Chatbot     from '../components/Chatbot';
import Testimonials from '../components/Testimonials';

export async function getServerSideProps() {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  try {
    const [pRes, prRes, skRes, exRes, edRes] = await Promise.all([
      fetch(`${backendUrl}/api/profile`,           { cache: 'no-store' }),
      fetch(`${backendUrl}/api/projects`,          { cache: 'no-store' }),
      fetch(`${backendUrl}/api/skills`,            { cache: 'no-store' }),
      fetch(`${backendUrl}/api/experience`,        { cache: 'no-store' }),
      fetch(`${backendUrl}/api/profile/education`, { cache: 'no-store' }),
    ]);
    const [pd, prd, skd, exd, edd] = await Promise.all([
      pRes.json(), prRes.json(), skRes.json(), exRes.json(), edRes.json(),
    ]);
    return {
      props: {
        profile:    pd.data?.profile || null,
        projects:   prd.data         || [],
        skills:     skd.data         || null,
        experience: exd.data         || [],
        education:  edd.data         || [],
      },
    };
  } catch (err) {
    console.error('[SSR] data fetch failed:', err.message);
    return { props: { profile: null, projects: [], skills: null, experience: [], education: [] } };
  }
}

function ScrollProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const fn = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setP(h > 0 ? (window.scrollY / h) * 100 : 0);
    };
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);
  return (
    <div
      className="fixed top-0 left-0 h-[2px] z-[60] transition-none"
      style={{
        width: `${p}%`,
        background: 'linear-gradient(90deg, #876d2f, #c8a96e 50%, #f3e7c4)',
      }}
    />
  );
}

export default function Portfolio({ profile, projects, skills, experience, education }) {
  const title = 'Saleh Mahamat Saleh — Cybersécurité & Full-Stack';
  const desc  = "Portfolio professionnel de Saleh Mahamat Saleh, étudiant en 2ème année DUT Cybersécurité à l'EST Safi. Développeur full-stack passionné par la sécurité des systèmes.";

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description"  content={desc} />
        <meta name="author"       content="Saleh Mahamat Saleh" />
        <meta name="keywords"     content="cybersécurité, développeur, full-stack, React, Node.js, Neo4j, JWT, Safi, Maroc, EST Safi, stage" />
        <meta name="robots"       content="index, follow" />
        <meta name="viewport"     content="width=device-width, initial-scale=1" />
        <meta property="og:title"       content={title} />
        <meta property="og:description" content={desc} />
        <meta property="og:type"        content="website" />
        {(profile?.photo_url || profile?.photoUrl) && <meta property="og:image" content={profile.photo_url || profile.photoUrl} />}
        <meta name="twitter:card"        content="summary_large_image" />
        <meta name="twitter:title"       content={title} />
        <meta name="twitter:description" content={desc} />
      </Head>

      <ScrollProgress />
      <div className="bg-ink-950 min-h-screen">
        <Navbar />
        <main>
          <Hero        profile={profile} />
          <Stats />
          <About       profile={profile} education={education} />
          <Skills      skills={skills} />
          <TechMarquee />
          <Projects    projects={projects} />
          <Experience  experience={experience} />
          <Testimonials />
          <Contact profile={profile} />
        </main>
        <Footer />
        <Chatbot />
      </div>
    </>
  );
}
