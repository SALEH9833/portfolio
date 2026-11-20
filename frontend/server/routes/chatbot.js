const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { query } = require('../db');

const AI_ENABLED = !!process.env.ANTHROPIC_API_KEY;
let aiClient = null;
if (AI_ENABLED) {
  const Anthropic = require('@anthropic-ai/sdk');
  aiClient = new Anthropic();
  console.log('[Chatbot] Claude API enabled (model: claude-opus-4-7)');
} else {
  console.log('[Chatbot] No ANTHROPIC_API_KEY — running intent-based fallback');
}

const MODEL = 'claude-opus-4-7';
const MAX_TOKENS = 1024;

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de messages. Patientez une minute.' },
});

// ============================================================================
// Portfolio context (cached 5 min)
// ============================================================================
let cachedCtx = null;
let cachedAt = 0;
const CTX_TTL_MS = 5 * 60 * 1000;

async function loadPortfolioContext() {
  if (cachedCtx && Date.now() - cachedAt < CTX_TTL_MS) return cachedCtx;

  const [
    { rows: pRows },
    { rows: langs },
    { rows: strengths },
    { rows: projects },
    { rows: cats },
    { rows: certs },
    { rows: exp },
    { rows: edu },
    { rows: activities },
  ] = await Promise.all([
    query('SELECT * FROM profile LIMIT 1'),
    query('SELECT name, level, proficiency, flag FROM languages ORDER BY display_order'),
    query('SELECT icon, title, description FROM strengths ORDER BY display_order'),
    query('SELECT slug, title, subtitle, description, category, tech, github_url, featured FROM projects ORDER BY display_order'),
    query('SELECT id, name FROM skill_categories ORDER BY display_order'),
    query('SELECT name, issuer, year FROM certifications ORDER BY display_order'),
    query('SELECT role, company, location, period, type, is_current, description FROM experience ORDER BY display_order'),
    query('SELECT degree, school, location, period, is_current FROM education ORDER BY display_order'),
    query('SELECT title, description, year FROM activities ORDER BY display_order'),
  ]);

  for (const c of cats) {
    const { rows: items } = await query(
      'SELECT name, level FROM skills WHERE category_id = $1 ORDER BY display_order',
      [c.id]
    );
    c.skills = items;
  }

  cachedCtx = {
    profile: pRows[0],
    languages: langs,
    strengths,
    projects,
    skillCategories: cats,
    certifications: certs,
    experience: exp,
    education: edu,
    activities,
  };
  cachedAt = Date.now();
  return cachedCtx;
}

const L = (v, locale = 'fr') => {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object') return v[locale] || v.fr || v.en || Object.values(v)[0] || '';
  return String(v);
};

