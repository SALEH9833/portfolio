-- Production import: replace bootstrap defaults with real CV content
BEGIN;
TRUNCATE TABLE
  activities, certifications, languages, education,
  skills, skill_categories, strengths, tech_stack,
  projects, experience, profile
RESTART IDENTITY CASCADE;
--
-- PostgreSQL database dump
--



-- Dumped from database version 18.2
-- Dumped by pg_dump version 18.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: activities; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.activities (id, icon, title, description, year, display_order) VALUES (1, 'shield', '{"ar": "Club de Cybersécurité — EST Safi", "en": "Club de Cybersécurité — EST Safi", "fr": "Club de Cybersécurité — EST Safi"}', '{"ar": "Membre actif depuis 2025. Ateliers de sécurité, CTF et veille technologique.", "en": "Membre actif depuis 2025. Ateliers de sécurité, CTF et veille technologique.", "fr": "Membre actif depuis 2025. Ateliers de sécurité, CTF et veille technologique."}', '2025', 0);
INSERT INTO public.activities (id, icon, title, description, year, display_order) VALUES (2, 'mic', '{"ar": "Modérateur — Semaine d''Intégration", "en": "Modérateur — Semaine d''Intégration", "fr": "Modérateur — Semaine d''Intégration"}', '{"ar": "Modérateur langue arabe pour l''accueil des nouveaux étudiants de l''EST Safi.", "en": "Modérateur langue arabe pour l''accueil des nouveaux étudiants de l''EST Safi.", "fr": "Modérateur langue arabe pour l''accueil des nouveaux étudiants de l''EST Safi."}', '2025', 1);
INSERT INTO public.activities (id, icon, title, description, year, display_order) VALUES (3, 'music', '{"ar": "Guitariste — Club Musique", "en": "Guitariste — Club Musique", "fr": "Guitariste — Club Musique"}', '{"ar": "Membre du club musique de l''école. Pratique de la guitare.", "en": "Membre du club musique de l''école. Pratique de la guitare.", "fr": "Membre du club musique de l''école. Pratique de la guitare."}', '2024', 2);
INSERT INTO public.activities (id, icon, title, description, year, display_order) VALUES (4, 'users', '{"ar": "Club Social", "en": "Club Social", "fr": "Club Social"}', '{"ar": "Engagement associatif et vie de campus.", "en": "Engagement associatif et vie de campus.", "fr": "Engagement associatif et vie de campus."}', '2024', 3);


--
-- Data for Name: certifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.certifications (id, name, issuer, year, color, display_order) VALUES (1, 'CCNA — Introduction to Networks', 'Cisco', '2025', '#00bceb', 0);


--
-- Data for Name: education; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.education (id, degree, school, location, period, is_current, modules, display_order) VALUES (1, '{"ar": "DUT Informatique — Cybersécurité", "en": "DUT Informatique — Cybersécurité", "fr": "DUT Informatique — Cybersécurité"}', 'École Supérieure de Technologie', 'Safi, Maroc', 'Septembre 2025 — Avril 2026', true, '{"ar": ["Cryptologie", "Sécurité des Réseaux", "Administration Système", "Développement Orienté Objet (Java)", "Modélisation UML"], "en": ["Cryptologie", "Sécurité des Réseaux", "Administration Système", "Développement Orienté Objet (Java)", "Modélisation UML"], "fr": ["Cryptologie", "Sécurité des Réseaux", "Administration Système", "Développement Orienté Objet (Java)", "Modélisation UML"]}', 0);
INSERT INTO public.education (id, degree, school, location, period, is_current, modules, display_order) VALUES (2, '{"ar": "DUT Informatique — 1ère Année", "en": "DUT Informatique — 1ère Année", "fr": "DUT Informatique — 1ère Année"}', 'École Supérieure de Technologie', 'Safi, Maroc', 'Septembre 2024 — Juin 2025', false, '{"ar": ["Algorithmique", "Bases de données", "Réseaux", "Programmation Web", "Systèmes d''exploitation"], "en": ["Algorithmique", "Bases de données", "Réseaux", "Programmation Web", "Systèmes d''exploitation"], "fr": ["Algorithmique", "Bases de données", "Réseaux", "Programmation Web", "Systèmes d''exploitation"]}', 1);
INSERT INTO public.education (id, degree, school, location, period, is_current, modules, display_order) VALUES (3, '{"ar": "Baccalauréat Scientifique", "en": "Baccalauréat Scientifique", "fr": "Baccalauréat Scientifique"}', 'Lycée Porte d''Avenir', 'N''Djamena, Tchad', 'Octobre 2022 — Juin 2023', false, '{"ar": ["Mathématiques", "Physique-Chimie", "Sciences de l''Ingénieur"], "en": ["Mathématiques", "Physique-Chimie", "Sciences de l''Ingénieur"], "fr": ["Mathématiques", "Physique-Chimie", "Sciences de l''Ingénieur"]}', 2);


