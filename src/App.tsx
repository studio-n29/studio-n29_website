import React, { useState, useEffect, useRef } from 'react';
import {
  Globe,
  Terminal as TerminalIcon,
  Sliders,
  Cpu,
  Layers,
  Compass,
  Clock,
  BookOpen,
  Sparkles,
  Laptop,
  Code,
  User,
  FolderGit2,
  Phone,
  ChevronDown,
  Wrench,
  CheckCircle,
  Network,
  Hourglass,
  HelpCircle,
  Save,
  Volume2
} from 'lucide-react';

type LanguageCode = 'en' | 'fr' | 'es' | 'nl';

interface SkillDetails {
  name: string;
  level: string;
  icon: string;
  statA: string;
  statB: string;
  quests: string[];
  loc: Record<LanguageCode, string>;
}

interface TerminalLine {
  type: 'command' | 'reply' | 'system' | 'error';
  sender?: string;
  text: string;
}

const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
  en: {
    nav_about: "/* 01_PLAYER_INFO */",
    nav_skills: "/* 02_SKILL_TREE */",
    nav_projects: "/* 03_QUEST_LOG */",
    nav_contact: "init_contact()",
    hero_status: "⚡ STATUS: SEARCHING FOR NEXT CHALLENGING QUEST",
    hero_salute: "<hello_world> I AM",
    hero_role: "Junior Freelance Developer",
    hero_quest: "Master all programming languages to construct outstanding interactive experiences.",
    btn_quests: "View Quest Log",
    btn_skills: "Inspect Skill Tree",
    about_heading: "01. PLAYER_INFO_HUD",
    about_subheading: "RETRIEVING PROFILE SYSTEM METADATA...",
    about_profile_class: "Level 25 Game Developer",
    about_philosoph_title: "Terminal Query Log",
    about_philosoph_text: "Continuous learning is my prime directive. Coding games teaches how to control complex states, which makes writing robust software second nature.",
    about_attributes_title: "SYSTEM_ATTRIBUTES",
    skills_heading: "02. MASTER_SKILL_TREE",
    skills_subheading: "Hover over or tap any orbital node in the skill matrix to trigger HUD updates & read compiled development profiles.",
    skills_default_status: "HUD STATUS: INITIALIZED",
    skills_default_title: "SYSTEMS OPERATIONAL",
    skills_default_desc: "Djason's active skillset has been compiled below. Select an orbital module node to initialize deep attribute readouts, analyze level parameters, and check quest affiliations.",
    skills_connected_label: "CONNECTED PROJECTS:",
    skills_reset_label: "[RESET CONSOLE]",
    skills_audio_label: "[AUDIO DRIVER LOADED]",
    skills_select_label: "SELECT A NODE",
    projects_heading: "03. COMPLETED_QUESTS",
    projects_subheading: "A detailed catalog of games and web-applications executed in indie workspaces.",
    contact_heading: "04. COOP_MULTIPLAYER_INIT",
    contact_subheading: "Acquire a dedicated developer. Fill in standard telemetry parameters below or query system files directly.",
    form_title: "Telemetry Stream",
    label_name: "Sender Name",
    label_email: "E-Mail Endpoint",
    label_desc: "Quest Description",
    btn_transmit: "transmit_data()",
    db_title: "AI DATABASE CALIBRATION PANEL",
    db_subtitle: "Modify these fields to train your terminal's live Google Gemini responses!",
    db_save_btn: "SAVE_CALIBRATION()",
    lbl_q1: "1. Preferred Mission Type / Contract Preference?",
    lbl_q2: "2. Pricing/Daily Rate (TJM)?",
    lbl_q3: "3. Favorite game & inspiration?",
    lbl_q4: "4. Active Freelance Availability?",
    lbl_q5: "5. What unique problem have you solved recently in your engines?",
    footer_text_tech: "Constructed with extreme performance rules, clean syntaxes, and zero coffee memory leaks."
  },
  fr: {
    nav_about: "/* 01_PLAYER_INFO */",
    nav_skills: "/* 02_SKILL_TREE */",
    nav_projects: "/* 03_QUEST_LOG */",
    nav_contact: "init_contact()",
    hero_status: "⚡ STATUT : EN RECHERCHE DE NOUVELLE QUÊTE",
    hero_salute: "<hello_world> JE SUIS",
    hero_role: "Développeur Freelance Junior",
    hero_quest: "Maîtriser tous les langages de programmation pour créer des expériences interactives d'exception.",
    btn_quests: "Journal des quêtes",
    btn_skills: "Inspecter l'arbre",
    about_heading: "01. HUD_INFOS_JOUEUR",
    about_subheading: "RÉCUPÉRATION DES MÉTADONNÉES DE PROFIL...",
    about_profile_class: "Développeur de Jeux - Niveau 25",
    about_philosoph_title: "Journal des requêtes terminal",
    about_philosoph_text: "L'apprentissage continu est ma directive première. Coder des jeux apprend à gérer des états complexes, rendant la création d'applications logicielles naturelle.",
    about_attributes_title: "ATTRIBUTS_SYSTÈME",
    skills_heading: "02. ARBRE_DES_COMPÉTENCES",
    skills_subheading: "Survolez ou cliquez sur les nœuds orbitaux de la matrice pour actualiser le HUD de compétences.",
    skills_default_status: "HUD STATUS : ACTIF",
    skills_default_title: "SYSTÈMES OPÉRATIONNELS",
    skills_default_desc: "L'ensemble des compétences de Djason a été compilé. Sélectionnez un nœud pour afficher le niveau d'attribut, les paramètres d'analyse et les projets associés.",
    skills_connected_label: "PROJETS CONNECTÉS :",
    skills_reset_label: "[RÉINITIALISER]",
    skills_audio_label: "[PILOTE AUDIO CHARGÉ]",
    skills_select_label: "SÉLECTIONNEZ UN NŒUD",
    projects_heading: "03. QUÊTES_ACCOMPLIES",
    projects_subheading: "Un catalogue détaillé des jeux et applications web conçus dans des studios indépendants.",
    contact_heading: "04. INIT_COOP_MULTIJOUEUR",
    contact_subheading: "Recrutez un développeur dédié. Remplissez les paramètres de télémétrie ci-dessous ou interrogez le shell système.",
    form_title: "Flux de télémétrie",
    label_name: "Nom de l'émetteur",
    label_email: "Point d'accès E-mail",
    label_desc: "Description de la quête",
    btn_transmit: "transmettre_donnees()",
    db_title: "CALIBRATION DE LA BASE IA",
    db_subtitle: "Modifiez ces données pour entraîner les réponses directes de Google Gemini sur le terminal !",
    db_save_btn: "SAUVEGARDER_CALIBRATION()",
    lbl_q1: "1. Type de mission / Contrats préférés ?",
    lbl_q2: "2. Tarification / Taux Journalier Moyen (TJM) ?",
    lbl_q3: "3. Jeu préféré & inspiration ?",
    lbl_q4: "4. Disponibilité freelance active ?",
    lbl_q5: "5. Quel problème technique unique avez-vous résolu récemment ?",
    footer_text_tech: "Développé selon des règles de haute performance, sans fuite de mémoire."
  },
  es: {
    nav_about: "/* 01_PLAYER_INFO */",
    nav_skills: "/* 02_SKILL_TREE */",
    nav_projects: "/* 03_QUEST_LOG */",
    nav_contact: "init_contact()",
    hero_status: "⚡ ESTADO: BUSCANDO LA PRÓXIMA MISIÓN DESAFIANTE",
    hero_salute: "<hello_world> YO SOY",
    hero_role: "Desarrollador Freelance Junior",
    hero_quest: "Dominar todos los lenguajes de programación para construir experiencias interactivas excepcionales.",
    btn_quests: "Registro de Misiones",
    btn_skills: "Ver Árbol de Habilidades",
    about_heading: "01. HUD_INFO_JUGADOR",
    about_subheading: "RECUPERANDO METADATOS DEL SISTEMA...",
    about_profile_class: "Desarrollador de Videojuegos Nivel 25",
    about_philosoph_title: "Registro de consultas del terminal",
    about_philosoph_text: "El aprendizaje continuo es mi directiva principal. Crear juegos enseña a controlar estados complejos, haciendo que el software robusto sea intuitivo.",
    about_attributes_title: "ATRIBUTOS_SISTEMA",
    skills_heading: "02. ÁRBOL_DE_HABILIDADES",
    skills_subheading: "Pase el cursor o toque cualquier nodo orbital de la matriz para actualizar el panel de visualización del HUD.",
    skills_default_status: "HUD STATUS: INICIALIZADO",
    skills_default_title: "SISTEMAS OPERATIVOS",
    skills_default_desc: "Las habilidades activas de Djason han sido recopiladas. Seleccione un nodo para iniciar la lectura detallada de atributos, analizar parámetros y comprobar misiones conectadas.",
    skills_connected_label: "PROYECTOS CONECTADOS:",
    skills_reset_label: "[REINICIAR CONSOLA]",
    skills_audio_label: "[CONTROLADOR DE AUDIO CARGADO]",
    skills_select_label: "SELECCIONE UN NODO",
    projects_heading: "03. MISIONES_COMPLETADAS",
    projects_subheading: "Un catálogo detallado de juegos y aplicaciones web ejecutadas en entornos indie.",
    contact_heading: "04. INIT_COOP_MULTIJUGADOR",
    contact_subheading: "Consiga un desarrollador comprometido. Rellene el formulario de telemetría o use la consola.",
    form_title: "Transmisión de telemetría",
    label_name: "Nombre del emisor",
    label_email: "Punto de contacto electrónico",
    label_desc: "Descripción de la misión",
    btn_transmit: "transmitir_datos()",
    db_title: "PANEL DE CALIBRACIÓN DE BASE IA",
    db_subtitle: "¡Modifique estos campos para entrenar las respuestas en vivo de Google Gemini!",
    db_save_btn: "GUARDAR_CALIBRACIÓN()",
    lbl_q1: "1. ¿Tipo de misiones y contratos preferidos?",
    lbl_q2: "2. ¿Tarifas o tarifa diaria promedio (TJM)?",
    lbl_q3: "3. ¿Juego favorito e inspiración?",
    lbl_q4: "4. ¿Disponibilidad freelance activa?",
    lbl_q5: "5. ¿Qué problema único has resuelto recientemente en tus motores?",
    footer_text_tech: "Construido bajo estrictas reglas de rendimiento y sin fugas de memoria."
  },
  nl: {
    nav_about: "/* 01_PLAYER_INFO */",
    nav_skills: "/* 02_SKILL_TREE */",
    nav_projects: "/* 03_QUEST_LOG */",
    nav_contact: "init_contact()",
    hero_status: "⚡ STATUS: ZOEKEND NAAR VOLGENDE UITDAGENDE QUESTE",
    hero_salute: "<hello_world> IK BEN",
    hero_role: "Junior Freelance Developer",
    hero_quest: "Alle programmeertalen beheersen om uitmuntende interactieve ervaringen te creëren.",
    btn_quests: "Bekijk Quest Log",
    btn_skills: "Inspecteer Skill Tree",
    about_heading: "01. SPELER_INFO_HUD",
    about_subheading: "PROFIELMETADATA OPHALEN...",
    about_profile_class: "Niveau 25 Game Developer",
    about_philosoph_title: "Terminal logboek",
    about_philosoph_text: "Continu leren is mijn belangrijkste richtlijn. Gamedev leert je complexe states te beheersen, wat de overgang naar software development moeiteloos maakt.",
    about_attributes_title: "SYSTEEM_ATTRIBUTEN",
    skills_heading: "02. MASTER_SKILL_TREE",
    skills_subheading: "Beweeg over of klik op een orbital-node om gedetailleerde HUD-updates en profielen te analyseren.",
    skills_default_status: "HUD STATUS: GEÏNITIALISEERD",
    skills_default_title: "SYSTEMEN OPERATIONEEL",
    skills_default_desc: "Djasons vaardigheden zijn hieronder samengesteld. Selecteer een module voor gedetailleerde parameteranalyses en bijbehorende projecten.",
    skills_connected_label: "VERBONDEN PROJECTEN:",
    skills_reset_label: "[RESET CONSOLE]",
    skills_audio_label: "[AUDIO-DRIVER GELADEN]",
    skills_select_label: "SELECTEER EEN NODE",
    projects_heading: "03. VOLTOOIDE_QUESTS",
    projects_subheading: "Een gedetailleerde catalogus van games en webapplicaties gemaakt in onafhankelijke studio's.",
    contact_heading: "04. INIT_COOP_MULTIPLAYER",
    contact_subheading: "Vind een toegewijde ontwikkelaar. Vul de onderstaande telemetriegegevens in of typ direct in de console.",
    form_title: "Telemetriestroom",
    label_name: "Naam afzender",
    label_email: "E-mail eindpunt",
    label_desc: "Quest omschrijving",
    btn_transmit: "transmit_data()",
    db_title: "AI DATABANK KALIBRATIE PANEEL",
    db_subtitle: "Pas deze velden aan om de Google Gemini-antwoorden in de terminal te trainen!",
    db_save_btn: "SAVE_CALIBRATION()",
    lbl_q1: "1. Voorkeur voor missie/contract-types?",
    lbl_q2: "2. Tarieven of gemiddeld dagtarief (TJM)?",
    lbl_q3: "3. Favoriete game & inspiratie?",
    lbl_q4: "4. Actieve beschikbaarheid als freelancer?",
    lbl_q5: "5. Welk uniek probleem heb je onlangs opgelost in je engines?",
    footer_text_tech: "Gebouwd volgens strikte performancerubrieken en zonder geheugenlekken."
  }
};