// ============================================================================
// System prompt builder (cached via cache_control)
// ============================================================================
function buildSystemPrompt(ctx, locale) {
  const p = ctx.profile;

  const langStr = ctx.languages
    .map((l) => `${l.flag || ''} ${l.name} (${L(l.level, locale)}, ${l.proficiency}%)`)
    .join(' · ');

  const strengthsStr = ctx.strengths
    .map((s) => `- **${L(s.title, locale)}**: ${L(s.description, locale)}`)
    .join('\n');

  const skillsStr = ctx.skillCategories
    .map((c) => {
      const items = (c.skills || []).map((s) => `${s.name} (${s.level}%)`).join(', ');
      return `**${L(c.name, locale)}**: ${items}`;
    })
    .join('\n');

  const certsStr =
    ctx.certifications.map((c) => `${c.name} (${c.issuer}, ${c.year})`).join(' · ') || 'None';

  const projectsStr = ctx.projects
    .map(
      (pr) =>
        `### ${pr.title}${pr.featured ? ' ★' : ''} — ${pr.category}
${L(pr.subtitle, locale)}
${L(pr.description, locale)}
Tech: ${(pr.tech || []).join(', ')}
GitHub: ${pr.github_url || 'N/A'}`
    )
    .join('\n\n');

  const expStr = ctx.experience
    .map(
      (e) =>
        `- **${L(e.role, locale)}** @ ${e.company} (${e.period}, ${e.type})${
          e.is_current ? ' [en cours]' : ''
        } — ${L(e.description, locale)}`
    )
    .join('\n');

  const eduStr = ctx.education
    .map(
      (e) =>
        `- **${L(e.degree, locale)}** — ${e.school}, ${e.location} (${e.period})${
          e.is_current ? ' [en cours]' : ''
        }`
    )
    .join('\n');

  const actStr = ctx.activities
    .map((a) => `- ${L(a.title, locale)} (${a.year}) — ${L(a.description, locale)}`)
    .join('\n');

  const langInstr = {
    fr: "RÈGLE LANGUE: Tu réponds TOUJOURS en français, peu importe la langue de l'utilisateur.",
    en: "LANGUAGE RULE: Always respond in English, regardless of the user's input language.",
    ar: 'قاعدة اللغة: أجب دائماً بالعربية بغض النظر عن لغة المستخدم.',
  }[locale] || "Réponds en français.";

  return `Tu es l'assistant IA officiel du portfolio de Saleh Mahamat Saleh. Tu aides les visiteurs à découvrir son profil, son parcours, ses compétences et ses projets. Tu peux également envoyer des messages à Saleh via l'outil send_message_to_saleh.

${langInstr}

# Profil de Saleh
- Nom complet : ${p.name}
- Titre : ${L(p.title, locale)}
- Bio : ${L(p.bio, locale)}
- Email : ${p.email}
- Téléphone : ${p.phone}
- Localisation : ${p.location}
- Date de naissance : ${p.birth}
- Permis : ${p.license}
- GitHub : ${p.github}
- LinkedIn : ${p.linkedin}

# Langues parlées
${langStr}

# Atouts personnels
${strengthsStr}

# Compétences techniques
${skillsStr}

# Certifications
${certsStr}

# Formation
${eduStr}

# Expérience professionnelle
${expStr}

# Activités & engagements
${actStr}

# Projets réalisés
${projectsStr}

# Règles de comportement
1. **Concision** : 2-4 phrases en général. Plus long uniquement si l'utilisateur demande des détails approfondis.
2. **Honnêteté** : si l'info n'est pas dans le contexte ci-dessus, dis-le clairement. Ne JAMAIS inventer.
3. **Markdown léger** autorisé : **gras**, *italique*, listes avec - ou •.
4. **Ton** : chaleureux, professionnel, motivé. Tu parles de Saleh à la troisième personne (« il », « son »).
5. **Disponibilité** : Saleh recherche un stage de 6 semaines (Avril-Juin 2026) en Cybersécurité ou Développement.
6. **Outil send_message_to_saleh** : si un visiteur veut contacter Saleh via toi :
   - Demande poliment dans la conversation : son nom, son email, le sujet, et le message.
   - Tu peux les demander en une seule fois ou progressivement.
   - Une fois les 4 champs collectés, appelle l'outil send_message_to_saleh.
   - Confirme l'envoi à l'utilisateur en transmettant le message renvoyé par l'outil.
7. **Hors-sujet** : si la demande n'a rien à voir avec Saleh, redirige poliment.
8. **Pas d'emoji** sauf si l'utilisateur en utilise.`;
}

// ============================================================================
// Tool definition
// ============================================================================
const TOOLS = [
  {
    name: 'send_message_to_saleh',
    description:
      "Send a contact message to Saleh on behalf of a portfolio visitor. Use this ONLY after you have collected all four required fields (name, email, subject, message body) from the visitor through the conversation. The message will be saved to Saleh's inbox and emailed to him if email is configured.",
    input_schema: {
      type: 'object',
      properties: {
        from_name: {
          type: 'string',
          description: "Visitor's full name (must be explicitly provided by the visitor)",
        },
        from_email: {
          type: 'string',
          description: "Visitor's email address — Saleh will reply here. Must be a valid email.",
        },
        subject: {
          type: 'string',
          description: 'Short subject line (5-100 chars) summarizing the reason for contact',
        },
        message: {
          type: 'string',
          description: 'The full message body the visitor wants to send to Saleh',
        },
      },
      required: ['from_name', 'from_email', 'subject', 'message'],
    },
  },
];