--
-- Data for Name: experience; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.experience (id, slug, role, company, location, period, type, is_current, description, tasks, color, display_order) VALUES (2, 'pfe', '{"ar": "Projet de Fin d''Études — Graph Analytics", "en": "Projet de Fin d''Études — Graph Analytics", "fr": "Projet de Fin d''Études — Graph Analytics"}', 'EST Safi', 'Safi, Maroc', 'Décembre 2025 — Mars 2026', 'Projet académique', false, '{"ar": "Étude et implémentation d''algorithmes de la bibliothèque Neo4j Graph Data Science (GDS) : PageRank, centralité et détection de communautés pour l''analyse de réseaux.", "en": "Étude et implémentation d''algorithmes de la bibliothèque Neo4j Graph Data Science (GDS) : PageRank, centralité et détection de communautés pour l''analyse de réseaux.", "fr": "Étude et implémentation d''algorithmes de la bibliothèque Neo4j Graph Data Science (GDS) : PageRank, centralité et détection de communautés pour l''analyse de réseaux."}', '{"ar": ["Étude des algorithmes Neo4j GDS (PageRank, Betweenness, Community Detection)", "Implémentation d''un système de détection de profils malveillants", "Visualisation interactive des graphes de réseau", "Rédaction du rapport technique et présentation orale"], "en": ["Étude des algorithmes Neo4j GDS (PageRank, Betweenness, Community Detection)", "Implémentation d''un système de détection de profils malveillants", "Visualisation interactive des graphes de réseau", "Rédaction du rapport technique et présentation orale"], "fr": ["Étude des algorithmes Neo4j GDS (PageRank, Betweenness, Community Detection)", "Implémentation d''un système de détection de profils malveillants", "Visualisation interactive des graphes de réseau", "Rédaction du rapport technique et présentation orale"]}', '#7c3aed', 1);
INSERT INTO public.experience (id, slug, role, company, location, period, type, is_current, description, tasks, color, display_order) VALUES (3, 'cimenterie', '{"ar": "Stagiaire Développement Applicatif", "en": "Stagiaire Développement Applicatif", "fr": "Stagiaire Développement Applicatif"}', 'Cimenterie de Safi', 'Safi, Maroc', 'Juillet 2025 — Août 2025', 'Stage', false, '{"ar": "Développement d''une application d''automatisation des billets d''invitation au restaurant d''entreprise.", "en": "Développement d''une application d''automatisation des billets d''invitation au restaurant d''entreprise.", "fr": "Développement d''une application d''automatisation des billets d''invitation au restaurant d''entreprise."}', '{"ar": ["Analyse des besoins et modélisation de la base de données", "Développement de la solution complète (PHP, MySQL)", "Tests et livraison de l''application", "Documentation technique"], "en": ["Analyse des besoins et modélisation de la base de données", "Développement de la solution complète (PHP, MySQL)", "Tests et livraison de l''application", "Documentation technique"], "fr": ["Analyse des besoins et modélisation de la base de données", "Développement de la solution complète (PHP, MySQL)", "Tests et livraison de l''application", "Documentation technique"]}', '#10b981', 2);
INSERT INTO public.experience (id, slug, role, company, location, period, type, is_current, description, tasks, color, display_order) VALUES (4, 'hybah-bakery', '{"ar": "Responsable & Caissier", "en": "Responsable & Caissier", "fr": "Responsable & Caissier"}', 'Boulangerie HYBAH', 'N''Djamena, Tchad', 'Février 2024 — Octobre 2024', 'Emploi', false, '{"ar": "Gestion de la relation client et de la caisse dans un environnement à rythme rapide.", "en": "Gestion de la relation client et de la caisse dans un environnement à rythme rapide.", "fr": "Gestion de la relation client et de la caisse dans un environnement à rythme rapide."}', '{"ar": ["Gestion de la relation client et prise de commandes", "Travail en équipe dans un environnement à rythme rapide", "Fiabilité, ponctualité et communication interpersonnelle"], "en": ["Gestion de la relation client et prise de commandes", "Travail en équipe dans un environnement à rythme rapide", "Fiabilité, ponctualité et communication interpersonnelle"], "fr": ["Gestion de la relation client et prise de commandes", "Travail en équipe dans un environnement à rythme rapide", "Fiabilité, ponctualité et communication interpersonnelle"]}', '#f59e0b', 3);
INSERT INTO public.experience (id, slug, role, company, location, period, type, is_current, description, tasks, color, display_order) VALUES (1, 'EST safi', '{"ar": "Stagiaire — Stage de 2ème Année", "en": "Stagiaire — Stage de 2ème Année", "fr": "Stagiaire — Stage de 2ème Année"}', 'Ecole Supérieure de Technologie de safi ', 'Safi, Maroc', 'Avril 2026 — Juin 2026', 'Stage', true, '{"ar": "Stage de fin de 2ème année DUT en cybersécurité.", "en": "Stage de fin de 2ème année DUT en cybersécurité.", "fr": "Stage de fin de 2ème année DUT en cybersécurité."}', '{"ar": ["Mission en cours — détails à compléter", "Application des connaissances en sécurité des systèmes d''information"], "en": ["Mission en cours — détails à compléter", "Application des connaissances en sécurité des systèmes d''information"], "fr": ["Mission en cours — détails à compléter", "Système de Gestion des Présences par la Carte RFID et la Reconnaissance Biométrique"]}', '#00d4ff', 0);


