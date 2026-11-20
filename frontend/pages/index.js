import Head from 'next/head';
import Navbar      from '../components/Navbar';
import Hero        from '../components/Hero';
import Stats       from '../components/Stats';
import About       from '../components/About';
import Skills      from '../components/Skills';
import Projects    from '../components/Projects';
import Experience  from '../components/Experience';
import Contact     from '../components/Contact';
import Footer      from '../components/Footer';
import Chatbot     from '../components/Chatbot';
import Testimonials from '../components/Testimonials';

export async function getServerSideProps({ req }) {
  // The API is served by this same app (pages/api) — call it on our own host.
  const proto = req.headers['x-forwarded-proto'] || 'http';
  const backendUrl = process.env.INTERNAL_API_URL || `${proto}://${req.headers.host}`;
  try {
    // Never let a slow/offline backend hang the page: each call gives up after 4s
    // and falls back to empty data, so the site always renders.
    const get = async (path) => {
      try {
        const r = await fetch(`${backendUrl}${path}`, { cache: 'no-store', signal: AbortSignal.timeout(4000) });
        return r.ok ? await r.json() : {};
      } catch (e) {
        console.error(`[SSR] ${path} failed:`, e.message);
        return {};
      }
    };
    const [pd, prd, skd, exd, edd] = await Promise.all([
      get('/api/profile'),
      get('/api/projects'),
      get('/api/skills'),
      get('/api/experience'),
      get('/api/profile/education'),
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

      <div className="bg-ink-950 min-h-screen">
        <Navbar />
        <main>
          <Hero        profile={profile} />
          <Stats />
          <About       profile={profile} education={education} />
          <Skills      skills={skills} />
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