// ============================================================================
// Tool executor
// ============================================================================
async function executeTool(name, input, req) {
  if (name !== 'send_message_to_saleh') {
    return { success: false, error: `Unknown tool: ${name}` };
  }

  const { from_name, from_email, subject, message } = input || {};
  if (!from_name || !from_email || !subject || !message) {
    return { success: false, error: 'Missing required fields (name, email, subject, message)' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(from_email)) {
    return { success: false, error: 'Invalid email format' };
  }

  const sani = (s) => String(s).slice(0, 2000).replace(/[<>]/g, '');
  const n = sani(from_name);
  const e = sani(from_email).toLowerCase();
  const s = sani(subject);
  const m = sani(message);

  try {
    await query(
      'INSERT INTO contact_messages (name, email, subject, message, ip_address, user_agent) VALUES ($1,$2,$3,$4,$5,$6)',
      [n, e, `[Chatbot] ${s}`, m, req.ip, (req.headers['user-agent'] || '').slice(0, 500)]
    );

    // Optional email
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS && !process.env.EMAIL_USER.startsWith('your_')) {
      try {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.EMAIL_PORT) || 587,
          secure: false,
          auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        });
        await transporter.sendMail({
          from: `"Portfolio Chatbot" <${process.env.EMAIL_USER}>`,
          to: process.env.EMAIL_TO || 'salehmhtsaleh224@gmail.com',
          replyTo: e,
          subject: `[Chatbot] ${s}`,
          text: `Message envoyé via le chatbot du portfolio.\n\nDe : ${n} <${e}>\nSujet : ${s}\n\n${m}`,
          html: `<div style="font-family:Arial;max-width:600px">
            <h2 style="color:#c8a96e">Nouveau message via le chatbot</h2>
            <p><strong>De :</strong> ${n}</p>
            <p><strong>Email :</strong> <a href="mailto:${e}">${e}</a></p>
            <p><strong>Sujet :</strong> ${s}</p>
            <hr style="border:none;border-top:1px solid #ddd"/>
            <p style="white-space:pre-wrap;line-height:1.6">${m}</p>
          </div>`,
        });
      } catch (err) {
        console.warn('[Chatbot] Email send failed:', err.message);
      }
    }

    return {
      success: true,
      message: `✅ Message bien transmis à Saleh ! Il répondra à ${e} dans les 24h.`,
    };
  } catch (err) {
    console.error('[Chatbot] Tool DB error:', err);
    return { success: false, error: 'Erreur lors de la sauvegarde du message' };
  }
}

// ============================================================================
// AI handler (Claude API + tool use loop + prompt caching)
// ============================================================================
async function handleAI(req, res, messages, locale) {
  const ctx = await loadPortfolioContext();
  const systemPrompt = buildSystemPrompt(ctx, locale);

  // Convert frontend messages to API format
  let convMessages = messages
    .map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: typeof m.content === 'string' ? m.content : m.text || '',
    }))
    .filter((m) => m.content);

  if (!convMessages.length) {
    return res.status(400).json({ error: 'Empty messages' });
  }

  // Ensure conversation starts with user
  while (convMessages.length && convMessages[0].role !== 'user') {
    convMessages.shift();
  }

  const toolsUsed = [];
  let finalResponse = null;
  let iterations = 0;
  const MAX_ITER = 5;

  while (iterations < MAX_ITER) {
    iterations++;

    const response = await aiClient.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      // Prompt caching: stable system prompt cached across requests
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' },
        },
      ],
      tools: TOOLS,
      messages: convMessages,
    });

    convMessages.push({ role: 'assistant', content: response.content });

    if (response.stop_reason === 'tool_use') {
      const results = [];
      for (const block of response.content) {
        if (block.type === 'tool_use') {
          const result = await executeTool(block.name, block.input, req);
          toolsUsed.push({
            name: block.name,
            success: result.success,
            label: result.success ? '📧 Message envoyé à Saleh' : `⚠ ${result.error}`,
          });
          results.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: JSON.stringify(result),
            is_error: !result.success,
          });
        }
      }
      convMessages.push({ role: 'user', content: results });
      continue;
    }

    finalResponse = response;
    break;
  }

  if (!finalResponse) {
    return res.json({
      success: true,
      text: "Désolé, j'ai dû m'arrêter — trop d'étapes. Reformule ta question.",
      toolsUsed,
    });
  }

  const text =
    finalResponse.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim() || '...';

  res.json({
    success: true,
    text,
    toolsUsed,
    usage: {
      input: finalResponse.usage.input_tokens,
      output: finalResponse.usage.output_tokens,
      cacheRead: finalResponse.usage.cache_read_input_tokens || 0,
      cacheWrite: finalResponse.usage.cache_creation_input_tokens || 0,
    },
  });
}