--
-- Data for Name: languages; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.languages (id, name, level, proficiency, flag, display_order) VALUES (1, 'Arabe', '{"ar": "Langue maternelle", "en": "Langue maternelle", "fr": "Langue maternelle"}', 100, '🇹🇩', 0);
INSERT INTO public.languages (id, name, level, proficiency, flag, display_order) VALUES (2, 'Français', '{"ar": "B2 — TCF : 412/699", "en": "B2 — TCF : 412/699", "fr": "B2 — TCF : 412/699"}', 72, '🇫🇷', 1);
INSERT INTO public.languages (id, name, level, proficiency, flag, display_order) VALUES (3, 'Anglais', '{"ar": "Intermédiaire (B1)", "en": "Intermédiaire (B1)", "fr": "Intermédiaire (B1)"}', 55, '🇬🇧', 2);


--
-- Data for Name: profile; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.profile (id, name, first_name, email, phone, location, birth, license, linkedin, github, photo_url, title, subtitle, tagline, bio, updated_at, whatsapp) VALUES (1, 'Saleh Mahamat Saleh', 'Saleh', 's.mahahatsaleh0043@uca.ac.ma', '+212 6 46 60 89 11', 'Safi, Maroc', '20 Février 2005', 'Permis B', 'https://linkedin.com/in/Saleh-Mahamat', 'https://github.com/SALEH9833', '/images/profile.jpeg', '{"ar": "Étudiant en Cybersécurité & Développeur Full-Stack", "en": "Étudiant en Cybersécurité & Développeur Full-Stack", "fr": "Étudiant en Cybersécurité & Développeur Full-Stack"}', '{"ar": "DUT 2ème Année • Spécialisation Cybersécurité • EST Safi", "en": "DUT 2ème Année • Spécialisation Cybersécurité • EST Safi", "fr": "DUT 2ème Année • Spécialisation Cybersécurité • EST Safi"}', '{"ar": "Construire des systèmes sûrs, du code propre, et des solutions qui durent.", "en": "Construire des systèmes sûrs, du code propre, et des solutions qui durent.", "fr": "Construire des systèmes sûrs, du code propre, et des solutions qui durent."}', '{"ar": "Passionné par la sécurité des systèmes d''information, je développe mes compétences en cryptologie et en administration réseau tout en consolidant une solide expérience en développement full-stack. Curieux, rigoureux et orienté solutions, je suis prêt à relever les défis de la cybersécurité moderne.", "en": "Passionné par la sécurité des systèmes d''information, je développe mes compétences en cryptologie et en administration réseau tout en consolidant une solide expérience en développement full-stack. Curieux, rigoureux et orienté solutions, je suis prêt à relever les défis de la cybersécurité moderne.", "fr": "Passionné par la sécurité des systèmes d''information, je développe mes compétences en cryptologie et en administration réseau tout en consolidant une solide expérience en développement full-stack. Curieux, rigoureux et orienté solutions, je suis prêt à relever les défis de la cybersécurité moderne."}', '2026-05-18 23:31:26.267352+02', '+235 60935774');


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.projects (id, slug, title, subtitle, description, long_description, category, highlights, tech, color, icon, github_url, featured, display_order, created_at, updated_at) VALUES (1, 'graphsense', 'GraphSense', '{"ar": "Système d''Analyse Topologique de Réseaux Malveillants", "en": "Système d''Analyse Topologique de Réseaux Malveillants", "fr": "Système d''Analyse Topologique de Réseaux Malveillants"}', '{"ar": "Application web pour la détection de profils malveillants via Neo4j Graph Data Science. Utilise des algorithmes de théorie des graphes pour identifier les Botmasters et les points de propagation de malwares.", "en": "Application web pour la détection de profils malveillants via Neo4j Graph Data Science. Utilise des algorithmes de théorie des graphes pour identifier les Botmasters et les points de propagation de malwares.", "fr": "Application web pour la détection de profils malveillants via Neo4j Graph Data Science. Utilise des algorithmes de théorie des graphes pour identifier les Botmasters et les points de propagation de malwares."}', '{"ar": "GraphSense est un système d''analyse topologique basé sur Neo4j GDS qui exploite les propriétés mathématiques des graphes pour détecter automatiquement les nœuds malveillants dans un réseau. Le module PageRank identifie les Botmasters (nœuds à haute autorité), tandis que le module Betweenness Centrality repère les points de propagation critiques. Un indicateur de dangerosité transforme les scores mathématiques bruts en niveaux de menace lisibles (Low / Medium / High).", "en": "GraphSense est un système d''analyse topologique basé sur Neo4j GDS qui exploite les propriétés mathématiques des graphes pour détecter automatiquement les nœuds malveillants dans un réseau. Le module PageRank identifie les Botmasters (nœuds à haute autorité), tandis que le module Betweenness Centrality repère les points de propagation critiques. Un indicateur de dangerosité transforme les scores mathématiques bruts en niveaux de menace lisibles (Low / Medium / High).", "fr": "GraphSense est un système d''analyse topologique basé sur Neo4j GDS qui exploite les propriétés mathématiques des graphes pour détecter automatiquement les nœuds malveillants dans un réseau. Le module PageRank identifie les Botmasters (nœuds à haute autorité), tandis que le module Betweenness Centrality repère les points de propagation critiques. Un indicateur de dangerosité transforme les scores mathématiques bruts en niveaux de menace lisibles (Low / Medium / High)."}', 'Cybersécurité', '{"ar": ["Module PageRank pour identifier les Botmasters", "Module Betweenness pour détecter les points de propagation", "Indicateur de dangerosité (Low / Medium / High)", "Visualisation interactive du graphe de réseau"], "en": ["Module PageRank pour identifier les Botmasters", "Module Betweenness pour détecter les points de propagation", "Indicateur de dangerosité (Low / Medium / High)", "Visualisation interactive du graphe de réseau"], "fr": ["Module PageRank pour identifier les Botmasters", "Module Betweenness pour détecter les points de propagation", "Indicateur de dangerosité (Low / Medium / High)", "Visualisation interactive du graphe de réseau"]}', '{Neo4j,Python,JavaScript,"Graph Data Science",PageRank,Betweenness}', '#00d4ff', 'network', 'https://github.com/SALEH9833', true, 0, '2026-05-18 01:37:59.84243+02', '2026-05-18 01:37:59.84243+02');
INSERT INTO public.projects (id, slug, title, subtitle, description, long_description, category, highlights, tech, color, icon, github_url, featured, display_order, created_at, updated_at) VALUES (2, 'cryptolab', 'CryptoLab', '{"ar": "Laboratoire de Cryptanalyse Pédagogique", "en": "Laboratoire de Cryptanalyse Pédagogique", "fr": "Laboratoire de Cryptanalyse Pédagogique"}', '{"ar": "Application web démonstractive des failles du chiffrement César via une attaque par analyse fréquentielle, avec comparaison à l''AES moderne.", "en": "Application web démonstractive des failles du chiffrement César via une attaque par analyse fréquentielle, avec comparaison à l''AES moderne.", "fr": "Application web démonstractive des failles du chiffrement César via une attaque par analyse fréquentielle, avec comparaison à l''AES moderne."}', '{"ar": "CryptoLab est un outil pédagogique interactif qui visualise les vulnérabilités du chiffrement par substitution monoalphabétique. L''application effectue une attaque par analyse fréquentielle en temps réel, représentée par des graphiques dynamiques. Une comparaison côte-à-côte avec l''AES-256 démontre l''évolution de la cryptographie moderne et illustre pourquoi les chiffrements classiques sont obsolètes face aux attaques statistiques.", "en": "CryptoLab est un outil pédagogique interactif qui visualise les vulnérabilités du chiffrement par substitution monoalphabétique. L''application effectue une attaque par analyse fréquentielle en temps réel, représentée par des graphiques dynamiques. Une comparaison côte-à-côte avec l''AES-256 démontre l''évolution de la cryptographie moderne et illustre pourquoi les chiffrements classiques sont obsolètes face aux attaques statistiques.", "fr": "CryptoLab est un outil pédagogique interactif qui visualise les vulnérabilités du chiffrement par substitution monoalphabétique. L''application effectue une attaque par analyse fréquentielle en temps réel, représentée par des graphiques dynamiques. Une comparaison côte-à-côte avec l''AES-256 démontre l''évolution de la cryptographie moderne et illustre pourquoi les chiffrements classiques sont obsolètes face aux attaques statistiques."}', 'Cryptographie', '{"ar": ["Attaque par analyse fréquentielle visualisée", "Graphiques dynamiques en temps réel", "Comparaison César vs AES-256", "Interface pédagogique interactive"], "en": ["Attaque par analyse fréquentielle visualisée", "Graphiques dynamiques en temps réel", "Comparaison César vs AES-256", "Interface pédagogique interactive"], "fr": ["Attaque par analyse fréquentielle visualisée", "Graphiques dynamiques en temps réel", "Comparaison César vs AES-256", "Interface pédagogique interactive"]}', '{PHP,JavaScript,HTML/CSS,Chart.js,"Analyse fréquentielle",AES}', '#7c3aed', 'lock', 'https://github.com/SALEH9833', true, 1, '2026-05-18 01:37:59.860241+02', '2026-05-18 01:37:59.860241+02');
INSERT INTO public.projects (id, slug, title, subtitle, description, long_description, category, highlights, tech, color, icon, github_url, featured, display_order, created_at, updated_at) VALUES (3, 'hybah', 'HYBAH Coffee House', '{"ar": "Application Web Full-Stack de Réservation", "en": "Application Web Full-Stack de Réservation", "fr": "Application Web Full-Stack de Réservation"}', '{"ar": "Application MERN complète permettant aux clients de réserver des salles et commander des gâteaux, avec authentification JWT et paiement Stripe.", "en": "Application MERN complète permettant aux clients de réserver des salles et commander des gâteaux, avec authentification JWT et paiement Stripe.", "fr": "Application MERN complète permettant aux clients de réserver des salles et commander des gâteaux, avec authentification JWT et paiement Stripe."}', '{"ar": "HYBAH Coffee House est une application web full-stack construite sur la stack MERN (MongoDB, Express, React, Node.js). Elle intègre un système d''authentification sécurisé par JWT avec protection des routes, un module de réservation dynamique avec vérification de disponibilité en temps réel, une tarification automatique basée sur la durée, et l''API Stripe pour la gestion des acomptes. L''interface React est entièrement responsive et optimisée pour mobile.", "en": "HYBAH Coffee House est une application web full-stack construite sur la stack MERN (MongoDB, Express, React, Node.js). Elle intègre un système d''authentification sécurisé par JWT avec protection des routes, un module de réservation dynamique avec vérification de disponibilité en temps réel, une tarification automatique basée sur la durée, et l''API Stripe pour la gestion des acomptes. L''interface React est entièrement responsive et optimisée pour mobile.", "fr": "HYBAH Coffee House est une application web full-stack construite sur la stack MERN (MongoDB, Express, React, Node.js). Elle intègre un système d''authentification sécurisé par JWT avec protection des routes, un module de réservation dynamique avec vérification de disponibilité en temps réel, une tarification automatique basée sur la durée, et l''API Stripe pour la gestion des acomptes. L''interface React est entièrement responsive et optimisée pour mobile."}', 'Full-Stack', '{"ar": ["Authentification JWT avec protection des routes", "Réservation en temps réel avec vérification de disponibilité", "Paiement sécurisé via Stripe API", "Interface responsive React"], "en": ["Authentification JWT avec protection des routes", "Réservation en temps réel avec vérification de disponibilité", "Paiement sécurisé via Stripe API", "Interface responsive React"], "fr": ["Authentification JWT avec protection des routes", "Réservation en temps réel avec vérification de disponibilité", "Paiement sécurisé via Stripe API", "Interface responsive React"]}', '{React.js,Node.js,Express,MongoDB,JWT,Stripe,Mongoose}', '#f59e0b', 'coffee', 'https://github.com/SALEH9833', true, 2, '2026-05-18 01:37:59.869148+02', '2026-05-18 01:37:59.869148+02');


