// 5 CV templates — each accepts the same `data` shape:
// { personal: {fullName, title, email, phone, location, website, linkedin, github, photo, summary},
//   experience: [{role, company, location, period, description, tasks: []}],
//   education:  [{degree, school, location, period, description}],
//   skills:     [{category, items: []}],  // items is array of strings
//   languages:  [{name, level}],
//   certifications: [{name, issuer, year}] }

const Section = ({ title, color, children, accent }) => (
  <section className="cv-section">
    <h3 className="cv-section-title" style={{ color: accent || color, borderColor: accent || color }}>
      {title}
    </h3>
    {children}
  </section>
);

// ============================================================================
// 1. MODERN — Sidebar gauche colorée + corps blanc
// ============================================================================
export function ModernCV({ data, color = '#c8a96e' }) {
  const p = data.personal || {};
  return (
    <div className="cv cv-modern" style={{ '--cv-accent': color }}>
      <aside className="cv-modern-side" style={{ background: color }}>
        {p.photo && (
          <div className="cv-photo-wrap">
            <img src={p.photo} alt={p.fullName} className="cv-photo" />
          </div>
        )}
        <h1 className="cv-modern-name">{p.fullName || 'Votre Nom'}</h1>
        <div className="cv-modern-title">{p.title || 'Votre poste'}</div>

        <div className="cv-modern-block">
          <h4>CONTACT</h4>
          {p.email && <div>✉ {p.email}</div>}
          {p.phone && <div>☎ {p.phone}</div>}
          {p.location && <div>📍 {p.location}</div>}
          {p.website && <div>🌐 {p.website}</div>}
          {p.linkedin && <div>in {p.linkedin.replace(/https?:\/\//, '')}</div>}
          {p.github && <div>⚡ {p.github.replace(/https?:\/\//, '')}</div>}
        </div>

        {(data.skills || []).length > 0 && (
          <div className="cv-modern-block">
            <h4>COMPÉTENCES</h4>
            {data.skills.map((s, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <strong>{s.category}</strong>
                <div style={{ fontSize: '0.85em', opacity: 0.95 }}>{(s.items || []).join(' · ')}</div>
              </div>
            ))}
          </div>
        )}

        {(data.languages || []).length > 0 && (
          <div className="cv-modern-block">
            <h4>LANGUES</h4>
            {data.languages.map((l, i) => (
              <div key={i}>{l.name} — <em>{l.level}</em></div>
            ))}
          </div>
        )}
      </aside>

      <main className="cv-modern-main">
        {p.summary && (
          <Section title="PROFIL" color={color}>
            <p>{p.summary}</p>
          </Section>
        )}

        {(data.experience || []).length > 0 && (
          <Section title="EXPÉRIENCE PROFESSIONNELLE" color={color}>
            {data.experience.map((e, i) => (
              <div key={i} className="cv-entry">
                <div className="cv-entry-head">
                  <div>
                    <strong>{e.role}</strong> — <em>{e.company}</em>
                  </div>
                  <div className="cv-entry-period">{e.period}</div>
                </div>
                {e.location && <div className="cv-entry-loc">{e.location}</div>}
                {e.description && <p>{e.description}</p>}
                {(e.tasks || []).length > 0 && (
                  <ul>{e.tasks.map((t, j) => <li key={j}>{t}</li>)}</ul>
                )}
              </div>
            ))}
          </Section>
        )}

        {(data.education || []).length > 0 && (
          <Section title="FORMATION" color={color}>
            {data.education.map((e, i) => (
              <div key={i} className="cv-entry">
                <div className="cv-entry-head">
                  <div><strong>{e.degree}</strong> — <em>{e.school}</em></div>
                  <div className="cv-entry-period">{e.period}</div>
                </div>
                {e.location && <div className="cv-entry-loc">{e.location}</div>}
                {e.description && <p>{e.description}</p>}
              </div>
            ))}
          </Section>
        )}

        {(data.certifications || []).length > 0 && (
          <Section title="CERTIFICATIONS" color={color}>
            <ul>
              {data.certifications.map((c, i) => (
                <li key={i}><strong>{c.name}</strong> — {c.issuer} ({c.year})</li>
              ))}
            </ul>
          </Section>
        )}
      </main>
    </div>
  );
}

// ============================================================================
// 2. CLASSIC — Sobre, centré, ATS-friendly (compatible robots de tri)
// ============================================================================
export function ClassicCV({ data, color = '#1a1a1a' }) {
  const p = data.personal || {};
  return (
    <div className="cv cv-classic" style={{ '--cv-accent': color }}>
      <header className="cv-classic-head">
        <h1>{p.fullName || 'Votre Nom'}</h1>
        <div className="cv-classic-title">{p.title || 'Votre poste'}</div>
        <div className="cv-classic-contact">
          {[p.email, p.phone, p.location, p.linkedin, p.github].filter(Boolean).join(' · ')}
        </div>
      </header>

      <hr style={{ borderColor: color }} />

      {p.summary && (
        <Section title="Profil" color={color}>
          <p>{p.summary}</p>
        </Section>
      )}

      {(data.experience || []).length > 0 && (
        <Section title="Expérience professionnelle" color={color}>
          {data.experience.map((e, i) => (
            <div key={i} className="cv-entry">
              <div className="cv-entry-head">
                <div><strong>{e.role}</strong>, {e.company}{e.location ? ` — ${e.location}` : ''}</div>
                <div className="cv-entry-period">{e.period}</div>
              </div>
              {e.description && <p>{e.description}</p>}
              {(e.tasks || []).length > 0 && (
                <ul>{e.tasks.map((t, j) => <li key={j}>{t}</li>)}</ul>
              )}
            </div>
          ))}
        </Section>
      )}

      {(data.education || []).length > 0 && (
        <Section title="Formation" color={color}>
          {data.education.map((e, i) => (
            <div key={i} className="cv-entry">
              <div className="cv-entry-head">
                <div><strong>{e.degree}</strong>, {e.school}</div>
                <div className="cv-entry-period">{e.period}</div>
              </div>
              {e.description && <p>{e.description}</p>}
            </div>
          ))}
        </Section>
      )}

      {(data.skills || []).length > 0 && (
        <Section title="Compétences" color={color}>
          {data.skills.map((s, i) => (
            <div key={i}><strong>{s.category} :</strong> {(s.items || []).join(', ')}</div>
          ))}
        </Section>
      )}

      {(data.languages || []).length > 0 && (
        <Section title="Langues" color={color}>
          {data.languages.map((l, i) => (
            <span key={i}>{l.name} ({l.level}){i < data.languages.length - 1 ? ' · ' : ''}</span>
          ))}
        </Section>
      )}

      {(data.certifications || []).length > 0 && (
        <Section title="Certifications" color={color}>
          {data.certifications.map((c, i) => (
            <div key={i}>{c.name} — {c.issuer} ({c.year})</div>
          ))}
        </Section>
      )}
    </div>
  );
}

// ============================================================================
// 3. CREATIVE — Header coloré, timeline, accents visuels
// ============================================================================
export function CreativeCV({ data, color = '#e47c69' }) {
  const p = data.personal || {};
  return (
    <div className="cv cv-creative" style={{ '--cv-accent': color }}>
      <header className="cv-creative-head" style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}>
        <div className="cv-creative-head-inner">
          {p.photo && <img src={p.photo} alt={p.fullName} className="cv-creative-photo" />}
          <div>
            <h1>{p.fullName || 'Votre Nom'}</h1>
            <div className="cv-creative-title">{p.title || 'Votre poste'}</div>
            <div className="cv-creative-contact">
              {p.email && <span>✉ {p.email}</span>}
              {p.phone && <span>☎ {p.phone}</span>}
              {p.location && <span>📍 {p.location}</span>}
            </div>
          </div>
        </div>
      </header>

      <div className="cv-creative-body">
        <div className="cv-creative-left">
          {p.summary && (
            <Section title="À propos" accent={color}>
              <p>{p.summary}</p>
            </Section>
          )}

          {(data.experience || []).length > 0 && (
            <Section title="Expérience" accent={color}>
              {data.experience.map((e, i) => (
                <div key={i} className="cv-timeline-item" style={{ '--cv-accent': color }}>
                  <div className="cv-timeline-dot" />
                  <div className="cv-entry-period" style={{ color }}>{e.period}</div>
                  <div><strong>{e.role}</strong> chez <em>{e.company}</em></div>
                  {e.description && <p>{e.description}</p>}
                  {(e.tasks || []).length > 0 && (
                    <ul>{e.tasks.map((t, j) => <li key={j}>{t}</li>)}</ul>
                  )}
                </div>
              ))}
            </Section>
          )}

          {(data.education || []).length > 0 && (
            <Section title="Formation" accent={color}>
              {data.education.map((e, i) => (
                <div key={i} className="cv-timeline-item">
                  <div className="cv-timeline-dot" />
                  <div className="cv-entry-period" style={{ color }}>{e.period}</div>
                  <div><strong>{e.degree}</strong> — {e.school}</div>
                </div>
              ))}
            </Section>
          )}
        </div>

        <aside className="cv-creative-right">
          {(data.skills || []).length > 0 && (
            <Section title="Compétences" accent={color}>
              {data.skills.map((s, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <strong style={{ color }}>{s.category}</strong>
                  <div>{(s.items || []).join(' · ')}</div>
                </div>
              ))}
            </Section>
          )}

          {(data.languages || []).length > 0 && (
            <Section title="Langues" accent={color}>
              {data.languages.map((l, i) => (
                <div key={i}>{l.name} — <em>{l.level}</em></div>
              ))}
            </Section>
          )}

          {(data.certifications || []).length > 0 && (
            <Section title="Certifications" accent={color}>
              {data.certifications.map((c, i) => (
                <div key={i}><strong>{c.name}</strong><div style={{ fontSize: '0.85em' }}>{c.issuer} · {c.year}</div></div>
              ))}
            </Section>
          )}
        </aside>
      </div>
    </div>
  );
}

// ============================================================================
// 4. MINIMAL — Très épuré, typographie soignée, beaucoup d'espace
// ============================================================================
export function MinimalCV({ data, color = '#222222' }) {
  const p = data.personal || {};
  return (
    <div className="cv cv-minimal" style={{ '--cv-accent': color }}>
      <header className="cv-minimal-head">
        <h1>{p.fullName || 'Votre Nom'}</h1>
        <div className="cv-minimal-title">{p.title || 'Votre poste'}</div>
        <div className="cv-minimal-contact">
          {p.email} {p.phone && <>· {p.phone}</>} {p.location && <>· {p.location}</>}
          {(p.linkedin || p.github) && <br />}
          {p.linkedin} {p.github && <>· {p.github}</>}
        </div>
      </header>

      {p.summary && <p className="cv-minimal-summary">{p.summary}</p>}

      {(data.experience || []).length > 0 && (
        <Section title="Expérience" color={color}>
          {data.experience.map((e, i) => (
            <div key={i} className="cv-entry cv-minimal-entry">
              <div className="cv-minimal-period">{e.period}</div>
              <div className="cv-minimal-content">
                <div><strong>{e.role}</strong> — {e.company}</div>
                {e.description && <p>{e.description}</p>}
                {(e.tasks || []).length > 0 && <ul>{e.tasks.map((t, j) => <li key={j}>{t}</li>)}</ul>}
              </div>
            </div>
          ))}
        </Section>
      )}

      {(data.education || []).length > 0 && (
        <Section title="Formation" color={color}>
          {data.education.map((e, i) => (
            <div key={i} className="cv-entry cv-minimal-entry">
              <div className="cv-minimal-period">{e.period}</div>
              <div className="cv-minimal-content">
                <div><strong>{e.degree}</strong> — {e.school}</div>
              </div>
            </div>
          ))}
        </Section>
      )}

      {(data.skills || []).length > 0 && (
        <Section title="Compétences" color={color}>
          {data.skills.map((s, i) => (
            <div key={i} className="cv-entry cv-minimal-entry">
              <div className="cv-minimal-period">{s.category}</div>
              <div className="cv-minimal-content">{(s.items || []).join(' · ')}</div>
            </div>
          ))}
        </Section>
      )}

      {(data.languages || []).length > 0 && (
        <Section title="Langues" color={color}>
          <div>{data.languages.map((l) => `${l.name} (${l.level})`).join(' · ')}</div>
        </Section>
      )}
    </div>
  );
}

// ============================================================================
// 5. TECH — Style monospace pour développeurs (terminal vibes)
// ============================================================================
export function TechCV({ data, color = '#00d084' }) {
  const p = data.personal || {};
  return (
    <div className="cv cv-tech" style={{ '--cv-accent': color }}>
      <header className="cv-tech-head">
        <div className="cv-tech-prompt" style={{ color }}>$ whoami</div>
        <h1 style={{ color }}>{p.fullName || 'Votre Nom'}</h1>
        <div className="cv-tech-title">// {p.title || 'Votre poste'}</div>
        <div className="cv-tech-contact">
          {p.email && <div><span style={{ color }}>email</span> = "{p.email}"</div>}
          {p.phone && <div><span style={{ color }}>phone</span> = "{p.phone}"</div>}
          {p.location && <div><span style={{ color }}>location</span> = "{p.location}"</div>}
          {p.github && <div><span style={{ color }}>github</span> = "{p.github}"</div>}
          {p.linkedin && <div><span style={{ color }}>linkedin</span> = "{p.linkedin}"</div>}
        </div>
      </header>

      {p.summary && (
        <section className="cv-section">
          <h3 className="cv-tech-h" style={{ color }}># about</h3>
          <p>{p.summary}</p>
        </section>
      )}

      {(data.experience || []).length > 0 && (
        <section className="cv-section">
          <h3 className="cv-tech-h" style={{ color }}># experience</h3>
          {data.experience.map((e, i) => (
            <div key={i} className="cv-entry">
              <div className="cv-tech-job"><span style={{ color }}>▸</span> <strong>{e.role}</strong> @ {e.company} <span className="cv-tech-period">[{e.period}]</span></div>
              {e.description && <p style={{ paddingLeft: '1em' }}>{e.description}</p>}
              {(e.tasks || []).length > 0 && (
                <ul style={{ paddingLeft: '2em' }}>{e.tasks.map((t, j) => <li key={j}>{t}</li>)}</ul>
              )}
            </div>
          ))}
        </section>
      )}

      {(data.skills || []).length > 0 && (
        <section className="cv-section">
          <h3 className="cv-tech-h" style={{ color }}># tech_stack</h3>
          {data.skills.map((s, i) => (
            <div key={i}><span style={{ color }}>{s.category}:</span> [{(s.items || []).map((x) => `"${x}"`).join(', ')}]</div>
          ))}
        </section>
      )}

      {(data.education || []).length > 0 && (
        <section className="cv-section">
          <h3 className="cv-tech-h" style={{ color }}># education</h3>
          {data.education.map((e, i) => (
            <div key={i} className="cv-entry">
              <div><span style={{ color }}>▸</span> <strong>{e.degree}</strong> — {e.school} <span className="cv-tech-period">[{e.period}]</span></div>
            </div>
          ))}
        </section>
      )}

      {(data.languages || []).length > 0 && (
        <section className="cv-section">
          <h3 className="cv-tech-h" style={{ color }}># languages</h3>
          {data.languages.map((l) => `${l.name}(${l.level})`).join(' · ')}
        </section>
      )}

      {(data.certifications || []).length > 0 && (
        <section className="cv-section">
          <h3 className="cv-tech-h" style={{ color }}># certifications</h3>
          {data.certifications.map((c, i) => (
            <div key={i}><span style={{ color }}>▸</span> {c.name} <span className="cv-tech-period">[{c.issuer}, {c.year}]</span></div>
          ))}
        </section>
      )}
    </div>
  );
}

export const TEMPLATES = [
  { id: 'modern',   name: 'Moderne',      description: 'Barre latérale colorée, design contemporain',     component: ModernCV,   defaultColor: '#c8a96e' },
  { id: 'classic',  name: 'Classique',    description: 'Sobre et professionnel, compatible ATS',          component: ClassicCV,  defaultColor: '#1a1a1a' },
  { id: 'creative', name: 'Créatif',      description: 'Header coloré, timeline visuelle',                 component: CreativeCV, defaultColor: '#e47c69' },
  { id: 'minimal',  name: 'Minimaliste',  description: 'Très épuré, beaucoup d\'espace',                   component: MinimalCV,  defaultColor: '#222222' },
  { id: 'tech',     name: 'Tech / Dev',   description: 'Style terminal pour développeurs',                 component: TechCV,     defaultColor: '#00d084' },
];