// ============================================================================
// Fallback intent-based handler (no API key needed)
// ============================================================================
const FALLBACK_TRANSLATIONS = {
  fr: {
    greeting: "Bonjour ! Je suis l'assistant de Saleh. Posez-moi une question sur son parcours, ses compétences ou ses projets.",
    notFound:
      "Je n'ai pas trouvé d'information précise. Essayez : « ses compétences », « ses projets », « son expérience », « comment le contacter ».",
    cantFetch: "Désolé, je ne peux pas accéder aux données pour le moment.",
    contactIntro: 'Vous pouvez contacter Saleh :',
    suggestions: [
      'Quelles sont ses compétences ?',
      'Quels projets a-t-il réalisés ?',
      'Comment le contacter ?',
      'Quelle est sa formation ?',
    ],
  },
  en: {
    greeting: "Hi! I'm Saleh's assistant. Ask me about his background, skills or projects.",
    notFound: "I couldn't find specific info. Try: « his skills », « his projects », « his experience », « how to contact him ».",
    cantFetch: "Sorry, I can't access the data right now.",
    contactIntro: 'You can reach Saleh:',
    suggestions: ['What are his skills?', 'What projects has he built?', 'How to contact him?', "What's his education?"],
  },
  ar: {
    greeting: 'مرحباً! أنا مساعد صالح. اسألني عن مساره، مهاراته أو مشاريعه.',
    notFound: 'لم أجد معلومة دقيقة. جرّب: «مهاراته»، «مشاريعه»، «خبرته»، «كيفية التواصل».',
    cantFetch: 'عذراً، لا أستطيع الوصول للبيانات الآن.',
    contactIntro: 'يمكنك التواصل مع صالح:',
    suggestions: ['ما هي مهاراته؟', 'ما هي مشاريعه؟', 'كيف أتواصل معه؟', 'ما هو تعليمه؟'],
  },
};

const PATTERNS = {
  greeting: /(\bbonjour|\bsalut|\bhi\b|\bhello|\bhey\b|مرحب|أهل)/i,
  contact: /(\bcontact|\bcontacter|\bemail|\bjoindre|\breach|\bphone|تواصل|اتصل)/i,
  skills: /(comp[ée]tence|\bskill|\btechno|maitrise|maîtrise|مهارات)/i,
  projects: /(\bprojet|\bproject|portfolio|r[ée]alisation|مشاري)/i,
  experience: /(exp[ée]rience|experience|\bstage|\bemploi|parcours|خبر)/i,
  education: /(formation|education|[ée]tude|diplôme|تعليم|دراسة)/i,
  languages: /(\blangue|\blanguage|\bparle|\bspeak|لغ[ةا])/i,
  whoIsSaleh: /(qui est saleh|who is saleh|من صالح|من هو)/i,
};

function detectIntent(msg) {
  const m = (msg || '').toLowerCase();
  for (const [intent, re] of Object.entries(PATTERNS)) if (re.test(m)) return intent;
  return null;
}