--
-- Data for Name: skill_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.skill_categories (id, name, icon, color, display_order) VALUES (1, '{"ar": "Sécurité & Réseaux", "en": "Sécurité & Réseaux", "fr": "Sécurité & Réseaux"}', 'shield', '#00d4ff', 0);
INSERT INTO public.skill_categories (id, name, icon, color, display_order) VALUES (2, '{"ar": "Développement", "en": "Développement", "fr": "Développement"}', 'code', '#7c3aed', 1);
INSERT INTO public.skill_categories (id, name, icon, color, display_order) VALUES (3, '{"ar": "Bases de Données", "en": "Bases de Données", "fr": "Bases de Données"}', 'database', '#10b981', 2);
INSERT INTO public.skill_categories (id, name, icon, color, display_order) VALUES (4, '{"ar": "Outils & Méthodes", "en": "Outils & Méthodes", "fr": "Outils & Méthodes"}', 'tool', '#f59e0b', 3);


--
-- Data for Name: skills; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.skills (id, category_id, name, level, display_order) VALUES (1, 1, 'Sécurité des SI', 75, 0);
INSERT INTO public.skills (id, category_id, name, level, display_order) VALUES (2, 1, 'Cryptographie', 70, 1);
INSERT INTO public.skills (id, category_id, name, level, display_order) VALUES (3, 1, 'Administration Réseau', 60, 2);
INSERT INTO public.skills (id, category_id, name, level, display_order) VALUES (4, 1, 'CCNA (Intro Networks)', 65, 3);
INSERT INTO public.skills (id, category_id, name, level, display_order) VALUES (5, 1, 'Kali Linux / Pentest', 55, 4);
INSERT INTO public.skills (id, category_id, name, level, display_order) VALUES (6, 2, 'JavaScript / React', 80, 0);
INSERT INTO public.skills (id, category_id, name, level, display_order) VALUES (7, 2, 'Node.js / Express', 75, 1);
INSERT INTO public.skills (id, category_id, name, level, display_order) VALUES (8, 2, 'PHP', 70, 2);
INSERT INTO public.skills (id, category_id, name, level, display_order) VALUES (9, 2, 'Java', 65, 3);
INSERT INTO public.skills (id, category_id, name, level, display_order) VALUES (10, 2, 'Python', 65, 4);
INSERT INTO public.skills (id, category_id, name, level, display_order) VALUES (11, 2, 'C / Assembleur', 50, 5);
INSERT INTO public.skills (id, category_id, name, level, display_order) VALUES (12, 3, 'MySQL', 75, 0);
INSERT INTO public.skills (id, category_id, name, level, display_order) VALUES (13, 3, 'PostgreSQL', 65, 1);
INSERT INTO public.skills (id, category_id, name, level, display_order) VALUES (14, 3, 'MongoDB', 70, 2);
INSERT INTO public.skills (id, category_id, name, level, display_order) VALUES (15, 3, 'Neo4j', 60, 3);
INSERT INTO public.skills (id, category_id, name, level, display_order) VALUES (16, 4, 'Git / GitHub', 80, 0);
INSERT INTO public.skills (id, category_id, name, level, display_order) VALUES (17, 4, 'Linux (Ubuntu / Kali)', 70, 1);
INSERT INTO public.skills (id, category_id, name, level, display_order) VALUES (18, 4, 'UML & Modélisation', 65, 2);
INSERT INTO public.skills (id, category_id, name, level, display_order) VALUES (19, 4, 'Docker (bases)', 40, 3);