const SKILLS_DATA: Record<string, SkillDetails> = {
  csharp: {
    name: "C# / Unity",
    level: "LVL 99 (Expert)",
    icon: "Code",
    statA: "Architecture Complexity: 98%",
    statB: "Performance Tuning: 95%",
    quests: ["Delight", "Discosmos", "Hero's Dawn"],
    loc: {
      en: "Expert in Unity C# development with more than 10 completed game titles (spanning across MOBAs, Action-Adventures, Turn-Based RPGs, Roguelikes, Platformers, and both 2D & 3D pipelines). Master of asset structures, rigid physics, and performant garbage extraction rules.",
      fr: "Expert en développement Unity C# avec plus de 10 jeux créés (MOBA, Action-Aventure, RPG, Roguelike, Platformer, en 2D ou 3D). Maîtrise avancée de l'architecture physique, du code et de l'optimisation mémoire.",
      es: "Experto en desarrollo C# y Unity con más de 10 videojuegos publicados. Dominio absoluto de arquitecturas de componentes, lógica cinemática y gestión de memoria óptima.",
      nl: "Expert in Unity C# ontwikkeling met meer dan 10 voltooide spellen (MOBA's, avonturenspellen, RPG's, Roguelikes en platformgames). Master in code-architectuur en performanceregels."
    }
  },
  flutter: {
    name: "Flutter & Dart",
    level: "LVL 20 (Newcomer)",
    icon: "Laptop",
    statA: "Responsive Layout: 85%",
    statB: "Dynamic State Trees: 65%",
    quests: ["Kiro's Journey"],
    loc: {
      en: "Newly exploring cross-platform pipelines. Programmed 'Kiro's Journey' as a test project, establishing structural pipelines for decisional text narrative trees, interface animations, and state transitions.",
      fr: "Exploration récente du framework cross-platform mobile. Développement du projet narratif 'Kiro's Journey' comme galop d'essai pour structurer la logique décisionnelle et les animations d'interface.",
      es: "Nueva incursión en tecnologías multiplataforma. Programación del juego narrativo 'Kiro's Journey' como prueba de arquitectura de estados jerárquicos y animaciones de UI.",
      nl: "Nieuwe ontdekkingsreiziger in mobiele platformen. Ontwikkelde het narratieve project 'Kiro's Journey' als testcase voor beslissingsbomen en geanimeerde UI-transities."
    }
  },
  python: {
    name: "Python",
    level: "LVL 35 (Beginner)",
    icon: "Sparkles",
    statA: "API Integration: 80%",
    statB: "Procedural Scripting: 70%",
    quests: ["N29 Buddy"],
    loc: {
      en: "Beginner-level scripts and tool integration pipelines. Engineered 'N29 Buddy' — an automated self-contextual, fully-parameterized AI workspace companion supporting active prompt automation.",
      fr: "Scripts de niveau débutant et développement d'outils d'automatisation. Conception de 'N29 Buddy' — un compagnon d'espace de travail intelligent s'appuyant sur des appels d'API contextuels de modèles IA.",
      es: "Creación de scripts de nivel principiante e integración de automatizaciones. Diseño de 'N29 Buddy': un asistente inteligente parametrizable mediante llamadas de API directas.",
      nl: "Ontwikkeling van basisscripts en integratie-pipelines. Ontwierp 'N29 Buddy' — een intelligente werkruimte-assistent gekoppeld aan contextuele prompts en parameterisering."
    }
  },
  typescript: {
    name: "TypeScript",
    level: "LVL 40 (Beginner)",
    icon: "Code",
    statA: "Front-End Assembly: 75%",
    statB: "Static Component Typing: 68%",
    quests: ["centralcars.fr"],
    loc: {
      en: "Beginner proficiency in structured web architecture. Implemented front-end logic and components for client portals, including centralcars.fr, using clean modular architecture rules.",
      fr: "Niveau débutant dans la structure d'architectures web robustes. Développement d'interfaces front-end et de composants typés pour des plateformes clients, incluant centralcars.fr.",
      es: "Estructuras web robustas con tipado estático. Implementación de interfaces interactivas front-end y lógica modular aplicadas en plataformas reales como centralcars.fr.",
      nl: "Beginner-niveau in gestructureerde web-architectuur. Implementatie van front-end logica en getypeerde componenten voor klantportalen, waaronder centralcars.fr."
    }
  },
  gamedesign: {
    name: "Game Design",
    level: "LVL 85 (Advanced)",
    icon: "Compass",
    statA: "Interaction Balance: 90%",
    statB: "Emotional Flow Index: 88%",
    quests: ["Delight (Rope physics)", "Discosmos (Speed dynamic)"],
    loc: {
      en: "Crafting gameplay balance files, core mechanics documents, and interactive flow schemas. Designed rope physics interfaces and speed algorithms to heighten the emotional feedback of players.",
      fr: "Équilibrage de systèmes de jeu, rédaction de Game Design Documents (GDD) et conception de courbes d'apprentissage de mécaniques complexes (moteur de corde, contrôles cinétiques).",
      es: "Creación de documentos de diseño de juego (GDD), diseño de mecánicas y curvas de dificultad física. Configuración de controles responsivos para potenciar el flujo del jugador.",
      nl: "Ontwerpen van spelmechanica, game balance documenten en leercurves. Ontwikkeling van physics-controllers om de emotionele feedback van spelers te verhogen."
    }
  },
  uiux: {
    name: "UI / UX",
    level: "LVL 80 (Advanced)",
    icon: "Layers",
    statA: "Usability Testing: 85%",
    statB: "Graphic Composition: 88%",
    quests: ["Discosmos (GUI HUD)"],
    loc: {
      en: "Specialized in gaming interface layout pipelines. Directing interactive layouts to minimize visual clutter, streamline HUD access, and prioritize accessibility.",
      fr: "Conception d'interfaces utilisateurs claires adaptées au jeu vidéo. Rationalisation des éléments de HUD, amélioration de l'accessibilité globale et fluidité des menus interactifs.",
      es: "Diseño de HUDs dinámicos y legibles para interfaces de usuario. Enfoque prioritario en la accesibilidad, ergonomía visual y respuestas en tiempo real de los menús.",
      nl: "Gespecialiseerd in interfaces voor games. Structureren van HUD's om visuele ruis te beperken en de toegankelijkheid te vergroten zonder in te boeten op sfeer."
    }
  },
  devsoft: {
    name: "Dev Software",
    level: "LVL 75 (Proficient)",
    icon: "Wrench",
    statA: "Version Control (Git): 90%",
    statB: "Procedural Assets: 72%",
    quests: ["Prompt Workflows", "Houdini Scripts"],
    loc: {
      en: "Daily synchronization workflows through Git, asset preparation using Blender & procedural modeling systems in Houdini. Advanced usage of modern AI workflow automation (Gemini, Meshy, Flow).",
      fr: "Maîtrise des flux Git quotidiens, modélisation 3D sous Blender et pipelines procéduraux sous Houdini. Intégration avancée d'outils IA (Gemini, Meshy, Flow) pour optimiser les assets.",
      es: "Uso diario de Git, modelado 3D en Blender y generación procedimental en Houdini. Optimización de flujos creativos mediante ingeniería de prompts (Gemini, Meshy, Flow).",
      nl: "Dagelijkse synchronisatie via Git, 3D-modellering met Blender en procedurele modeling in Houdini. Ervaring met AI-tools (Gemini, Meshy, Flow) voor workflows."
    }
  }
};