async function buildFallbackAnswer(intent, locale) {
  const T = FALLBACK_TRANSLATIONS[locale] || FALLBACK_TRANSLATIONS.fr;
  try {
    if (intent === 'greeting') return { text: T.greeting, suggestions: T.suggestions };
    const ctx = await loadPortfolioContext();
    const p = ctx.profile;
    if (intent === 'whoIsSaleh') {
      return { text: `${p.name} — ${L(p.title, locale)}. ${L(p.bio, locale)}` };
    }
    if (intent === 'contact') {
      return {
        text: `${T.contactIntro}\n📧 ${p.email}\n📞 ${p.phone}\n📍 ${p.location}\n💼 ${p.linkedin}\n🐙 ${p.github}`,
        suggestions: T.suggestions,
      };
    }
    if (intent === 'languages') {
      return {
        text: ctx.languages.map((l) => `${l.flag} ${l.name} — ${L(l.level, locale)} (${l.proficiency}%)`).join('\n'),
      };
    }
    if (intent === 'skills') {
      return {
        text: ctx.skillCategories
          .map((c) => `**${L(c.name, locale)}**: ${(c.skills || []).slice(0, 4).map((s) => s.name).join(', ')}`)
          .join('\n\n'),
      };
    }
    if (intent === 'projects') {
      return {
        text: ctx.projects.slice(0, 5).map((pr) => `• **${pr.title}** _(${pr.category})_`).join('\n'),
      };
    }
    if (intent === 'experience') {
      return {
        text: ctx.experience.slice(0, 5).map((e) => `• ${L(e.role, locale)} @ ${e.company} — ${e.period}`).join('\n'),
      };
    }
    if (intent === 'education') {
      return {
        text: ctx.education.map((e) => `• ${L(e.degree, locale)} — ${e.school} (${e.period})`).join('\n'),
      };
    }
  } catch (err) {
    return { text: (FALLBACK_TRANSLATIONS[locale] || FALLBACK_TRANSLATIONS.fr).cantFetch };
  }
  return { text: T.notFound, suggestions: T.suggestions };
}

async function handleFallback(req, res, messages, locale) {
  const last = messages[messages.length - 1];
  const userMsg = typeof last.content === 'string' ? last.content : last.text || '';
  const intent = detectIntent(userMsg);
  const ans = await buildFallbackAnswer(intent, locale);
  res.json({ success: true, text: ans.text, suggestions: ans.suggestions, toolsUsed: [] });
}

// ============================================================================
// Routes
// ============================================================================
router.post(
  '/',
  chatLimiter,
  body('messages').optional().isArray({ max: 50 }),
  body('message').optional().isLength({ min: 1, max: 1000 }),
  body('locale').optional().isIn(['fr', 'en', 'ar']),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ error: 'Invalid input' });

    const { messages, message, locale = 'fr' } = req.body;
    const msgs = Array.isArray(messages) && messages.length
      ? messages
      : message
      ? [{ role: 'user', content: message }]
      : [];

    if (!msgs.length) return res.status(400).json({ error: 'Empty input' });

    try {
      if (AI_ENABLED) return await handleAI(req, res, msgs, locale);
      return await handleFallback(req, res, msgs, locale);
    } catch (err) {
      console.error('[Chatbot] Handler error:', err.message);
      if (AI_ENABLED) {
        try {
          return await handleFallback(req, res, msgs, locale);
        } catch {
          /* fall through */
        }
      }
      return res.status(500).json({ error: 'Chatbot temporairement indisponible' });
    }
  }
);

router.get('/suggestions', (req, res) => {
  const locale = req.query.locale || 'fr';
  const T = FALLBACK_TRANSLATIONS[locale] || FALLBACK_TRANSLATIONS.fr;
  res.json({ success: true, greeting: T.greeting, suggestions: T.suggestions });
});

router.get('/status', (req, res) => {
  res.json({ aiEnabled: AI_ENABLED, model: AI_ENABLED ? MODEL : 'intent-fallback' });
});

module.exports = router;