--
-- Data for Name: strengths; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.strengths (id, icon, title, description, display_order) VALUES (1, 'shield', '{"ar": "Passionné de Cybersécurité", "en": "Passionné de Cybersécurité", "fr": "Passionné de Cybersécurité"}', '{"ar": "Veille constante sur les nouvelles menaces, membre actif du club Cyber de l''EST Safi.", "en": "Veille constante sur les nouvelles menaces, membre actif du club Cyber de l''EST Safi.", "fr": "Veille constante sur les nouvelles menaces, membre actif du club Cyber de l''EST Safi."}', 0);
INSERT INTO public.strengths (id, icon, title, description, display_order) VALUES (2, 'users', '{"ar": "Excellent Relationnel", "en": "Excellent Relationnel", "fr": "Excellent Relationnel"}', '{"ar": "Développé au contact des clients et au sein de diverses équipes multi-culturelles.", "en": "Développé au contact des clients et au sein de diverses équipes multi-culturelles.", "fr": "Développé au contact des clients et au sein de diverses équipes multi-culturelles."}', 1);
INSERT INTO public.strengths (id, icon, title, description, display_order) VALUES (3, 'zap', '{"ar": "Autonome & Rigoureux", "en": "Autonome & Rigoureux", "fr": "Autonome & Rigoureux"}', '{"ar": "Capable de mener un projet de l''analyse du besoin jusqu''à la livraison finale.", "en": "Capable de mener un projet de l''analyse du besoin jusqu''à la livraison finale.", "fr": "Capable de mener un projet de l''analyse du besoin jusqu''à la livraison finale."}', 2);
INSERT INTO public.strengths (id, icon, title, description, display_order) VALUES (4, 'book-open', '{"ar": "Apprentissage Rapide", "en": "Apprentissage Rapide", "fr": "Apprentissage Rapide"}', '{"ar": "Curiosité technique qui me pousse à explorer constamment de nouvelles technologies.", "en": "Curiosité technique qui me pousse à explorer constamment de nouvelles technologies.", "fr": "Curiosité technique qui me pousse à explorer constamment de nouvelles technologies."}', 3);