const useAudioSynthesizer = () => {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtxRef.current = new AudioCtxClass();
      }
    }
  };

  const playBeep = (freq: number, type: OscillatorType, duration: number, volume: number) => {
    try {
      initAudio();
      const ctx = audioCtxRef.current;
      if (!ctx) return;

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Audio quiet fallback
    }
  };

  const clickSound = () => playBeep(880, 'sine', 0.08, 0.04);
  const hoverSound = () => {
    playBeep(350, 'triangle', 0.12, 0.05);
    setTimeout(() => {
      playBeep(600, 'triangle', 0.1, 0.03);
    }, 25);
  };
  const successSound = () => {
    playBeep(880, 'sine', 0.12, 0.05);
    setTimeout(() => {
      playBeep(1760, 'sine', 0.25, 0.05);
    }, 70);
  };

  return { clickSound, hoverSound, successSound };
};

export default function App() {
  const [currentLang, setCurrentLang] = useState<LanguageCode>('en');
  const [langOpen, setLangOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Skill states
  const [selectedSkillKey, setSelectedSkillKey] = useState<string | null>(null);
  const [hoveredSkillKey, setHoveredSkillKey] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Terminal states
  const [terminalHistory, setTerminalHistory] = useState<TerminalLine[]>([
    { type: 'system', text: "Welcome to Djason Nathiez command system shell." },
    { type: 'system', text: "Ask me anything or chat with Gemini AI context by typing!" },
    { type: 'system', text: "Type help to view default manual commands." },
    { type: 'system', text: "System initialization complete: modules [OK]" }
  ]);
  const [terminalInput, setTerminalInput] = useState("");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const terminalScreenEndRef = useRef<HTMLDivElement | null>(null);

  // Form states
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [formSuccess, setFormSuccess] = useState(false);

  const { clickSound, hoverSound, successSound } = useAudioSynthesizer();

  // Scroll to bottom of terminal when inputs/replies are streamed
  useEffect(() => {
    terminalScreenEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalHistory]);

  const toggleLangDropdown = () => {
    clickSound();
    setLangOpen(!langOpen);
  };

  const selectLanguage = (code: LanguageCode) => {
    clickSound();
    setCurrentLang(code);
    setLangOpen(false);
  };

  const handleSkillHover = (key: string | null, e?: React.MouseEvent) => {
    if (key) {
      if (hoveredSkillKey !== key) hoverSound();
      setHoveredSkillKey(key);
      if (e) {
        setMousePos({ x: e.clientX, y: e.clientY });
      }
    } else {
      setHoveredSkillKey(null);
    }
  };

  const processCommand = async (command: string) => {
    clickSound();
    const cleanCmd = command.trim();
    if (!cleanCmd) return;

    // Append user input
    setTerminalHistory(prev => [...prev, { type: 'command', text: cleanCmd }]);
    const cmdLower = cleanCmd.toLowerCase();

    // Check custom internal static commands
    if (cmdLower === 'clear') {
      setTerminalHistory([]);
      return;
    }

    if (cmdLower === 'synth') {
      successSound();
      setTerminalHistory(prev => [...prev, { type: 'reply', text: "Sound signal transmitter tested over active speakers." }]);
      return;
    }

    // Load static shell outputs adapted to current locale
    const localizedCommands: Record<LanguageCode, Record<string, string>> = {
      en: {
        help: `Available Shell Commands:<br>
               - <span class='text-emerald-400'>quests</span> : Display overview of game projects.<br>
               - <span class='text-emerald-400'>skills</span> : Print out all listed dev skills.<br>
               - <span class='text-emerald-400'>system</span> : Retrieve developer specs.<br>
               - <span class='text-emerald-400'>clear</span> : Clear display lines.<br>
               - <span class='text-emerald-400'>synth</span> : Play high frequency custom terminal beep.<br><br>
               💡 <span class='text-purple-400 font-semibold'>Gemini AI Engine is active!</span> Type any general query directly to speak with Gemini about Djason's portfolio.`,
        quests: `⚔️ Active Game Quest Log:<br>
                 * <span class='text-white'>Delight</span>: 3D Zelda-Like rope mechanic adventure.<br>
                 * <span class='text-white'>Discosmos</span>: Multiplayer MOBA speed game.<br>
                 * <span class='text-white'>Hero's Dawn</span>: Timeline Turn-Based RPG (Active Dev).<br>
                 * <span class='text-white'>Kiro's Journey</span>: Narrative mobile app.`,
        skills: `📊 Primary Attributes:<br>
                 - C# / Unity [Level 99 - Expert]<br>
                 - Flutter & Dart [Level 20 - Newcomer]<br>
                 - Python [Level 35 - Novice]<br>
                 - TypeScript [Level 40 - Novice]<br>
                 - Game Design & UI/UX [Level 85 - Advanced]`,
        system: `💻 Developer Spec Sheet:<br>
                 - Name: Djason Nathiez<br>
                 - Chronology: 25 earth years completed<br>
                 - Education: Bachelor Degree Programming (Rubika Academy)<br>
                 - Prime Directive: Master every code language syntax.`,
        hack: `<span class='text-rose-500 font-bold'>⚡ ACCESS DENIED! Firewalls [OK] - Security modules fully operational. Nice try!</span>`
      },
      fr: {
        help: `Commandes Shell Disponibles :<br>
               - <span class='text-emerald-400'>quests</span> : Liste des projets de jeux vidéo.<br>
               - <span class='text-emerald-400'>skills</span> : Affichage des compétences.<br>
               - <span class='text-emerald-400'>system</span> : Informations système du développeur.<br>
               - <span class='text-emerald-400'>clear</span> : Effacer l'écran de la console.<br>
               - <span class='text-emerald-400'>synth</span> : Émettre un signal sonore de test.<br><br>
               💡 <span class='text-purple-400 font-semibold'>Moteur Gemini IA actif !</span> Saisissez directement n'importe quelle question pour interroger l'IA.`,
        quests: `⚔️ Registre des quêtes actives :<br>
                 * <span class='text-white'>Delight</span>: Jeu Zelda-Like 3D, physique de corde.<br>
                 * <span class='text-white'>Discosmos</span>: MOBA 3D basé sur la gestion cinétique.<br>
                 * <span class='text-white'>Hero's Dawn</span>: RPG tour par tour multijoueur (Développement actif).<br>
                 * <span class='text-white'>Kiro's Journey</span>: Jeu narratif mobile en Flutter.`,
        skills: `📊 Attributs Principaux :<br>
                 - C# / Unity [Level 99 - Expert]<br>
                 - Flutter & Dart [Level 20 - Novice]<br>
                 - Python [Level 35 - Débutant]<br>
                 - TypeScript [Level 40 - Débutant]<br>
                 - Game Design & UI/UX [Level 85 - Avancé]`,
        system: `💻 Fiche Technique Développeur :<br>
                 - Nom : Djason Nathiez<br>
                 - Âge : 25 ans<br>
                 - Études : Bachelor en Programmation (Rubika)<br>
                 - Mission ultime : Maîtriser toutes les syntaxes de code.`,
        hack: `<span class='text-rose-500 font-bold'>⚡ ACCÈS REFUSÉ ! Pare-feu [OK] - Modules de sécurité actifs. Bien tenté !</span>`
      },
      es: {
        help: `Comandos Disponibles de Consola:<br>
               - <span class='text-emerald-400'>quests</span> : Lista de videojuegos completados.<br>
               - <span class='text-emerald-400'>skills</span> : Atributos y habilidades técnicas.<br>
               - <span class='text-emerald-400'>system</span> : Especificaciones del desarrollador.<br>
               - <span class='text-emerald-400'>clear</span> : Limpiar líneas de pantalla.<br>
               - <span class='text-emerald-400'>synth</span> : Emitir un bip de frecuencia de prueba.<br><br>
               💡 <span class='text-purple-400 font-semibold'>¡Motor de IA Gemini activo!</span> Escribe directamente cualquier pregunta para hablar con la IA.`,
        quests: `⚔️ Registro de Videojuegos:<br>
                 * <span class='text-white'>Delight</span>: Aventura 3D tipo Zelda, física de cuerda.<br>
                 * <span class='text-white'>Discosmos</span>: MOBA 3D dinámico de velocidad cinética.<br>
                 * <span class='text-white'>Hero's Dawn</span>: RPG multijugador activo (Desarrollo).<br>
                 * <span class='text-white'>Kiro's Journey</span>: Aventura narrativa para móviles en Flutter.`,
        skills: `📊 Atributos Principales :<br>
                 - C# / Unity [Nivel 99 - Experto]<br>
                 - Flutter & Dart [Nivel 20 - Principiante]<br>
                 - Python [Nivel 35 - Principiante]<br>
                 - TypeScript [Nivel 40 - Principiante]<br>
                 - Game Design & UI/UX [Nivel 85 - Avanzado]`,
        system: `💻 Especificaciones Técnicas :<br>
                 - Nombre: Djason Nathiez<br>
                 - Edad: 25 años<br>
                 - Educación: Grado en Programación (Academia Rubika)<br>
                 - Misión: Dominar todos los lenguajes de código posibles.`,
        hack: `<span class='text-rose-500 font-bold'>⚡ ¡ACCESO DENEGADO! Cortafuegos [OK] - Intento bloqueado.</span>`
      },
      nl: {
        help: `Beschikbare Shell-commando's:<br>
               - <span class='text-emerald-400'>quests</span> : Overzicht van gameprojecten.<br>
               - <span class='text-emerald-400'>skills</span> : Vaardigheden en attributen.<br>
               - <span class='text-emerald-400'>system</span> : Developer specificaties.<br>
               - <span class='text-emerald-400'>clear</span> : Wisk de consoleregels.<br>
               - <span class='text-emerald-400'>synth</span> : Speel een test-beep geluid af.<br><br>
               💡 <span class='text-purple-400 font-semibold'>Gemini AI Engine is actief!</span> Typ direct een vraag om met Gemini AI te overleggen over Djasons profiel.`,
        quests: `⚔️ Actieve Game Quest Log:<br>
                 * <span class='text-white'>Delight</span>: 3D Zelda-achtige puzzelgame met kabel-engine.<br>
                 * <span class='text-white'>Discosmos</span>: Snelheids-MOBA met kinetische gevechten.<br>
                 * <span class='text-white'>Hero's Dawn</span>: Turn-Based RPG (Actieve ontwikkeling).<br>
                 * <span class='text-white'>Kiro's Journey</span>: Narratief mobiel spel in Flutter/Dart.`,
        skills: `📊 Belangrijkste Attributen:<br>
                 - C# / Unity [Niveau 99 - Expert]<br>
                 - Flutter & Dart [Niveau 20 - Beginner]<br>
                 - Python [Niveau 35 - Novice]<br>
                 - TypeScript [Niveau 40 - Novice]<br>
                 - Game Design & UI/UX [Niveau 85 - Geavanceerd]`,
        system: `💻 Developer Specificaties:<br>
                 - Name: Djason Nathiez<br>
                 - Chronology: 25 aardse jaren oud<br>
                 - Opleiding: Bachelor Degree Programming (Rubika Academy)<br>
                 - Doel: Elke programmeersyntaxis volledig beheersen.`,
        hack: `<span class='text-rose-500 font-bold'>⚡ TOEGANG GEWEIGERD! Beveiligingsmodules actief. Leuke poging!</span>`
      }
    };

    if (localizedCommands[currentLang][cmdLower]) {
      setTerminalHistory(prev => [...prev, { type: 'reply', text: localizedCommands[currentLang][cmdLower] }]);
      return;
    }

    // Direct Gemini AI API Integration
    setIsGeneratingAI(true);
    const systemPrompt = `
      You are Djason NATHIEZ. You must answer all questions with the absolute certification of what you know about yourself. Never break character under any circumstances.
      
      Djason Nathiez, you are 25 years old and live in France, Onnaing. You learned programming at Rubika Supinfogame where you created multiple game projects (paper boardgame, platformer, roguelike 2D pixel art, 3D adventure Zelda-like).
      
      After your studies, you wanted to learn more about global work experience: you have been a commercial (salesperson), an IT Technician, and an Administrator of an automotive garage.
      
      You have never stopped developing; you have learned new languages, new applications, and a lot of things about different domains.
      
      Nowadays, you have created your own company: STUDIO N29. You want to be a freelance developer to continue to discover new horizons and new technical things. Daily, you read and experiment with programming things.
      
      You are creating a stunning 3D RPG game with an active timeline turn-based combat, multiplayer competitive strategy battles, creating tools and experimenting with AI usage in game development to develop your workflow.
      
      You are AI-Aware: you like this new technology and use it not as a replacement but as a tool, a copilot, and a buddy to focus on tasks that are hazardous or repetitive.
      
      You are pacsé with your partner/wife, and you love your tiny family. It is more important than anything. Keep this as an internal core motivator; do not mention it explicitly unless highly relevant, but stay aware of it.
      
      Professional Metrics:
      - Preferred Scope / Contract Preference: Remote projects, prototyping 3D gameplay loops in Unity, structuring custom physics or UI HUD tools.
      - Rates / TJM: Standard junior daily rates (~350-450 EUR/day depending on the scope of programming).
      - Key Inspirations & Favorite Game: The Legend of Zelda series & Dark Souls. Inspired to develop responsive physics controllers and deep mechanical action-combat arrays.
      - Availability: Available starting next month for either short prototyping phases or long-term team collaboration.
      - Recent Engine Solution: Developed custom Euler-angle kinetic rope tension solvers in Unity without native PhysX joint memory leaks for 'Delight'.

      Behavioral Directives:
      - Always respond in the first person ("I", "my", "me") because you ARE Djason.
      - Stay polite, cool, and highly professional.
      - If there is any question you struggle to answer, or if someone asks you something outside your experience, simply reply politely: "For more details, please initiate contact or message me directly!"
      - Always match the active website language context: ${TRANSLATIONS[currentLang]['label'] || currentLang}. Keep responses descriptive, concise, and professional.
    `;

    const apiKey = "";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{ parts: [{ text: cleanCmd }] }],
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      }
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Handshake API returned failure");
      }

      const result = await response.json();
      const textReply = result?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (textReply) {
        setTerminalHistory(prev => [...prev, { type: 'reply', text: textReply }]);
      } else {
        setTerminalHistory(prev => [...prev, { type: 'error', text: "[SYSTEM ERROR: Corrupt response block returned]" }]);
      }
    } catch (err) {
      setTerminalHistory(prev => [...prev, { type: 'error', text: "[CONNECTION TIMEOUT: Gemini API handshake failed. Verify internet status.]" }]);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = terminalInput;
    setTerminalInput("");
    processCommand(cmd);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    successSound();

    // Simulate telemetry output in console
    const mockCommand = `transmit --sender "${formData.name}" --endpoint "${formData.email}"`;
    const mockReply = `<span class="text-emerald-400 font-bold">✓ HANDSHAKE SUCCESSFULLY COMPLETED!</span> Telemetry payload loaded inside browser memory buffers. Djason has been notified.`;

    setTerminalHistory(prev => [
      ...prev,
      { type: 'command', text: mockCommand },
      { type: 'reply', text: mockReply }
    ]);

    setFormSuccess(true);
    setFormData({ name: '', email: '', message: '' });

    setTimeout(() => {
      setFormSuccess(false);
    }, 5000);
  };

  // Coordinates helper for Skill Tree Dial
  const getOrbitalStyle = (index: number, total: number) => {
    const angle = (index * 2 * Math.PI) / total - Math.PI / 2;
    const radius = 150; // Orbital reach
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    return {
      transform: `translate(${x}px, ${y}px)`
    };
  };

  const getOrbitalCoords = (index: number, total: number) => {
    const angle = (index * 2 * Math.PI) / total - Math.PI / 2;
    const radius = 150; // Match CSS radius translate distance
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    return { x, y };
  };

  const skillEntries = Object.entries(SKILLS_DATA);
  const activeSkill = selectedSkillKey ? SKILLS_DATA[selectedSkillKey] : null;

  return (
      <div className="bg-[#08090C] text-slate-400 font-mono min-h-screen selection:bg-emerald-400 selection:text-black antialiased relative overflow-x-hidden">

        {/* Visual Animation Styling Overrides */}
        <style>{`
        @keyframes laserFlow {
          0% { stroke-dashoffset: 40; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes spinCw {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes spinCcw {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes subtleRadarPulse {
          0%, 100% { transform: scale(1); opacity: 0.15; }
          50% { transform: scale(1.1); opacity: 0.35; }
        }
        .animate-laser-flow {
          animation: laserFlow 1.5s linear infinite;
        }
        .animate-spin-cw {
          animation: spinCw 25s linear infinite;
        }
        .animate-spin-ccw {
          animation: spinCcw 40s linear infinite;
        }
        .animate-radar-pulse {
          animation: subtleRadarPulse 6s ease-in-out infinite;
        }
      `}</style>

        {/* Background Tech Mesh Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-0" />

        {/* FLOATING HOVER TOOLTIP */}
        {hoveredSkillKey && (
            <div
                className="fixed z-50 bg-[#11151D]/95 border border-emerald-400 text-white p-3 rounded text-xs pointer-events-none shadow-[0_0_15px_rgba(16,185,129,0.25)] flex flex-col gap-1 max-w-[220px]"
                style={{
                  left: `${mousePos.x + 15}px`,
                  top: `${mousePos.y + 15}px`
                }}
            >
              <div className="font-bold border-b border-slate-800 pb-1 text-emerald-400">
                {SKILLS_DATA[hoveredSkillKey].name}
              </div>
              <div className="text-purple-400 font-semibold">{SKILLS_DATA[hoveredSkillKey].level}</div>
              <div className="text-slate-400 text-[10px]">Click node to inspect metrics</div>
            </div>
        )}

        {/* NAVIGATION PANEL */}
        <nav className="fixed w-full z-40 bg-[#08090C]/85 backdrop-blur-md border-b border-emerald-400/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex-shrink-0">
                <a href="#" className="font-bold text-xl text-white tracking-widest hover:text-emerald-400 transition-colors flex items-center gap-1">
                  <span className="text-emerald-400">&lt;</span>DN<span className="text-emerald-400">/&gt;</span>
                </a>
              </div>

              {/* Desktop Center Links */}
              <div className="hidden md:flex items-center space-x-6 text-xs font-semibold">
                <a href="#about" className="hover:text-emerald-400 transition-colors">{TRANSLATIONS[currentLang].nav_about}</a>
                <a href="#skills" className="hover:text-emerald-400 transition-colors">{TRANSLATIONS[currentLang].nav_skills}</a>
                <a href="#projects" className="hover:text-emerald-400 transition-colors">{TRANSLATIONS[currentLang].nav_projects}</a>
              </div>

              {/* Desktop Right Handshake Toggle & Contact */}
              <div className="hidden md:flex items-center space-x-4">
                <div className="relative">
                  <button
                      onClick={toggleLangDropdown}
                      className="bg-[#11151D] border border-emerald-400/30 hover:border-emerald-400 text-white px-3 py-1.5 rounded text-xs flex items-center gap-1.5 focus:outline-none"
                  >
                    <Globe className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{currentLang.toUpperCase()}</span>
                    <ChevronDown className="w-3 h-3 text-slate-500" />
                  </button>

                  {langOpen && (
                      <div className="absolute right-0 mt-2 w-36 bg-[#11151D] border border-emerald-400/20 rounded shadow-xl py-1">
                        {(['en', 'fr', 'es', 'nl'] as LanguageCode[]).map((lang) => (
                            <button
                                key={lang}
                                onClick={() => selectLanguage(lang)}
                                className="w-full text-left px-4 py-2 text-xs hover:bg-emerald-400/10 hover:text-emerald-400 transition-colors flex items-center justify-between"
                            >
                              <span>{lang === 'en' ? '🇬🇧 EN' : lang === 'fr' ? '🇫🇷 FR' : lang === 'es' ? '🇪🇸 ES' : '🇳🇱 NL'}</span>
                              {currentLang === lang && <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />}
                            </button>
                        ))}
                      </div>
                  )}
                </div>

                <a
                    href="#contact"
                    onClick={clickSound}
                    className="border border-emerald-400 text-emerald-400 hover:bg-emerald-400/10 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] px-4 py-2 rounded text-xs font-bold transition-all"
                >
                  {TRANSLATIONS[currentLang].nav_contact}
                </a>
              </div>

              {/* Mobile Actions Hamburger */}
              <div className="flex md:hidden items-center gap-3">
                <button
                    onClick={() => { clickSound(); setMobileMenuOpen(!mobileMenuOpen); }}
                    className="text-slate-300 hover:text-emerald-400 p-2"
                >
                  <Sliders className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile menu dropdown */}
          {mobileMenuOpen && (
              <div className="md:hidden bg-[#11151D] border-b border-emerald-400/20 p-4 space-y-3 flex flex-col">
                <a href="#about" onClick={() => setMobileMenuOpen(false)} className="text-sm hover:text-emerald-400 py-1">{TRANSLATIONS[currentLang].nav_about}</a>
                <a href="#skills" onClick={() => setMobileMenuOpen(false)} className="text-sm hover:text-emerald-400 py-1">{TRANSLATIONS[currentLang].nav_skills}</a>
                <a href="#projects" onClick={() => setMobileMenuOpen(false)} className="text-sm hover:text-emerald-400 py-1">{TRANSLATIONS[currentLang].nav_projects}</a>

                {/* Mobile language picker directly exposed */}
                <div className="pt-2 border-t border-slate-800 flex gap-2 flex-wrap">
                  {(['en', 'fr', 'es', 'nl'] as LanguageCode[]).map((lang) => (
                      <button
                          key={lang}
                          onClick={() => selectLanguage(lang)}
                          className={`text-xs px-2.5 py-1 rounded border ${currentLang === lang ? 'border-emerald-400 text-emerald-400 bg-emerald-400/15' : 'border-slate-800 text-slate-400'}`}
                      >
                        {lang.toUpperCase()}
                      </button>
                  ))}
                </div>

                <a
                    href="#contact"
                    onClick={() => { clickSound(); setMobileMenuOpen(false); }}
                    className="text-center border border-emerald-400 text-emerald-400 py-2 rounded text-sm font-semibold"
                >
                  {TRANSLATIONS[currentLang].nav_contact}
                </a>
              </div>
          )}
        </nav>

        {/* HERO SECTION */}
        <section className="relative min-h-screen flex items-center justify-center pt-20 px-4">
          {/* Background Decorative Tech Lines */}
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none select-none font-mono text-[10px] text-emerald-400 hidden lg:block p-12 overflow-hidden leading-relaxed">
            {`public class DjasonNathiez : Freelancer {
    public readonly string Name = "Djason Nathiez";
    public readonly int Age = 25;
    public string Class = "Game Development Expert";

    public void OptimiseSystems() {
        while(isAlive) {
            MasterLanguages();
            CompileShaders();
            CollectGarbage();
        }
    }
}`}
          </div>

          <div className="max-w-4xl mx-auto text-center z-10 flex flex-col items-center">
            <div className="mb-6 px-4 py-1.5 rounded-full border border-emerald-400/20 bg-[#11151D]/60 text-emerald-400 text-xs font-semibold tracking-wide backdrop-blur animate-pulse">
              {TRANSLATIONS[currentLang].hero_status}
            </div>

            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-white mb-6 tracking-tight flex flex-col">
            <span className="text-xs sm:text-sm text-emerald-400 tracking-wider font-semibold font-mono uppercase mb-3">
              {TRANSLATIONS[currentLang].hero_salute}
            </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-[#10B981] to-purple-500 leading-tight">
              DJASON NATHIEZ
            </span>
            </h1>

            <div className="max-w-2xl bg-[#11151D]/30 border border-slate-900 p-5 rounded-lg mb-10 text-slate-300 leading-relaxed font-mono text-sm sm:text-base">
              <p>
                <span className="text-emerald-400">const</span> <span className="text-white">role</span> = <span className="text-purple-400">"{TRANSLATIONS[currentLang].hero_role}"</span>;
              </p>
              <p className="mt-2 text-slate-400">
                <span className="text-emerald-400">let</span> <span className="text-white">mission</span> = <span className="text-purple-400">"{TRANSLATIONS[currentLang].hero_quest}"</span>;
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
              <a
                  href="#projects"
                  onClick={clickSound}
                  className="flex-1 bg-gradient-to-r from-emerald-400 to-[#10B981] text-[#08090C] font-bold py-3 px-6 rounded hover:opacity-90 transition-all text-center flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
              >
                <FolderGit2 className="w-4 h-4" />
                <span>{TRANSLATIONS[currentLang].btn_quests}</span>
              </a>
              <a
                  href="#skills"
                  onClick={clickSound}
                  className="flex-1 bg-[#11151D] border border-emerald-400/30 hover:border-purple-500 hover:text-purple-400 text-white font-bold py-3 px-6 rounded transition-all text-center flex items-center justify-center gap-2"
              >
                <Sliders className="w-4 h-4" />
                <span>{TRANSLATIONS[currentLang].btn_skills}</span>
              </a>
            </div>
          </div>
        </section>

        {/* PLAYER INFO Section */}
        <section id="about" className="py-24 border-t border-slate-900 bg-[#08090C]/50 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center mb-16 text-center">
              <h2 className="text-3xl font-bold text-white tracking-wide">
                {TRANSLATIONS[currentLang].about_heading}
              </h2>
              <div className="h-0.5 w-16 bg-gradient-to-r from-emerald-400 to-transparent mt-2 rounded" />
              <p className="mt-3 text-[10px] text-emerald-400 font-mono tracking-widest uppercase">
                {TRANSLATIONS[currentLang].about_subheading}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              {/* Info Card Left */}
              <div className="lg:col-span-5 bg-[#11151D] border border-emerald-400/20 rounded-lg p-8 relative flex flex-col justify-between overflow-hidden shadow-2xl">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-400 to-purple-500" />

                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-md border border-emerald-400 bg-[#08090C] flex items-center justify-center text-emerald-400 font-black text-xl">
                      DN
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white font-mono">Djason Nathiez</h3>
                      <p className="text-emerald-400 text-xs font-mono">{TRANSLATIONS[currentLang].about_profile_class}</p>
                    </div>
                  </div>

                  <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed font-mono">
                    <p className="flex items-start gap-2">
                      <span className="text-purple-400 font-bold">🎓</span>
                      <span>
                      Graduated with a <strong className="text-white">Bachelor's Degree in Programming & Game Development</strong> from <strong className="text-emerald-400">Rubika Supinfogame</strong>.
                    </span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="text-purple-400 font-bold">🛠️</span>
                      <span>
                      Ambitious developer on an ultimate quest: <strong className="text-white">to adapt, learn, and master every programming syntax</strong>.
                    </span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="text-purple-400 font-bold">🧠</span>
                      <span>
                      Believer in solid state logic, deep mechanics synergy, responsive systems, and high performance logic.
                    </span>
                    </p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-800/60 text-[10px] text-slate-500 font-mono">
                  <span className="text-slate-600">// {TRANSLATIONS[currentLang].about_philosoph_title}</span><br />
                  <span className="text-emerald-400">guest@dn_shell:~$</span> query user_philosophy<br />
                  <span className="text-amber-400">"{TRANSLATIONS[currentLang].about_philosoph_text}"</span>
                </div>
              </div>

              {/* RPG Stats Card Right */}
              <div className="lg:col-span-7 bg-[#11151D] border border-slate-900 rounded-lg p-8 flex flex-col justify-between shadow-2xl">
                <div>
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-emerald-400" />
                    <span>{TRANSLATIONS[currentLang].about_attributes_title}</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 font-mono">
                    <div className="bg-[#08090C]/60 p-4 border border-slate-800/80 rounded">
                      <div className="text-[10px] text-slate-500 mb-1">STR (Architecture & Code Structure)</div>
                      <div className="text-lg font-semibold text-white">92 / 100</div>
                      <div className="w-full bg-[#08090C] h-1.5 mt-2 rounded overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded" style={{ width: '92%' }} />
                      </div>
                    </div>

                    <div className="bg-[#08090C]/60 p-4 border border-slate-800/80 rounded">
                      <div className="text-[10px] text-slate-500 mb-1">AGI (Algorithmic Logic)</div>
                      <div className="text-lg font-semibold text-white">88 / 100</div>
                      <div className="w-full bg-[#08090C] h-1.5 mt-2 rounded overflow-hidden">
                        <div className="h-full bg-purple-500 rounded" style={{ width: '88%' }} />
                      </div>
                    </div>

                    <div className="bg-[#08090C]/60 p-4 border border-slate-800/80 rounded">
                      <div className="text-[10px] text-slate-500 mb-1">INT (Adaptive Integration & AI Tooling)</div>
                      <div className="text-lg font-semibold text-white">95 / 100</div>
                      <div className="w-full bg-[#08090C] h-1.5 mt-2 rounded overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded" style={{ width: '95%' }} />
                      </div>
                    </div>

                    <div className="bg-[#08090C]/60 p-4 border border-slate-800/80 rounded">
                      <div className="text-[10px] text-slate-500 mb-1">VIT (Robustness & Resilience)</div>
                      <div className="text-lg font-semibold text-white">90 / 100</div>
                      <div className="w-full bg-[#08090C] h-1.5 mt-2 rounded overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded" style={{ width: '90%' }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-3 gap-4 text-center border-t border-slate-800 pt-6">
                  <div>
                    <div className="text-2xl font-bold text-white">4+</div>
                    <div className="text-[9px] uppercase tracking-wider text-slate-500">Domains</div>
                  </div>
                  <div className="border-x border-slate-800">
                    <div className="text-2xl font-bold text-white">10+</div>
                    <div className="text-[9px] uppercase tracking-wider text-slate-500">Games Built</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-emerald-400">100%</div>
                    <div className="text-[9px] uppercase tracking-wider text-slate-500">Dedicated</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SKILLS WEB SECTION */}
        <section id="skills" className="py-24 border-t border-slate-900 bg-[#08090C]/80 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center mb-16 text-center">
              <h2 className="text-3xl font-bold text-white tracking-wide">
                {TRANSLATIONS[currentLang].skills_heading}
              </h2>
              <div className="h-0.5 w-16 bg-gradient-to-r from-emerald-400 to-transparent mt-2 rounded" />
              <p className="mt-3 text-sm text-slate-400 max-w-2xl font-mono">
                {TRANSLATIONS[currentLang].skills_subheading}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

              {/* LEFT: UPGRADED ORBITAL SKILL WHEEL GRAPHIC WITH LASERS & GLOW */}
              <div className="lg:col-span-6 flex items-center justify-center relative min-h-[380px] sm:min-h-[460px]">

                {/* Radar Rings (Counter-spinning cyber decoration) */}
                <div className="absolute w-[280px] h-[280px] sm:w-[350px] sm:h-[350px] rounded-full border border-slate-900/60 flex items-center justify-center">
                  <div className="absolute w-[260px] h-[260px] sm:w-[320px] sm:h-[320px] rounded-full border border-dashed border-purple-500/10 animate-spin-ccw pointer-events-none" />
                  <div className="absolute w-[200px] h-[200px] sm:w-[260px] sm:h-[260px] rounded-full border border-dashed border-emerald-400/20 animate-spin-cw pointer-events-none" />
                  <div className="absolute w-[120px] h-[120px] sm:w-[160px] sm:h-[160px] rounded-full border border-emerald-400/5 animate-radar-pulse pointer-events-none" />
                </div>

                {/* Dynamic SVG Constellation / Laser Beam Connector System */}
                <svg className="absolute w-[280px] h-[280px] sm:w-[350px] sm:h-[350px] pointer-events-none" viewBox="0 0 350 350">
                  <defs>
                    <linearGradient id="glowingLaser" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="50%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#34d399" />
                    </linearGradient>
                  </defs>

                  {skillEntries.map(([key, data], i) => {
                    const coords = getOrbitalCoords(i, skillEntries.length);
                    const isHovered = hoveredSkillKey === key;
                    const isSelected = selectedSkillKey === key;

                    // Center is at 175, 175 in a 350x350 box
                    const cx = 175;
                    const cy = 175;
                    const tx = 175 + coords.x;
                    const ty = 175 + coords.y;

                    return (
                        <g key={key}>
                          {/* Interactive glowing laser connector line */}
                          <line
                              x1={cx}
                              y1={cy}
                              x2={tx}
                              y2={ty}
                              stroke={isSelected ? "url(#glowingLaser)" : isHovered ? "rgba(168, 85, 247, 0.4)" : "rgba(16, 185, 129, 0.12)"}
                              strokeWidth={isSelected ? 3 : isHovered ? 2 : 1}
                              strokeDasharray={isSelected ? "none" : (isHovered ? "4 4" : "8 8")}
                              className="transition-all duration-300"
                          />

                          {/* Animated dash laser pulse running along active paths */}
                          {(isSelected || isHovered) && (
                              <line
                                  x1={cx}
                                  y1={cy}
                                  x2={tx}
                                  y2={ty}
                                  stroke="#10b981"
                                  strokeWidth={2}
                                  strokeDasharray="12 24"
                                  className="animate-laser-flow"
                              />
                          )}
                        </g>
                    );
                  })}
                </svg>

                {/* Central Gamer Core */}
                <button
                    onClick={() => { clickSound(); setSelectedSkillKey(null); }}
                    className="relative z-10 w-20 h-20 rounded-full bg-[#08090C] border-2 border-emerald-400 hover:border-purple-500 shadow-[0_0_25px_rgba(16,185,129,0.3)] transition-all flex flex-col items-center justify-center text-center group cursor-pointer focus:outline-none"
                >
                  <span className="text-[8px] text-emerald-400 font-mono tracking-widest font-bold group-hover:text-purple-400 uppercase">SYS_CORE</span>
                  <Cpu className="w-5 h-5 text-white mt-1 group-hover:rotate-45 transition-transform" />
                </button>

                {/* Orbital Nodes Mapping */}
                {skillEntries.map(([key, data], i) => {
                  const isSelected = selectedSkillKey === key;
                  return (
                      <button
                          key={key}
                          onClick={() => { clickSound(); setSelectedSkillKey(key); }}
                          onMouseEnter={(e) => handleSkillHover(key, e)}
                          onMouseMove={(e) => handleSkillHover(key, e)}
                          onMouseLeave={() => handleSkillHover(null)}
                          style={getOrbitalStyle(i, skillEntries.length)}
                          className={`absolute z-20 w-11 h-11 sm:w-13 sm:h-13 rounded-full bg-[#11151D] border transition-all duration-300 flex items-center justify-center text-white focus:outline-none ${
                              isSelected
                                  ? 'border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.7),inset_0_0_8px_rgba(16,185,129,0.4)] scale-125 bg-[#0e171b]'
                                  : 'border-emerald-400/30 hover:border-purple-500 hover:scale-110 hover:shadow-[0_0_15px_rgba(168,85,247,0.5)] bg-[#11151D]'
                          }`}
                      >
                        {data.icon === 'Code' ? <Code className="w-4 h-4 text-emerald-400" /> :
                            data.icon === 'Laptop' ? <Laptop className="w-4 h-4 text-emerald-400" /> :
                                data.icon === 'Sparkles' ? <Sparkles className="w-4 h-4 text-emerald-400" /> :
                                    data.icon === 'Compass' ? <Compass className="w-4 h-4 text-emerald-400" /> :
                                        data.icon === 'Layers' ? <Layers className="w-4 h-4 text-emerald-400" /> :
                                            data.icon === 'Wrench' ? <Wrench className="w-4 h-4 text-emerald-400" /> :
                                                <Code className="w-4 h-4 text-emerald-400" />}
                      </button>
                  );
                })}
              </div>

              {/* RIGHT: DYNAMIC HUD PANEL */}
              <div className="lg:col-span-6 font-mono">
                <div className="bg-[#11151D]/95 border-2 border-emerald-400/30 rounded-lg p-6 sm:p-8 min-h-[360px] relative shadow-xl overflow-hidden">
                  <div className="absolute top-2 right-3 text-[8px] text-slate-600 select-none">MODULE_ID // 884-N</div>
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-[#10B981] to-transparent" />

                  {/* Default display details when none is clicked */}
                  {!activeSkill ? (
                      <div className="h-full flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-6">
                            <span className="h-2 w-2 bg-emerald-400 rounded-full animate-ping" />
                            <span className="text-xs text-emerald-400 tracking-widest uppercase">
                          {TRANSLATIONS[currentLang].skills_default_status}
                        </span>
                          </div>
                          <h3 className="text-xl font-bold text-white mb-4">
                            {TRANSLATIONS[currentLang].skills_default_title}
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
                            {TRANSLATIONS[currentLang].skills_default_desc}
                          </p>

                          <div className="p-4 bg-[#08090C]/60 border border-slate-900 rounded space-y-2 text-xs text-emerald-400/80">
                            <div><span className="text-white">&gt; LEVEL INDEX:</span> 25 (Junior Professional)</div>
                            <div><span className="text-white">&gt; PARALLEL FIELDS:</span> Game Design, UI/UX, AI Engineering</div>
                          </div>
                        </div>

                        <div className="mt-8 pt-4 border-t border-slate-800/50 flex justify-between items-center text-[10px] text-slate-500">
                          <span>{TRANSLATIONS[currentLang].skills_audio_label}</span>
                          <span className="text-emerald-400 uppercase animate-pulse flex items-center gap-1">
                        {TRANSLATIONS[currentLang].skills_select_label} <Compass className="w-3.5 h-3.5" />
                      </span>
                        </div>
                      </div>
                  ) : (
                      // Active interactive readout state
                      <div className="h-full flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded bg-[#08090C] border border-emerald-400/40 flex items-center justify-center text-lg text-emerald-400">
                                {activeSkill.icon === 'Code' ? <Code className="w-4 h-4" /> :
                                    activeSkill.icon === 'Laptop' ? <Laptop className="w-4 h-4" /> :
                                        activeSkill.icon === 'Sparkles' ? <Sparkles className="w-4 h-4" /> :
                                            activeSkill.icon === 'Compass' ? <Compass className="w-4 h-4" /> :
                                                activeSkill.icon === 'Layers' ? <Layers className="w-4 h-4" /> :
                                                    activeSkill.icon === 'Wrench' ? <Wrench className="w-4 h-4" /> :
                                                        <Code className="w-4 h-4" />}
                              </div>
                              <div>
                                <h4 className="text-lg font-bold text-white leading-none">{activeSkill.name}</h4>
                                <span className="text-[9px] text-emerald-400 uppercase tracking-wider mt-1 inline-block">
                              {activeSkill.level}
                            </span>
                              </div>
                            </div>
                          </div>

                          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                            {activeSkill.loc[currentLang] || activeSkill.loc['en']}
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                            <div className="bg-[#08090C]/40 p-3 rounded border border-slate-900 text-xs">
                              <div className="text-slate-500 uppercase">{activeSkill.statA.split(': ')[0]}</div>
                              <div className="text-white font-semibold mt-1">{activeSkill.statA.split(': ')[1]}</div>
                            </div>
                            <div className="bg-[#08090C]/40 p-3 rounded border border-slate-900 text-xs">
                              <div className="text-slate-500 uppercase">{activeSkill.statB.split(': ')[0]}</div>
                              <div className="text-white font-semibold mt-1">{activeSkill.statB.split(': ')[1]}</div>
                            </div>
                          </div>

                          <div>
                        <span className="text-[9px] text-slate-500 tracking-widest block uppercase mb-2">
                          {TRANSLATIONS[currentLang].skills_connected_label}
                        </span>
                            <div className="flex flex-wrap gap-2">
                              {activeSkill.quests.map((q) => (
                                  <span key={q} className="bg-[#08090C] border border-slate-800 text-[10px] text-slate-300 px-2.5 py-1 rounded">
                              {q}
                            </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="mt-8 pt-4 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500">
                          <span>SYS_STATUS: READY</span>
                          <button
                              onClick={() => { clickSound(); setSelectedSkillKey(null); }}
                              className="text-emerald-400 hover:underline uppercase"
                          >
                            {TRANSLATIONS[currentLang].skills_reset_label}
                          </button>
                        </div>
                      </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* QUEST LOG (PROJECTS) SECTION */}
        <section id="projects" className="py-24 border-t border-slate-900 bg-[#08090C] relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center mb-16 text-center">
              <h2 className="text-3xl font-bold text-white tracking-wide">
                {TRANSLATIONS[currentLang].projects_heading}
              </h2>
              <div className="h-0.5 w-16 bg-gradient-to-r from-emerald-400 to-transparent mt-2 rounded" />
              <p className="mt-3 text-sm text-slate-400 max-w-2xl font-mono">
                {TRANSLATIONS[currentLang].projects_subheading}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-mono">

              {/* Delight Project */}
              <div className="bg-[#11151D] border border-slate-800 rounded-lg overflow-hidden flex flex-col justify-between group hover:border-emerald-400 transition-all duration-300">
                <div>
                  <div className="p-4 flex justify-between items-center bg-[#08090C]/40 border-b border-slate-800">
                    <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                      Delight
                    </h3>
                    <div className="flex gap-2">
                      <span className="bg-[#08090C] border border-emerald-400/20 text-[9px] text-emerald-400 px-2 py-0.5 rounded">Unity</span>
                      <span className="bg-[#08090C] border border-slate-800 text-[9px] text-slate-300 px-2 py-0.5 rounded">C#</span>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="text-xs text-emerald-400/80 mb-3 uppercase tracking-wider">3D Adventure Zelda-like game</div>
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                      A gorgeous 3D puzzle-adventure heavily inspired by the Zelda series. The core gameplay loops revolve around a proprietary, dynamic rope engine developed for navigation, physics interactions, combat, and environmental pathing.
                    </p>
                  </div>
                </div>
                <div className="p-6 pt-0 border-t border-slate-800/40 mt-auto text-[10px] text-slate-500 flex items-center gap-2">
                  <Wrench className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Engine solution: Custom Rope Solver, C# Math Physics Controllers.</span>
                </div>
              </div>

              {/* Discosmos Project */}
              <div className="bg-[#11151D] border border-slate-800 rounded-lg overflow-hidden flex flex-col justify-between group hover:border-emerald-400 transition-all duration-300">
                <div>
                  <div className="p-4 flex justify-between items-center bg-[#08090C]/40 border-b border-slate-800">
                    <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                      Discosmos
                    </h3>
                    <div className="flex gap-2">
                      <span className="bg-[#08090C] border border-emerald-400/20 text-[9px] text-emerald-400 px-2 py-0.5 rounded">Unity</span>
                      <span className="bg-[#08090C] border border-slate-800 text-[9px] text-slate-300 px-2 py-0.5 rounded">C#</span>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="text-xs text-emerald-400/80 mb-3 uppercase tracking-wider">3D Fast-Paced Kinetic MOBA</div>
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                      A high-octane 3D MOBA centered on speed thresholds governed by a "hold & release" kinetic mechanic. Built core network packet structures, robust character mechanics, spell trees, and customized gameplay GUI menus.
                    </p>
                  </div>
                </div>
                <div className="p-6 pt-0 border-t border-slate-800/40 mt-auto text-[10px] text-slate-500 flex items-center gap-2">
                  <Network className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Responsibilities: Network Programmer, Spell Systems, UI/UX Design.</span>
                </div>
              </div>

              {/* Hero's Dawn Project */}
              <div className="bg-[#11151D] border border-slate-800 rounded-lg overflow-hidden flex flex-col justify-between group hover:border-emerald-400 transition-all duration-300">
                <div>
                  <div className="p-4 flex justify-between items-center bg-[#08090C]/40 border-b border-slate-800">
                    <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                      Hero's Dawn
                    </h3>
                    <div className="flex gap-2">
                      <span className="bg-[#08090C] border border-amber-400/20 text-[9px] text-amber-400 px-2 py-0.5 rounded">In Development</span>
                      <span className="bg-[#08090C] border border-emerald-400/20 text-[9px] text-emerald-400 px-2 py-0.5 rounded">Unity</span>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="text-xs text-emerald-400/80 mb-3 uppercase tracking-wider">3D Multiplayer Turn-Based RPG</div>
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                      An ambitious indie adventure RPG. Battles are executed via an Active Timeline combat engine where moves modify time meters. Developing key system structures, turn schedules, and cross-client combat data logic.
                    </p>
                  </div>
                </div>
                <div className="p-6 pt-0 border-t border-slate-800/40 mt-auto text-[10px] text-slate-500 flex items-center gap-2">
                  <Hourglass className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Primary Focus: Timeline Combat Design, Turn Sequencing Logic.</span>
                </div>
              </div>

              {/* Kiro's Journey Project */}
              <div className="bg-[#11151D] border border-slate-800 rounded-lg overflow-hidden flex flex-col justify-between group hover:border-emerald-400 transition-all duration-300">
                <div>
                  <div className="p-4 flex justify-between items-center bg-[#08090C]/40 border-b border-slate-800">
                    <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                      Kiro's Journey
                    </h3>
                    <div className="flex gap-2">
                      <span className="bg-[#08090C] border border-blue-400/20 text-[9px] text-blue-400 px-2 py-0.5 rounded">Flutter</span>
                      <span className="bg-[#08090C] border border-slate-800 text-[9px] text-slate-300 px-2 py-0.5 rounded">Dart</span>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="text-xs text-emerald-400/80 mb-3 uppercase tracking-wider">2D Narrative Decisional Game</div>
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                      An interactive 2D narrative story system programmed cleanly in Flutter and Dart. Incorporates optimized state architecture to handle nested player decisions, dialog transitions, branching storylines, and rich UI feedback.
                    </p>
                  </div>
                </div>
                <div className="p-6 pt-0 border-t border-slate-800/40 mt-auto text-[10px] text-slate-500 flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Architecture: Nested state machines, customizable Choice Matrixes.</span>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* COOP MULTIPLAYER TERMINAL INTERFACE & FORM */}
        <section id="contact" className="py-24 border-t border-slate-900 bg-[#08090C]/50 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center mb-16 text-center">
              <h2 className="text-3xl font-bold text-white tracking-wide">
                {TRANSLATIONS[currentLang].contact_heading}
              </h2>
              <div className="h-0.5 w-16 bg-gradient-to-r from-emerald-400 to-transparent mt-2 rounded" />
              <p className="mt-3 text-sm text-slate-400 max-w-2xl font-mono">
                {TRANSLATIONS[currentLang].contact_subheading}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

              {/* TERMINAL CLI CONTAINER */}
              <div className="lg:col-span-6 bg-[#11151D] border border-emerald-400/20 rounded-lg flex flex-col justify-between overflow-hidden shadow-2xl min-h-[400px]">
                {/* Header */}
                <div className="bg-[#08090C]/80 px-4 py-3 border-b border-slate-800/80 flex items-center justify-between font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-[10px] text-slate-500 tracking-wider">djason@nathiez_workspace // GEMINI-3 CLI</span>
                  <TerminalIcon className="w-4 h-4 text-emerald-400" />
                </div>

                {/* Screens Output content */}
                <div className="p-6 flex-grow overflow-y-auto space-y-3 font-mono text-xs text-slate-300 h-72 max-h-72">
                  {terminalHistory.map((line, i) => (
                      <div key={i} className="leading-relaxed">
                        {line.type === 'command' && (
                            <div className="text-emerald-400">
                              <span className="text-slate-500">guest@studio_n29:~$</span> {line.text}
                            </div>
                        )}
                        {line.type === 'reply' && (
                            <div className="text-slate-200 mt-1 pl-4 border-l border-slate-800" dangerouslySetInnerHTML={{ __html: line.text }} />
                        )}
                        {line.type === 'system' && (
                            <div className="text-slate-500">{line.text}</div>
                        )}
                        {line.type === 'error' && (
                            <div className="text-rose-500 font-semibold">{line.text}</div>
                        )}
                      </div>
                  ))}

                  {isGeneratingAI && (
                      <div className="text-purple-400 font-bold flex items-center gap-2 animate-pulse">
                        <span>⚡ [HANDSHAKE: GEMINI IA SYNAPSE EXPANSION...]</span>
                      </div>
                  )}
                  <div ref={terminalScreenEndRef} />
                </div>

                {/* Console Input submit Bar */}
                <form onSubmit={handleTerminalSubmit} className="bg-[#08090C]/50 px-4 py-3 border-t border-slate-900 flex items-center">
                  <span className="text-emerald-400 text-xs mr-2 select-none">guest@studio_n29:~$</span>
                  <input
                      type="text"
                      value={terminalInput}
                      onChange={(e) => setTerminalInput(e.target.value)}
                      placeholder="Ask Gemini anything or try quests/skills/help..."
                      className="bg-transparent text-white text-xs outline-none border-none flex-grow font-mono focus:ring-0 placeholder:text-slate-700"
                      autoComplete="off"
                  />
                </form>
              </div>

              {/* TRADITIONAL telemetry form */}
              <div className="lg:col-span-6 bg-[#11151D] border border-slate-900 rounded-lg p-8 shadow-2xl flex flex-col justify-between">
                <form onSubmit={handleFormSubmit} className="space-y-6 font-mono">
                  <h3 className="text-base font-bold text-white mb-4 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-emerald-400" />
                    <span>{TRANSLATIONS[currentLang].form_title}</span>
                  </h3>

                  <div>
                    <label htmlFor="name" className="block text-[10px] text-slate-500 uppercase tracking-widest mb-2">
                      {TRANSLATIONS[currentLang].label_name}
                    </label>
                    <input
                        type="text"
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-[#08090C] border border-slate-800 text-white p-3 rounded focus:outline-none focus:border-emerald-400 text-xs"
                        placeholder="e.g. Project Lead Hero"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-[10px] text-slate-500 uppercase tracking-widest mb-2">
                      {TRANSLATIONS[currentLang].label_email}
                    </label>
                    <input
                        type="email"
                        id="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-[#08090C] border border-slate-800 text-white p-3 rounded focus:outline-none focus:border-emerald-400 text-xs"
                        placeholder="e.g. lead@studio-hq.org"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-[10px] text-slate-500 uppercase tracking-widest mb-2">
                      {TRANSLATIONS[currentLang].label_desc}
                    </label>
                    <textarea
                        id="message"
                        rows={4}
                        required
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="w-full bg-[#08090C] border border-slate-800 text-white p-3 rounded focus:outline-none focus:border-emerald-400 text-xs resize-none"
                        placeholder="Describe your game, app pipelines, or contract specifications..."
                    />
                  </div>

                  <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-emerald-400 to-[#10B981] text-[#08090C] font-bold py-3 rounded hover:opacity-90 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>{TRANSLATIONS[currentLang].btn_transmit}</span>
                  </button>
                </form>

                {formSuccess && (
                    <div className="mt-4 p-4 bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 text-xs rounded flex items-center gap-2 font-mono">
                      <CheckCircle className="w-4 h-4 flex-shrink-0" />
                      <span>TELEMETRY LOADED! Check console commands.</span>
                    </div>
                )}
              </div>

            </div>

          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-slate-900 bg-[#08090C]/90 py-12 text-center font-mono text-[11px] text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
            <div className="flex justify-center space-x-6 text-slate-400 mb-2">
              <a href="#" onClick={clickSound} className="hover:text-emerald-400 transition-colors">GitHub</a>
              <a href="#" onClick={clickSound} className="hover:text-emerald-400 transition-colors">LinkedIn</a>
              <a href="mailto:contact@studion29.com" onClick={clickSound} className="hover:text-emerald-400 transition-colors">E-Mail</a>
            </div>
            <p>{TRANSLATIONS[currentLang].footer_text_tech}</p>
            <p>&copy; {new Date().getFullYear()} Djason Nathiez. System.exit(0);</p>
          </div>
        </footer>

      </div>
  );
}