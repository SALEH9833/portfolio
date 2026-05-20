import { createContext, useContext, useState, useEffect, useCallback } from 'react';

export const LOCALES = [
  { code: 'fr', label: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { code: 'en', label: 'English',  flag: '🇬🇧', dir: 'ltr' },
  { code: 'ar', label: 'العربية',  flag: '🇸🇦', dir: 'rtl' },
];

export const TRANSLATIONS = {
  fr: {
    nav: { home: 'Accueil', about: 'À propos', skills: 'Compétences', projects: 'Projets', experience: 'Expérience', contact: 'Contact', menu: 'Menu' },
    hero: {
      available: 'Disponible · Safi, Maroc',
      iAm: 'Je suis',
      typing: ['étudiant en Cybersécurité', 'développeur Full-Stack', 'passionné de Cryptographie', 'analyste de réseaux'],
      contactMe: 'Me contacter', seeProjects: 'Voir mes projets', buildCv: 'Créez votre CV pro',
      scroll: 'défiler', follow: 'Connectez-vous',
      cyber: { label: 'Cybersécurité', sub: 'DUT · 2è année' },
      stack: { label: 'Full-Stack', sub: 'MERN · PHP · Java' },
    },
    stats: {
      projects: 'Projets majeurs',    projectsSub: 'Full-stack & sécurité',
      languages: 'Langages maîtrisés', languagesSub: 'Java, Python, JS, PHP…',
      certification: 'Certification',  certificationSub: 'CCNA Cisco · 2025',
      spoken: 'Langues parlées',       spokenSub: 'AR · FR · EN',
    },
    about: {
      eyebrow: 'À propos',
      title1: 'Du Tchad au Maroc,', title2: 'une passion pour la sécurité.',
      info: { location: 'Localisation', email: 'Email', phone: 'Téléphone', license: 'Mobilité' },
      languages: 'Langues',
      strengths: 'Atouts', strengthsAccent: 'personnels',
      education: 'Formation', current: 'Actuel',
    },
    skills: {
      eyebrow: 'Compétences',
      title1: 'Le stack derrière', titleAccent: 'chaque ligne', title2: 'de code.',
      subtitle: 'De la cryptographie à l\'API REST sécurisée, voici les technologies que je maîtrise et avec lesquelles je construis.',
      techTitle: 'Technologies utilisées', certTitle: 'Certifications obtenues',
    },
    marquee: { title: 'Technologies' },
    projects: {
      eyebrow: 'Projets',
      title1: 'Des projets qui mêlent', titleAccent: 'code et sécurité.',
      subtitle: 'Chaque projet est une exploration — de la cryptanalyse à l\'API REST sécurisée, en passant par l\'analyse de graphes.',
      filter: 'Filtrer ·', all: 'Tous les projets', featured: '★ Projet phare',
      details: 'Voir les détails', source: 'Code source', empty: 'Aucun projet trouvé.',
      modal: { features: 'Fonctionnalités clés', stack: 'Stack technologique', github: 'Voir le code source' },
    },
    experience: {
      eyebrow: 'Expérience',
      title1: 'Un parcours', titleAccent: 'multi-culturel', title2: 'et progressif.',
      subtitle: 'Stages, projets académiques et expériences professionnelles qui ont forgé mes compétences.',
      current: 'En cours',
    },
    contact: {
      eyebrow: 'Contact',
      title1: 'Construisons quelque chose', title2: 'd\'ensemble', titleAccent: 'remarquable',
      titleFull1: 'Construisons quelque chose', titleFull2: 'ensemble.',
      subtitle: 'Je recherche un stage de 6 semaines en Cybersécurité ou Développement. Réponse sous 24 heures.',
      quote: '« Disponible et motivé pour intégrer une équipe qui mise sur la sécurité. »',
      info: { email: 'Email', phone: 'Téléphone', location: 'Localisation', github: 'GitHub' },
      available: 'Disponible immédiatement', availableSub: 'Ouvert aux opportunités de stage',
      form: {
        name: 'Nom complet', email: 'Email', subject: 'Sujet', message: 'Message',
        placeholderName: 'Votre nom', placeholderEmail: 'vous@exemple.com',
        placeholderSubject: 'Proposition de stage en Cybersécurité',
        placeholderMessage: 'Décrivez votre projet, votre entreprise, ou l\'opportunité...',
        send: 'Envoyer le message', sending: 'Envoi en cours…',
        sent: 'Message envoyé !', sentSub: 'Merci pour votre message. Je vous répondrai dans les',
        hours: '24 heures.', another: 'Envoyer un autre message',
        secure: '🔒 Vos données sont chiffrées et protégées · jamais partagées',
        errors: { min2: 'Minimum 2 caractères.', email: 'Email invalide.', min3: 'Minimum 3 caractères.', min10: 'Minimum 10 caractères.', generic: 'Une erreur est survenue. Réessayez.', validation: 'Veuillez corriger les erreurs.', tooMany: 'Trop de tentatives. Réessayez dans une heure.' },
      },
    },
    footer: {
      cta1: 'Prêt à', ctaAccent: 'collaborer', cta2: '?',
      ctaSub: 'Une opportunité de stage, un projet, ou simplement envie d\'échanger ? Écrivez-moi.',
      rights: 'Tous droits réservés', built: 'Conçu avec attention · Next.js · SSR · Sécurisé',
    },
    common: { cv: 'CV', download: 'Télécharger CV', loading: 'Chargement…' },
  },

  en: {
    nav: { home: 'Home', about: 'About', skills: 'Skills', projects: 'Projects', experience: 'Experience', contact: 'Contact', menu: 'Menu' },
    hero: {
      available: 'Available · Safi, Morocco',
      iAm: 'I am a',
      typing: ['Cybersecurity student', 'Full-Stack developer', 'Cryptography enthusiast', 'Network analyst'],
      contactMe: 'Contact me', seeProjects: 'See my projects', buildCv: 'Build your CV',
      scroll: 'scroll', follow: 'Connect',
      cyber: { label: 'Cybersecurity', sub: 'DUT · 2nd year' },
      stack: { label: 'Full-Stack', sub: 'MERN · PHP · Java' },
    },
    stats: {
      projects: 'Major projects',     projectsSub: 'Full-stack & security',
      languages: 'Languages mastered', languagesSub: 'Java, Python, JS, PHP…',
      certification: 'Certification',  certificationSub: 'CCNA Cisco · 2025',
      spoken: 'Spoken languages',      spokenSub: 'AR · FR · EN',
    },
    about: {
      eyebrow: 'About',
      title1: 'From Chad to Morocco,', title2: 'a passion for security.',
      info: { location: 'Location', email: 'Email', phone: 'Phone', license: 'Mobility' },
      languages: 'Languages',
      strengths: 'Personal', strengthsAccent: 'strengths',
      education: 'Education', current: 'Current',
    },
    skills: {
      eyebrow: 'Skills',
      title1: 'The stack behind', titleAccent: 'every line', title2: 'of code.',
      subtitle: 'From cryptography to secure REST APIs — here are the technologies I master and use to build.',
      techTitle: 'Technologies used', certTitle: 'Certifications earned',
    },
    marquee: { title: 'Technologies' },
    projects: {
      eyebrow: 'Projects',
      title1: 'Projects mixing', titleAccent: 'code and security.',
      subtitle: 'Each project is an exploration — from cryptanalysis to secure REST APIs, through graph analysis.',
      filter: 'Filter ·', all: 'All projects', featured: '★ Featured project',
      details: 'View details', source: 'Source code', empty: 'No projects found.',
      modal: { features: 'Key features', stack: 'Tech stack', github: 'View source code' },
    },
    experience: {
      eyebrow: 'Experience',
      title1: 'A', titleAccent: 'multi-cultural', title2: 'and progressive journey.',
      subtitle: 'Internships, academic projects and professional experiences that shaped my skills.',
      current: 'Current',
    },
    contact: {
      eyebrow: 'Contact',
      titleFull1: 'Let\'s build something', titleFull2: 'together.',
      titleAccent: 'remarkable',
      subtitle: 'I\'m looking for a 6-week internship in Cybersecurity or Development. Response within 24 hours.',
      quote: '"Available and motivated to join a team that values security."',
      info: { email: 'Email', phone: 'Phone', location: 'Location', github: 'GitHub' },
      available: 'Available immediately', availableSub: 'Open to internship opportunities',
      form: {
        name: 'Full name', email: 'Email', subject: 'Subject', message: 'Message',
        placeholderName: 'Your name', placeholderEmail: 'you@example.com',
        placeholderSubject: 'Cybersecurity internship proposal',
        placeholderMessage: 'Describe your project, company, or opportunity...',
        send: 'Send message', sending: 'Sending…',
        sent: 'Message sent!', sentSub: 'Thank you for your message. I will reply within',
        hours: '24 hours.', another: 'Send another message',
        secure: '🔒 Your data is encrypted and protected · never shared',
        errors: { min2: 'Minimum 2 characters.', email: 'Invalid email.', min3: 'Minimum 3 characters.', min10: 'Minimum 10 characters.', generic: 'An error occurred. Try again.', validation: 'Please fix the errors.', tooMany: 'Too many attempts. Try again in an hour.' },
      },
    },
    footer: {
      cta1: 'Ready to', ctaAccent: 'collaborate', cta2: '?',
      ctaSub: 'An internship opportunity, a project, or just want to chat? Write to me.',
      rights: 'All rights reserved', built: 'Crafted with care · Next.js · SSR · Secure',
    },
    common: { cv: 'CV', download: 'Download CV', loading: 'Loading…' },
  },

  ar: {
    nav: { home: 'الرئيسية', about: 'نبذة عني', skills: 'المهارات', projects: 'المشاريع', experience: 'الخبرة', contact: 'تواصل', menu: 'قائمة' },
    hero: {
      available: 'متاح · آسفي، المغرب',
      iAm: 'أنا',
      typing: ['طالب أمن سيبراني', 'مطور Full-Stack', 'شغوف بالتشفير', 'محلل شبكات'],
      contactMe: 'تواصل معي', seeProjects: 'مشاريعي', buildCv: 'أنشئ سيرتك',
      scroll: 'مرر', follow: 'تواصل',
      cyber: { label: 'الأمن السيبراني', sub: 'السنة الثانية' },
      stack: { label: 'Full-Stack', sub: 'MERN · PHP · Java' },
    },
    stats: {
      projects: 'مشاريع رئيسية',     projectsSub: 'Full-stack وأمن',
      languages: 'لغات برمجة',        languagesSub: 'Java, Python, JS, PHP…',
      certification: 'شهادة',          certificationSub: 'CCNA Cisco · 2025',
      spoken: 'لغات منطوقة',          spokenSub: 'AR · FR · EN',
    },
    about: {
      eyebrow: 'نبذة عني',
      title1: 'من تشاد إلى المغرب،', title2: 'شغف بالأمن السيبراني.',
      info: { location: 'الموقع', email: 'البريد', phone: 'الهاتف', license: 'النقل' },
      languages: 'اللغات',
      strengths: 'مهاراتي', strengthsAccent: 'الشخصية',
      education: 'التعليم', current: 'حالياً',
    },
    skills: {
      eyebrow: 'المهارات',
      title1: 'التقنيات وراء', titleAccent: 'كل سطر', title2: 'من الكود.',
      subtitle: 'من التشفير إلى REST API الآمنة — التقنيات التي أتقنها وأبني بها.',
      techTitle: 'التقنيات المستخدمة', certTitle: 'الشهادات',
    },
    marquee: { title: 'تقنيات' },
    projects: {
      eyebrow: 'المشاريع',
      title1: 'مشاريع تجمع بين', titleAccent: 'الكود والأمن.',
      subtitle: 'كل مشروع هو استكشاف — من تحليل الشيفرات إلى REST API الآمنة.',
      filter: 'تصفية ·', all: 'كل المشاريع', featured: '★ مشروع مميز',
      details: 'التفاصيل', source: 'الكود المصدري', empty: 'لا توجد مشاريع.',
      modal: { features: 'الميزات الرئيسية', stack: 'التقنيات', github: 'الكود على GitHub' },
    },
    experience: {
      eyebrow: 'الخبرة',
      title1: 'مسيرة', titleAccent: 'متعددة الثقافات', title2: 'وتقدمية.',
      subtitle: 'تدريبات ومشاريع أكاديمية وخبرات مهنية شكّلت مهاراتي.',
      current: 'حالياً',
    },
    contact: {
      eyebrow: 'تواصل',
      titleFull1: 'لنبنِ شيئاً', titleFull2: 'معاً.',
      titleAccent: 'استثنائياً',
      subtitle: 'أبحث عن تدريب لمدة 6 أسابيع في الأمن السيبراني أو التطوير. أرد خلال 24 ساعة.',
      quote: '« متاح ومتحمس للانضمام إلى فريق يضع الأمن في المقدمة. »',
      info: { email: 'البريد', phone: 'الهاتف', location: 'الموقع', github: 'GitHub' },
      available: 'متاح فوراً', availableSub: 'مفتوح لفرص التدريب',
      form: {
        name: 'الاسم الكامل', email: 'البريد', subject: 'الموضوع', message: 'الرسالة',
        placeholderName: 'اسمك', placeholderEmail: 'you@example.com',
        placeholderSubject: 'عرض تدريب في الأمن السيبراني',
        placeholderMessage: 'صف مشروعك أو شركتك...',
        send: 'إرسال الرسالة', sending: 'جارٍ الإرسال…',
        sent: 'تم الإرسال!', sentSub: 'شكراً لرسالتك. سأرد خلال',
        hours: '24 ساعة.', another: 'إرسال رسالة أخرى',
        secure: '🔒 بياناتك مشفرة ومحمية · لن تُشارك أبداً',
        errors: { min2: 'حرفان على الأقل.', email: 'بريد غير صالح.', min3: '3 أحرف على الأقل.', min10: '10 أحرف على الأقل.', generic: 'حدث خطأ. حاول مجدداً.', validation: 'يرجى تصحيح الأخطاء.', tooMany: 'محاولات كثيرة. أعد المحاولة بعد ساعة.' },
      },
    },
    footer: {
      cta1: 'مستعد', ctaAccent: 'للتعاون', cta2: '؟',
      ctaSub: 'فرصة تدريب، مشروع، أو محادثة؟ راسلني.',
      rights: 'جميع الحقوق محفوظة', built: 'بُني بعناية · Next.js · SSR · آمن',
    },
    common: { cv: 'السيرة', download: 'تحميل السيرة', loading: 'جارٍ التحميل…' },
  },
};

function get(obj, path, fallback = '') {
  return path.split('.').reduce((acc, k) => (acc && acc[k] !== undefined) ? acc[k] : undefined, obj) ?? fallback;
}

const I18nContext = createContext({ locale: 'fr', setLocale: () => {}, t: (k) => k, dir: 'ltr' });

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState('fr');

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('locale') : null;
    if (saved && LOCALES.find(l => l.code === saved)) {
      setLocaleState(saved);
    }
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const conf = LOCALES.find(l => l.code === locale) || LOCALES[0];
    document.documentElement.lang = locale;
    document.documentElement.dir  = conf.dir;
  }, [locale]);

  const setLocale = useCallback((code) => {
    setLocaleState(code);
    if (typeof window !== 'undefined') localStorage.setItem('locale', code);
  }, []);

  const t = useCallback((key, fallback) => {
    const v = get(TRANSLATIONS[locale] || TRANSLATIONS.fr, key);
    if (v !== undefined && v !== '') return v;
    return get(TRANSLATIONS.fr, key, fallback ?? key);
  }, [locale]);

  const dir = LOCALES.find(l => l.code === locale)?.dir || 'ltr';

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, dir }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);

export function pickLocale(value, locale = 'fr') {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    return value[locale] || value.fr || value.en || Object.values(value)[0] || '';
  }
  return String(value);
}