--
-- Data for Name: tech_stack; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.tech_stack (id, name, icon, display_order) VALUES (1, 'React', '⚛️', 0);
INSERT INTO public.tech_stack (id, name, icon, display_order) VALUES (2, 'Node.js', '🟢', 1);
INSERT INTO public.tech_stack (id, name, icon, display_order) VALUES (3, 'MongoDB', '🍃', 2);
INSERT INTO public.tech_stack (id, name, icon, display_order) VALUES (4, 'Neo4j', '🔗', 3);
INSERT INTO public.tech_stack (id, name, icon, display_order) VALUES (5, 'MySQL', '🐬', 4);
INSERT INTO public.tech_stack (id, name, icon, display_order) VALUES (6, 'Python', '🐍', 5);
INSERT INTO public.tech_stack (id, name, icon, display_order) VALUES (7, 'Java', '☕', 6);
INSERT INTO public.tech_stack (id, name, icon, display_order) VALUES (8, 'PHP', '🐘', 7);
INSERT INTO public.tech_stack (id, name, icon, display_order) VALUES (9, 'Git', '🔧', 8);
INSERT INTO public.tech_stack (id, name, icon, display_order) VALUES (10, 'Linux', '🐧', 9);
INSERT INTO public.tech_stack (id, name, icon, display_order) VALUES (11, 'Kali', '🛡️', 10);
INSERT INTO public.tech_stack (id, name, icon, display_order) VALUES (12, 'Stripe', '💳', 11);


--
-- Name: activities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.activities_id_seq', 4, true);


--
-- Name: certifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.certifications_id_seq', 1, true);


--
-- Name: education_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.education_id_seq', 3, true);


--
-- Name: experience_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.experience_id_seq', 4, true);


--
-- Name: languages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.languages_id_seq', 3, true);


--
-- Name: profile_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.profile_id_seq', 1, true);


--
-- Name: projects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.projects_id_seq', 3, true);


--
-- Name: skill_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.skill_categories_id_seq', 4, true);


--
-- Name: skills_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.skills_id_seq', 19, true);


--
-- Name: strengths_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.strengths_id_seq', 4, true);


--
-- Name: tech_stack_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tech_stack_id_seq', 12, true);


--
-- PostgreSQL database dump complete
--




-- Restore search_path (pg_dump set it to empty earlier in this script)
SET search_path = public, pg_catalog;

-- Reset sequences based on max(id)
SELECT setval(pg_get_serial_sequence('public.profile','id'), COALESCE((SELECT MAX(id) FROM public.profile),1));
SELECT setval(pg_get_serial_sequence('public.experience','id'), COALESCE((SELECT MAX(id) FROM public.experience),1));
SELECT setval(pg_get_serial_sequence('public.projects','id'), COALESCE((SELECT MAX(id) FROM public.projects),1));
SELECT setval(pg_get_serial_sequence('public.skill_categories','id'), COALESCE((SELECT MAX(id) FROM public.skill_categories),1));
SELECT setval(pg_get_serial_sequence('public.skills','id'), COALESCE((SELECT MAX(id) FROM public.skills),1));
SELECT setval(pg_get_serial_sequence('public.education','id'), COALESCE((SELECT MAX(id) FROM public.education),1));
SELECT setval(pg_get_serial_sequence('public.languages','id'), COALESCE((SELECT MAX(id) FROM public.languages),1));
SELECT setval(pg_get_serial_sequence('public.certifications','id'), COALESCE((SELECT MAX(id) FROM public.certifications),1));
SELECT setval(pg_get_serial_sequence('public.activities','id'), COALESCE((SELECT MAX(id) FROM public.activities),1));
SELECT setval(pg_get_serial_sequence('public.strengths','id'), COALESCE((SELECT MAX(id) FROM public.strengths),1));
SELECT setval(pg_get_serial_sequence('public.tech_stack','id'), COALESCE((SELECT MAX(id) FROM public.tech_stack),1));

COMMIT;
