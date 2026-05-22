import React, { useState, useEffect, useRef } from "react";
import {
  Globe,
  Terminal,
  ExternalLink,
  Send,
  Check,
  Briefcase,
  GraduationCap,
  ChevronRight,
  Play,
  Pause,
  Code
} from "lucide-react";

// --- Multi-language Translations Dictionary ---
interface TranslationDict {
  heroTitle: string;
  heroSubtitle: string;
  heroDesc: string;
  exploreBtn: string;
  aboutTitle: string;
  aboutAge: string;
  aboutOrigin: string;
  aboutDegree: string;
  aboutPhilosophy: string;
  skillsTitle: string;
  skillsSubtitle: string;
  skillLevel: string;
  skillsClickTip: string;
  skillsHoverTip: string;
  projectsTitle: string;
  projectsSubtitle: string;
  projectRole: string;
  contactTitle: string;
  contactSubtitle: string;
  contactFormName: string;
  contactFormMail: string;
  contactFormMsg: string;
  contactFormSend: string;
  contactFormSending: string;
  contactTerminalHeader: string;
  cliPlaceholder: string;
}

const translations: Record<string, TranslationDict> = {
  EN: {
    heroTitle: "DJASON NATHIEZ",
    heroSubtitle: "Junior Freelance Developer & Game Expert",
    heroDesc: "Ambitious 25-year-old creator dedicated to mastering every programming language. Translating complex mechanics into seamless, high-performance gameplay and web systems.",
    exploreBtn: "Initialize Interface",
    aboutTitle: "Developer Dossier",
    aboutAge: "Age: 25 years old",
    aboutOrigin: "Based in: Onnaing, France",
    aboutDegree: "Education: Bachelor's Degree in Game Programming - Rubika Supinfogame",
    aboutPhilosophy: "My Philosophy: Adapt and conquer. I pivoted through diverse technical, commercial, and administrative roles to refine my global operational vision. Now, as the founder of STUDIO N29, I create high-performance systems and treat artificial intelligence as a cooperative co-pilot to optimize workflows and clear technical obstacles.",
    skillsTitle: "Core Skill Tree",
    skillsSubtitle: "Hover nodes to inspect structural telemetry. Click to pin details to the HUD.",
    skillLevel: "Proficiency Level",
    skillsClickTip: "Click to lock node target",
    skillsHoverTip: "Hover core or orbit nodes",
    projectsTitle: "Active Quests & Deployments",
    projectsSubtitle: "A display of core gameplay, graphics, and server architecture.",
    projectRole: "Key Responsibilities",
    contactTitle: "Establish Connection",
    contactSubtitle: "Transmit telemetry details or execute secure terminal queries.",
    contactFormName: "Operator Name",
    contactFormMail: "Communication Frequency (Email)",
    contactFormMsg: "Transmission Content",
    contactFormSend: "Transmit Packet",
    contactFormSending: "Transmitting...",
    contactTerminalHeader: "STUDIO_N29_SHELL v1.4.0 (Type 'help' for options)",
    cliPlaceholder: "guest@n29-studio.fr:~# "
  },
  FR: {
    heroTitle: "DJASON NATHIEZ",
    heroSubtitle: "Développeur Freelance Junior & Expert Jeu Vidéo",
    heroDesc: "Créateur ambitieux de 25 ans dédié à la maîtrise de tous les langages de programmation. Traduire des mécaniques complexes en systèmes web et de jeu fluides et performants.",
    exploreBtn: "Initialiser l'Interface",
    aboutTitle: "Dossier Développeur",
    aboutAge: "Âge : 25 ans",
    aboutOrigin: "Localisation : Onnaing, France",
    aboutDegree: "Diplôme : Bachelor en Programmation de Jeux Vidéo - Rubika Supinfogame",
    aboutPhilosophy: "Ma Philosophie : Adapter et surmonter. J'ai évolué à travers divers rôles techniques, commerciaux et administratifs pour affiner ma vision opérationnelle globale. Aujourd'hui, fondateur de STUDIO N29, je crée des systèmes performants et utilise l'intelligence artificielle comme copilote pour optimiser mes flux de travail.",
    skillsTitle: "Arbre de Compétences",
    skillsSubtitle: "Survolez les nœuds pour inspecter la télémétrie. Cliquez pour verrouiller sur le HUD.",
    skillLevel: "Niveau d'Expertise",
    skillsClickTip: "Cliquer pour verrouiller la cible",
    skillsHoverTip: "Survolez le noyau ou les nœuds",
    projectsTitle: "Quêtes Actives & Déploiements",
    projectsSubtitle: "Démonstrations d'architecture de gameplay, de graphisme et de serveurs.",
    projectRole: "Responsabilités Clés",
    contactTitle: "Établir la Connexion",
    contactSubtitle: "Transmettez vos coordonnées ou exécutez des requêtes sécurisées via le terminal.",
    contactFormName: "Nom de l'Opérateur",
    contactFormMail: "Fréquence de Communication (Email)",
    contactFormMsg: "Contenu de la Transmission",
    contactFormSend: "Transmettre le Paquet",
    contactFormSending: "Transmission...",
    contactTerminalHeader: "STUDIO_N29_SHELL v1.4.0 (Tapez 'help' pour les options)",
    cliPlaceholder: "guest@n29-studio.fr:~# "
  },
  ES: {
    heroTitle: "DJASON NATHIEZ",
    heroSubtitle: "Desarrollador Freelance Junior y Experto en Videojuegos",
    heroDesc: "Creador ambicioso de 25 años dedicado a dominar todos los lenguajes de programación. Traduciendo mecánicas complejas en sistemas web y de juego fluidos y de alto rendimiento.",
    exploreBtn: "Inicializar Interfaz",
    aboutTitle: "Expediente del Desarrollador",
    aboutAge: "Edad: 25 años",
    aboutOrigin: "Ubicación: Onnaing, Francia",
    aboutDegree: "Educación: Grado de Programación de Videojuegos - Rubika Supinfogame",
    aboutPhilosophy: "Mi Filosofía: Adaptarse y conquistar. Pasé por diversos roles técnicos, comerciales y administrativos para perfeccionar mi visión operativa global. Hoy, como fundador de STUDIO N29, diseño sistemas de alto rendimiento y utilizo la inteligencia artificial como un copiloto para optimizar mis flujos de trabajo.",
    skillsTitle: "Árbol de Habilidades",
    skillsSubtitle: "Pasa el cursor sobre los nodos para ver la telemetría. Haz clic para fijarla en el HUD.",
    skillLevel: "Nivel de Dominio",
    skillsClickTip: "Haz clic para bloquear el objetivo",
    skillsHoverTip: "Pasa el cursor sobre el núcleo o nodos",
    projectsTitle: "Misiones Activas y Despliegues",
    projectsSubtitle: "Exposición de arquitectura de juego, gráficos y servidores.",
    projectRole: "Responsabilidades Clave",
    contactTitle: "Establecer Conexión",
    contactSubtitle: "Transmite detalles de telemetría o ejecuta consultas seguras en la terminal.",
    contactFormName: "Nombre del Operador",
    contactFormMail: "Frecuencia de Comunicación (Email)",
    contactFormMsg: "Contenido de la Transmisión",
    contactFormSend: "Transmitir Paquete",
    contactFormSending: "Transmitiendo...",
    contactTerminalHeader: "STUDIO_N29_SHELL v1.4.0 (Escribe 'help' para opciones)",
    cliPlaceholder: "guest@n29-studio.fr:~# "
  },
  NL: {
    heroTitle: "DJASON NATHIEZ",
    heroSubtitle: "Junior Freelance Ontwikkelaar & Game Expert",
    heroDesc: "Ambitieuze 25-jarige maker die vastbesloten is om elke programmeertaal te beheersen. Complexe spelmechanica vertalen naar soepele, hoogwaardige gameplay en websystemen.",
    exploreBtn: "Interface Initialiseren",
    aboutTitle: "Ontwikkelaarsdossier",
    aboutAge: "Leeftijd: 25 jaar",
    aboutOrigin: "Locatie: Onnaing, Frankrijk",
    aboutDegree: "Opleiding: Bachelor in Game Programming - Rubika Supinfogame",
    aboutPhilosophy: "Mijn Filosofie: Aanpassen en overwinnen. Ik heb diverse technische, commerciële en administratieve rollen doorlopen om mijn globale operationele visie te verfijnen. Nu, als oprichter van STUDIO N29, bouw ik hoogwaardige systemen en gebruik ik kunstmatige intelligentie als een copiloot om workflows te optimaliseren.",
    skillsTitle: "Vaardighedenboom",
    skillsSubtitle: "Zweef over knooppunten om telemetrie te inspecteren. Klik om vast te pinnen op de HUD.",
    skillLevel: "Vaardigheidsniveau",
    skillsClickTip: "Klik om doelwit te vergrendelen",
    skillsHoverTip: "Zweef over de kern of knooppunten",
    projectsTitle: "Actieve Quests & Implementaties",
    projectsSubtitle: "Een presentatie van kern-gameplay, graphics en serverarchitectuur.",
    projectRole: "Belangrijkste Verantwoordelijkheden",
    contactTitle: "Verbinding Tot Stand Brengen",
    contactSubtitle: "Verzend telemetriegegevens of voer veilige terminal-query's uit.",
    contactFormName: "Naam Operator",
    contactFormMail: "Communicatiefrequentie (E-mail)",
    contactFormMsg: "Inhoud Transmissie",
    contactFormSend: "Pakket Verzenden",
    contactFormSending: "Verzenden...",
    contactTerminalHeader: "STUDIO_N29_SHELL v1.4.0 (Typ 'help' voor opties)",
    cliPlaceholder: "guest@n29-studio.fr:~# "
  }
};

// --- Skills Data Interface ---
interface SkillNode {
  id: string;
  name: string;
  category: "language" | "design" | "tool";
  level: number;
  xp: number;
  maxXP: number;
  details: {
    EN: { desc: string; stats: string[]; quote: string };
    FR: { desc: string; stats: string[]; quote: string };
    ES: { desc: string; stats: string[]; quote: string };
    NL: { desc: string; stats: string[]; quote: string };
  };
}

const skillsData: SkillNode[] = [
  {
    id: "csharp",
    name: "C# / Unity",
    category: "language",
    level: 95,
    xp: 9500,
    maxXP: 10000,
    details: {
      EN: {
        desc: "Expert Unity engine integration. Over 10 games shipped across MOBA, RPG, Platformer, and Roguelike genres.",
        stats: ["Architecture: Pure Component-Driven", "Graphics: URP/HDRP Custom Pipelines", "Networking: Mirror & Netcode"],
        quote: "Code is the physics engine of reality."
      },
      FR: {
        desc: "Expertise approfondie du moteur Unity. Plus de 10 jeux développés (MOBA, RPG, Plateforme, Roguelike).",
        stats: ["Architecture : Orientée Composants", "Graphismes : Pipelines URP/HDRP", "Réseau : Mirror & Netcode"],
        quote: "Le code est le moteur physique du virtuel."
      },
      ES: {
        desc: "Experto en motor Unity. Más de 10 juegos desarrollados en géneros MOBA, RPG, Plataformas y Roguelike.",
        stats: ["Arquitectura: Componentes Puros", "Gráficos: Custom Pipelines URP/HDRP", "Red: Mirror & Netcode"],
        quote: "El código es el motor físico de la realidad."
      },
      NL: {
        desc: "Expert in de Unity-engine. Meer dan 10 games uitgebracht in MOBA, RPG, Platformer en Roguelike genres.",
        stats: ["Architectuur: Component-gestuurd", "Graphics: URP/HDRP Aangepast", "Netwerk: Mirror & Netcode"],
        quote: "Code is de physics-engine van de realiteit."
      }
    }
  },
  {
    id: "flutter",
    name: "Flutter & Dart",
    category: "language",
    level: 60,
    xp: 3200,
    maxXP: 10000,
    details: {
      EN: {
        desc: "Evolving practitioner. Authored and deployed the multiplatform narrative decisional experience 'Kiro's Journey'.",
        stats: ["UI Rendering: Custom RenderBox", "State: Provider & BLoC Pattern", "Engine: Embedded Web / Mobile canvasses"],
        quote: "Cross-platform consistency is pure efficiency."
      },
      FR: {
        desc: "Praticien en évolution. Conception et déploiement du jeu narratif multiplateforme 'Kiro's Journey'.",
        stats: ["Rendu UI : RenderBox Personnalisés", "État : Provider & BLoC", "Moteur : Intégrations Web/Mobile"],
        quote: "La cohérence multiplateforme est une efficacité pure."
      },
      ES: {
        desc: "Evolución constante. Creación y despliegue de la experiencia narrativa multiplataforma 'Kiro's Journey'.",
        stats: ["Render UI: RenderBox Personalizado", "Estado: Provider & BLoC Pattern", "Motor: Integración Web / Móvil"],
        quote: "La consistencia multiplataforma es eficiencia pura."
      },
      NL: {
        desc: "Groeiende vaardigheid. Ontwikkelaar van de multiplatform narratieve game 'Kiro's Journey'.",
        stats: ["UI Rendering: Custom RenderBox", "State: Provider & BLoC", "Engine: Embedded Web / Mobiel"],
        quote: "Cross-platform consistentie is pure efficiëntie."
      }
    }
  },
  {
    id: "python",
    name: "Python & AI",
    category: "language",
    level: 55,
    xp: 2800,
    maxXP: 10000,
    details: {
      EN: {
        desc: "System integration developer. Architected 'N29 Buddy', a localized contextual parameter AI companion.",
        stats: ["AI Integration: LLM Context Chaining", "Scripts: System & Data Automation", "Libraries: NumPy / Custom Parsing"],
        quote: "Automation frees creative minds to dream bigger."
      },
      FR: {
        desc: "Développeur d'intégration système. Architecte de 'N29 Buddy', un compagnon IA à contexte paramétrable local.",
        stats: ["Intégration IA : Chaînage de Contexte LLM", "Scripts : Automatisation de données", "Librairies : NumPy & Parsing"],
        quote: "L'automatisation libère l'esprit pour rêver plus grand."
      },
      ES: {
        desc: "Desarrollador de integración. Creador de 'N29 Buddy', un compañero de IA contextual parametrizado.",
        stats: ["Integración IA: Cadenas de Contexto LLM", "Scripts: Automatización del Sistema", "Librerías: NumPy / Parser Personalizado"],
        quote: "La automatización libera la mente para soñar más grande."
      },
      NL: {
        desc: "Systeemintegratie ontwikkelaar. Ontwerper van 'N29 Buddy', een gelokaliseerde AI-metgezel.",
        stats: ["AI-integratie: LLM Context Chaining", "Scripts: Systeemautomatisering", "Bibliotheken: NumPy / Custom Parsing"],
        quote: "Automatisering geeft de creatieve geest ruimte om groter te dromen."
      }
    }
  },
  {
    id: "typescript",
    name: "TypeScript",
    category: "language",
    level: 50,
    xp: 2500,
    maxXP: 10000,
    details: {
      EN: {
        desc: "Web systems engineer. Engineered custom client platforms, including commercial frameworks like 'centralcars.fr'.",
        stats: ["Type Safety: Strict Compilation", "Frameworks: React TSX & Tailwind v4", "API: RESTful & Streaming Node endpoints"],
        quote: "Types are the protective shields of modern code."
      },
      FR: {
        desc: "Ingénieur systèmes web. Développement de plateformes sur mesure dont le site commercial 'centralcars.fr'.",
        stats: ["Typage : Compilation Stricte", "Frameworks : React TSX & Tailwind v4", "API : Points d'accès RESTful & Node"],
        quote: "Le typage statique est le bouclier du code moderne."
      },
      ES: {
        desc: "Ingeniero de sistemas web. Desarrollo de plataformas a medida, incluyendo el portal comercial 'centralcars.fr'.",
        stats: ["Seguridad: Compilación Estricta", "Frameworks: React TSX y Tailwind v4", "API: Endpoints RESTful y Node"],
        quote: "Los tipos estáticos son los escudos protectores del código."
      },
      NL: {
        desc: "Web-systeemingenieur. Bouwer van klantspecifieke webapplicaties, waaronder het commerciële platform 'centralcars.fr'.",
        stats: ["Type-veiligheid: Strikte Compilatie", "Frameworks: React TSX & Tailwind v4", "API: RESTful & Node Endpoints"],
        quote: "Types zijn de beschermende schilden van moderne code."
      }
    }
  },
  {
    id: "gamedesign",
    name: "Game Design",
    category: "design",
    level: 88,
    xp: 8800,
    maxXP: 10000,
    details: {
      EN: {
        desc: "Mechanic-driven conceptual designer. Crafting unique speed-release pacing and active turn-based control timelines.",
        stats: ["Core Loops: Player Retention Math", "Balancing: Combat Progression Matrices", "Pacing: Tactical Choice Timers"],
        quote: "A game is a series of interesting decisions."
      },
      FR: {
        desc: "Designer conceptuel centré sur les mécaniques. Création de systèmes d'action et de chronologies de combat actives.",
        stats: ["Boucles de Jeu : Rétention & Engagement", "Équilibrage : Matrices de Combat", "Rythme : Pression Temporelle Tactique"],
        quote: "Un jeu est une suite de choix intéressants."
      },
      ES: {
        desc: "Diseñador conceptual enfocado en mecánicas. Creación de sistemas de velocidad y líneas de tiempo de combate activas.",
        stats: ["Bucles: Retención y Engagement", "Balance: Matrices de Combate", "Ritmo: Prensado de Decisiones Tácticas"],
        quote: "Un juego es una serie de decisiones interesantes."
      },
      NL: {
        desc: "Conceptueel gamedesigner. Ontwerper van unieke tempo-mechanica en actieve turn-based tijdlijnen.",
        stats: ["Core Loops: Spelerretentie", "Balancering: Gevechtsprogressie", "Tempo: Tactische Tijdlimieten"],
        quote: "Een spel is een reeks interessante beslissingen."
      }
    }
  },
  {
    id: "uiux",
    name: "UI & UX",
    category: "design",
    level: 80,
    xp: 8000,
    maxXP: 10000,
    details: {
      EN: {
        desc: "Dedicated interfaces engineer. Crafting diegetic dashboard structures and seamless player feedback systems.",
        stats: ["Diegetics: In-world HUD Integrations", "Ergonomics: Cross-platform Input Trees", "Motion: Physics-Based UI Tweens"],
        quote: "Good interfaces are felt, never noticed."
      },
      FR: {
        desc: "Ingénieur d'interfaces dédiées. Création de HUD diégétiques intégrés et de boucles de rétroaction utilisateur fluides.",
        stats: ["Diégèse : Intégrations HUD Intelligentes", "Ergonomie : Contrôles Multiplateformes", "Mouvement : Transitions Physiques"],
        quote: "Les meilleures interfaces se ressentent, elles ne se voient pas."
      },
      ES: {
        desc: "Ingeniero de interfaces dedicadas. Diseño de estructuras HUD diegéticas y sistemas de retroalimentación fluidos.",
        stats: ["Diégesis: Integración HUD en el Mundo", "Ergonomía: Controles Multiplataforma", "Movimiento: Transiciones Físicas UI"],
        quote: "Las buenas interfaces se sienten, no se notan."
      },
      NL: {
        desc: "Ontwerper van interactieve interfaces. Maker van diegetische HUD-structuren en vloeiende feedbacksystemen.",
        stats: ["Diegetics: In-world HUD Integratie", "Ergonomie: Cross-platform Controls", "Motion: Physics-based UI-animaties"],
        quote: "Goede interfaces worden gevoeld, nooit opgemerkt."
      }
    }
  },
  {
    id: "tools",
    name: "Dev Software",
    category: "tool",
    level: 85,
    xp: 8500,
    maxXP: 10000,
    details: {
      EN: {
        desc: "Technical pipelines manager. Mastering workflow tools like Git, Blender, Houdini procedural engines, and prompt engineering.",
        stats: ["VCS: Advanced Git Branching Hooks", "Graphics: Blender Low-Poly & Houdini Procedural Engine", "AI Prompting: Co-Pilot integration"],
        quote: "Our tools define our velocity."
      },
      FR: {
        desc: "Gestion de pipelines techniques. Maîtrise d'outils comme Git, Blender, Houdini et l'ingénierie de prompt IA.",
        stats: ["VCS : Flux Git Avancés & Hooks", "Graphisme : Low-Poly Blender & Houdini", "Prompt IA : Copilotes & Accélérateurs"],
        quote: "Nos outils définissent notre vélocité."
      },
      ES: {
        desc: "Gestor de pipelines técnicos. Dominio de herramientas como Git, Blender, Houdini e ingeniería de prompts de IA.",
        stats: ["VCS: Flujos de Trabajo Git Avanzados", "Gráficos: Blender Low-Poly y Houdini", "Prompts de IA: Integración de Copilotos"],
        quote: "Nuestras herramientas definen nuestra velocidad."
      },
      NL: {
        desc: "Technische pipeline manager. Beheersing van tools zoals Git, Blender, Houdini en AI prompt engineering.",
        stats: ["VCS: Geavanceerde Git-workflows", "Graphics: Blender Low-Poly & Houdini", "AI Prompting: Co-pilot integratie"],
        quote: "Onze gereedschappen bepalen onze snelheid."
      }
    }
  }
];

// --- Projects Data ---
interface ProjectItem {
  id: string;
  title: string;
  engine: string;
  roles: Record<string, string[]>;
  desc: Record<string, string>;
  icon: string;
}

const projectsData: ProjectItem[] = [
  {
    id: "delight",
    title: "Delight",
    engine: "Unity - 3D Adventure",
    roles: {
      EN: ["Core Mechanic Programmer", "Physics Solver & Tension Solver", "Player Controller Integrator"],
      FR: ["Programmeur des Mécaniques Clés", "Résolution Physique de Tension de Corde", "Contrôleur de Mouvements Joueur"],
      ES: ["Programador de Mecánicas Clave", "Simulación Física de Cuerda y Tensión", "Controlador del Jugador"],
      NL: ["Core Mechanic Ontwikkelaar", "Physics Solver & Spanningstester", "Player Controller Integrator"]
    },
    desc: {
      EN: "A stunning 3D adventure Zelda-like game designed entirely around a fully active physics-driven rope mechanic.",
      FR: "Un magnifique jeu d'aventure 3D de type Zelda, construit entièrement autour d'une mécanique de corde physique interactive.",
      ES: "Un magnífico juego de aventuras en 3D similar a Zelda, construido en torno a una mecánica de cuerda física e interactiva.",
      NL: "Een prachtig 3D-avonturenspel in Zelda-stijl, volledig ontworpen rond een dynamische fysica-gestuurde touwmechanica."
    },
    icon: "🪢"
  },
  {
    id: "discosmos",
    title: "Discosmos",
    engine: "Unity - 3D Multiplayer MOBA",
    roles: {
      EN: ["Network Systems Programmer", "Spell Casting Engine Architect", "HUD Interface & Controls Architect"],
      FR: ["Programmeur des Systèmes Réseau", "Architecte du Système de Sorts", "Architecte de l'interface et des contrôles"],
      ES: ["Programador de Redes", "Arquitecto del Sistema de Hechizos", "Diseñador del HUD y Controles"],
      NL: ["Network Systems Developer", "Spell Casting Engine Architect", "HUD Interface & Controls Ontwerper"]
    },
    desc: {
      EN: "3D multiplayer MOBA based on highly engaging physics speed release, drag, and launch kinetic control mechanics.",
      FR: "Un MOBA multijoueur 3D fondé sur des mécaniques cinétiques de charge, de relâchement et de projection.",
      ES: "Un MOBA multijugador 3D basado en mecánicas cinéticas de carga, liberación y proyección.",
      NL: "Een 3D multiplayer MOBA gebaseerd op actieve snelheidsrelease, drag en kinetische lanceermechanica."
    },
    icon: "🛸"
  },
  {
    id: "herosdawn",
    title: "Hero's Dawn",
    engine: "Unity - 3D Multiplayer Turn-Based RPG",
    roles: {
      EN: ["Lead Systems Developer", "Active Action Timeline System Architect", "Tooling & workflow designer"],
      FR: ["Développeur Système Principal", "Architecte de la Chronologie d'Actions Active", "Créateur d'outils et de workflows"],
      ES: ["Desarrollador de Sistemas Principal", "Arquitecto de Líneas de Tiempo Activas", "Herramientas de Workflow y Automatización"],
      NL: ["Lead Systems Ontwikkelaar", "Active Action Timeline Architect", "Workflow- en tooldesigner"]
    },
    desc: {
      EN: "Indie multiplayer adventure RPG combining turn-based strategic planning with active chronological timeline combat controls.",
      FR: "Un RPG d'aventure multijoueur indépendant combinant stratégie au tour par tour et contrôle actif du temps.",
      ES: "Un RPG de aventura multijugador independiente que combina estrategia por turnos y control activo del tiempo.",
      NL: "Indie multiplayer avonturen-RPG die turn-based strategie combineert met actieve chronologische gevechtscontrole."
    },
    icon: "⚔️"
  },
  {
    id: "kirosjourney",
    title: "Kiro's Journey",
    engine: "Flutter & Dart - 2D Narrative",
    roles: {
      EN: ["Lead Mobile Architect", "Decisional Dialogue Engine designer", "UI/UX Cross-platform layout developer"],
      FR: ["Architecte Mobile Principal", "Concepteur de Moteur de Dialogue Décisionnel", "Développeur UI/UX Multiplateforme"],
      ES: ["Arquitecto Móvil", "Diseñador del Motor de Diálogo Decisorio", "Desarrollador de UI/UX Multiplataforma"],
      NL: ["Lead Mobile Architect", "Ontwerper van het Dialoogsysteem", "UI/UX Cross-platform layout developer"]
    },
    desc: {
      EN: "A highly stylized, cross-platform narrative branching decision game written from scratch inside Flutter and Dart.",
      FR: "Un jeu de décisions narratives à embranchements hautement stylisé, conçu intégralement avec Flutter et Dart.",
      ES: "Un juego de decisiones narrativas con ramificaciones muy estilizado, diseñado por completo en Flutter y Dart.",
      NL: "Een gestileerd, cross-platform narratief beslissingsspel, vanaf nul opgebouwd in Flutter en Dart."
    },
    icon: "📖"
  }
];

// --- Synth Sound Engine Implementation (Inline Web Audio) ---
class PortSynth {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
  }

  playTick() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch {
      // Audio block muted/prevented
    }
  }

  playSuccess() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.setValueAtTime(880, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch {
      // Audio block muted/prevented
    }
  }
}

const synth = new PortSynth();

// --- Main App Component ---
export default function App() {
  const [lang, setLang] = useState<"EN" | "FR" | "ES" | "NL">("EN");
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [activeSkill, setActiveSkill] = useState<SkillNode>(skillsData[0]);
  const [hoveredSkill, setHoveredSkill] = useState<SkillNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "INITIALIZING SECURE Handshake with STUDIO_N29 Engine...",
    "HANDSHAKE SUCCESSFUL.",
    "Type 'help' for available command vectors."
  ]);
  const [terminalInput, setTerminalInput] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Auto-scroll terminal logs to bottom
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalLogs]);

  // Handle ambient cyberpunk hum synthesized dynamically
  useEffect(() => {
    if (musicPlaying) {
      try {
        const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtxClass();
        audioCtxRef.current = ctx;

        // Custom low procedural ambient synthesizer
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = "triangle";
        osc1.frequency.setValueAtTime(65.41, ctx.currentTime); // C2 chord fundamental

        osc2.type = "sine";
        osc2.frequency.setValueAtTime(98.00, ctx.currentTime); // G2 fifth overtone

        gain.gain.setValueAtTime(0.03, ctx.currentTime);

        // Filter out extreme high harmonics
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(150, ctx.currentTime);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc1.start();
        osc2.start();

        // Keep local node pointers to stop play easily
        return () => {
          osc1.stop();
          osc2.stop();
          ctx.close();
        };
      } catch {
        // Audio engine failure catch
      }
    }
  }, [musicPlaying]);

  const handleToggleMusic = () => {
    synth.playTick();
    setMusicPlaying(!musicPlaying);
  };

  // --- Skill Wheel Core Event Handlers ---
  const handleSkillHover = (e: React.MouseEvent, skill: SkillNode | null) => {
    if (skill) {
      synth.playTick();
      setHoveredSkill(skill);
      setTooltipPos({ x: e.clientX, y: e.clientY });
    } else {
      setHoveredSkill(null);
    }
  };

  const handleSkillMove = (e: React.MouseEvent) => {
    if (hoveredSkill) {
      setTooltipPos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleSkillClick = (skill: SkillNode) => {
    synth.playSuccess();
    setActiveSkill(skill);
  };

  // --- Google Gemini Integration Command Solver ---
  const handleSendCommand = async () => {
    if (!terminalInput.trim()) return;
    const cmd = terminalInput.trim();
    synth.playTick();

    setTerminalLogs(prev => [...prev, `guest@n29-studio.fr:~# ${cmd}`]);
    setTerminalInput("");

    const lowerCmd = cmd.toLowerCase();

    // Standard Terminal Utilities
    if (lowerCmd === "help") {
      setTerminalLogs(prev => [
        ...prev,
        "=== SECURITY COMMAND VECTORS ===",
        "  help      - Print active console navigation guide.",
        "  clear     - Clean all logs from terminal screen.",
        "  quests    - Retrieve full lists of active studio work.",
        "  about     - Retrieve telemetry biographical profile.",
        "  contact   - Display immediate communications routing.",
        "",
        "💡 Ask me anything directly! I am integrated with Google Gemini",
        "   and can discuss architecture, Unity C#, or freelance work."
      ]);
      return;
    }

    if (lowerCmd === "clear") {
      setTerminalLogs([]);
      return;
    }

    if (lowerCmd === "quests") {
      setTerminalLogs(prev => [
        ...prev,
        "📂 RETRIEVING ARCHIVE QUESTS...",
        "---",
        "1. [UNITY] DELIGHT: 3D adventure utilizing complex real-time physics rope mechanics.",
        "2. [UNITY] DISCOSMOS: 3D MOBA deploying hold/release kinetic drag and throw vectors.",
        "3. [UNITY] HERO'S DAWN: Active action timeline turn-based tactical RPG (Current Project).",
        "4. [FLUTTER] KIRO'S JOURNEY: Stylized cross-platform narrative branching decision UI.",
        "---"
      ]);
      return;
    }

    if (lowerCmd === "about") {
      setTerminalLogs(prev => [
        ...prev,
        "👤 Telemetry Profile: Djason Nathiez | 25 | Onnaing, France",
        "🏫 Education: Game Programmer degree from Rubika Supinfogame.",
        "🔥 Mission: Master every programming language. Founder of STUDIO N29.",
        "💡 Workflow: Treats artificial intelligence as an advanced cooperative co-pilot."
      ]);
      return;
    }

    if (lowerCmd === "contact") {
      setTerminalLogs(prev => [
        ...prev,
        "✉️ Direct Dispatch Available: dnathiez.pro@gmail.com",
        "💼 Freelance Booking: Available for immediate remote assignments.",
        "⚡ STUDIO N29 ready for secure integration."
      ]);
      return;
    }

    // AI API Request Handshake with Gemini 3 Flash
    setIsAiTyping(true);
    setTerminalLogs(prev => [...prev, "🤖 [GEMINI AI PROMPT] Processing neural routing..."]);

    const systemPrompt = `You are Djason NATHIEZ, answering all questions in first-person as a professional 25-year-old developer. 
You live in Onnaing, France. You graduated from Rubika Supinfogame, where you developed paper board games, 2D pixel platformers, roguelikes, and 3D adventure titles.
After studies, you pivoted through commercial work, IT operations, and automotive garage administration to gather deep real-world workflow experience. You never stopped programing, continually experimenting and learning.
You founded your company, STUDIO N29, to work as an ambitious freelance developer ready for new technical challenges.
You are currently engineering a stunning 3D Multiplayer Adventure RPG, 'Hero's Dawn', with active action timelines and turn-based competitive mechanics.
You are highly AI-aware, utilizing AI as a powerful copilot/workflow buddy to accelerate tasks, not replace developer ingenuity.
You are happily pacsé with your wife and cherish your small family (keep this as structural context; do not declare it unless directly questioned).
Always remain cool, polite, and fully in character. If a query escapes your background or triggers validation errors, kindly redirect the operator to contact you directly at dnathiez.pro@gmail.com.`;

    try {
      const apiKey = ""; // Built-in preview environment provides the key automatically
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: cmd }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] }
        })
      });

      if (!response.ok) {
        throw new Error("Handshake connection failed.");
      }

      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "Unable to parse connection packet. Please reach out to dnathiez.pro@gmail.com.";

      // Simulate retro-typing response
      simulateTerminalTyping(text);
    } catch {
      setTerminalLogs(prev => [
        ...prev,
        "❌ ROUTING ERROR: Direct AI pipeline timeout.",
        "💡 FALLBACK: Please direct-dispatch queries to dnathiez.pro@gmail.com"
      ]);
      setIsAiTyping(false);
    }
  };

  const simulateTerminalTyping = (text: string) => {
    const words = text.split(" ");
    let currentWordIndex = 0;
    let accumulatedText = "🤖 DJASON_AI: ";

    setTerminalLogs(prev => [...prev, accumulatedText]);

    const interval = setInterval(() => {
      if (currentWordIndex < words.length) {
        accumulatedText += words[currentWordIndex] + " ";
        setTerminalLogs(prev => {
          const next = [...prev];
          next[next.length - 1] = accumulatedText;
          return next;
        });
        currentWordIndex++;
      } else {
        clearInterval(interval);
        setIsAiTyping(false);
        synth.playSuccess();
      }
    }, 45); // Typing speed
  };

  // --- Dynamic Math Variables for Skill Wheel Orbital Mapping ---
  const wheelRadius = 140; // SVG circle radius

  return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950 relative overflow-x-hidden">
        {/* Decorative Matrix Background Effect */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-slate-900/40 via-slate-950/90 to-slate-950 pointer-events-none z-0" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none z-0" />

        {/* --- INLINE CSS KEYFRAME INJECTIONS --- */}
        <style>{`
        @keyframes orbitSpinCounter {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes orbitSpinClockwise {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulseGlow {
          0%, 100% { filter: drop-shadow(0 0 4px rgba(16, 185, 129, 0.4)); opacity: 0.8; }
          50% { filter: drop-shadow(0 0 16px rgba(16, 185, 129, 0.8)); opacity: 1; }
        }
        @keyframes laserFlow {
          from { stroke-dashoffset: 60; }
          to { stroke-dashoffset: 0; }
        }
        .orbit-spin-cc {
          animation: orbitSpinCounter 45s linear infinite;
        }
        .orbit-spin-cw {
          animation: orbitSpinClockwise 30s linear infinite;
        }
        .core-pulse {
          animation: pulseGlow 4s ease-in-out infinite;
        }
      `}</style>

        {/* --- FLOATING SKILL TOOLTIP POPUP --- */}
        {hoveredSkill && (
            <div
                className="fixed pointer-events-none z-50 bg-slate-950/90 backdrop-blur-md border border-emerald-500/50 rounded-lg p-4 w-72 shadow-[0_0_20px_rgba(16,185,129,0.25)] text-left transition-transform duration-75"
                style={{
                  left: `${tooltipPos.x + 15}px`,
                  top: `${tooltipPos.y + 15}px`
                }}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-mono text-emerald-400 tracking-wider uppercase">{hoveredSkill.category}</span>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded">LVL {hoveredSkill.level}</span>
              </div>
              <h4 className="text-sm font-bold text-slate-100 mb-1">{hoveredSkill.name}</h4>
              <p className="text-xs text-slate-400 leading-relaxed mb-2">
                {hoveredSkill.details[lang].desc}
              </p>
              <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-300"
                    style={{ width: `${(hoveredSkill.xp / hoveredSkill.maxXP) * 100}%` }}
                />
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-[10px] font-mono text-slate-500">XP {hoveredSkill.xp} / {hoveredSkill.maxXP}</span>
                <span className="text-[10px] font-mono text-emerald-400/80 animate-pulse">{translations[lang].skillsClickTip}</span>
              </div>
            </div>
        )}

        {/* --- HEADER NAVIGATION --- */}
        <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 px-4 lg:px-8 py-4 transition-all duration-300">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            {/* Logo Brand */}
            <a href="#hero" className="flex items-center gap-2 group" onClick={() => synth.playTick()}>
              <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-sm tracking-tighter group-hover:border-emerald-400 transition-colors">
                N29
              </div>
              <span className="font-mono text-xs tracking-wider font-bold text-slate-300 group-hover:text-emerald-400 transition-colors">STUDIO N29</span>
            </a>

            {/* Nav Actions */}
            <div className="flex items-center gap-4">
              {/* Ambient Audio controller */}
              <button
                  onClick={handleToggleMusic}
                  className={`p-2 rounded border transition-all ${
                      musicPlaying
                          ? "bg-emerald-500/10 border-emerald-400/40 text-emerald-400"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                  title="Ambient Cyber Hum Synth"
              >
                {musicPlaying ? <Pause size={16} className="animate-pulse" /> : <Play size={16} />}
              </button>

              {/* Custom Multi-Language Dropdown Selection */}
              <div className="relative">
                <button
                    onClick={() => { synth.playTick(); setLangDropdownOpen(!langDropdownOpen); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700 transition-all font-mono text-xs"
                >
                  <Globe size={14} className="text-emerald-400" />
                  <span>{lang}</span>
                </button>

                {langDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-32 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl overflow-hidden z-50">
                      {(["EN", "FR", "ES", "NL"] as const).map((l) => (
                          <button
                              key={l}
                              onClick={() => {
                                synth.playSuccess();
                                setLang(l);
                                setLangDropdownOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2 text-xs font-mono transition-colors hover:bg-slate-800 ${
                                  lang === l ? "text-emerald-400 bg-emerald-950/20 font-bold" : "text-slate-400"
                              }`}
                          >
                            {l === "EN" && "English"}
                            {l === "FR" && "Français"}
                            {l === "ES" && "Español"}
                            {l === "NL" && "Nederlands"}
                          </button>
                      ))}
                    </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* --- HERO SECTION --- */}
        <section id="hero" className="relative min-h-[85vh] flex items-center px-4 lg:px-8 z-10">
          <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center py-12">
            {/* Main Info */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 font-mono text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>STUDIO N29 FOUNDER</span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-white leading-none">
                {translations[lang].heroTitle}
              </h1>
              <p className="text-xl lg:text-2xl font-semibold text-emerald-400 tracking-wide">
                {translations[lang].heroSubtitle}
              </p>
              <p className="text-slate-400 text-base lg:text-lg max-w-xl leading-relaxed">
                {translations[lang].heroDesc}
              </p>
              <div className="pt-4 flex flex-wrap gap-4">
                <a
                    href="#skills"
                    onClick={() => synth.playSuccess()}
                    className="px-6 py-3 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm tracking-wide transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]"
                >
                  {translations[lang].exploreBtn}
                </a>
                <a
                    href="#contact"
                    onClick={() => synth.playTick()}
                    className="px-6 py-3 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all font-mono text-sm"
                >
                  guest@n29-studio.fr:~#
                </a>
              </div>
            </div>

            {/* Large Retro Cybernetic Terminal HUD Decoration */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="w-full max-w-md bg-slate-900/60 border border-slate-800 rounded-lg p-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500" />
                <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/40" />
                  </div>
                  <span className="font-mono text-[10px] text-slate-500 tracking-wider">TELEMETRY_HUD</span>
                </div>
                <div className="space-y-3 font-mono text-xs text-slate-400 text-left">
                  <div className="flex justify-between border-b border-slate-800/40 pb-1">
                    <span className="text-slate-500">FREELANCE STATUS</span>
                    <span className="text-emerald-400 font-bold">READY_TO_DEPLOY</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/40 pb-1">
                    <span className="text-slate-500">OPERATOR AGE</span>
                    <span className="text-white">25_YEARS_OLD</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/40 pb-1">
                    <span className="text-slate-500">PRIMARY ENGINE</span>
                    <span className="text-white">UNITY_C#_EXPERT</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/40 pb-1">
                    <span className="text-slate-500">CROSS-PLATFORM</span>
                    <span className="text-emerald-400">FLUTTER_&_DART</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/40 pb-1">
                    <span className="text-slate-500">WEBSITE TS</span>
                    <span className="text-white">TYPESCRIPT_READY</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-slate-500">STUDIO BASE</span>
                    <span className="text-white">STUDIO_N29_FR</span>
                  </div>
                </div>

                {/* Spinning Mini Radar Visual */}
                <div className="mt-6 flex justify-center relative">
                  <div className="w-24 h-24 rounded-full border border-emerald-500/20 flex items-center justify-center relative">
                    <div className="absolute inset-0 rounded-full border-t border-emerald-500/60 animate-spin" />
                    <div className="absolute inset-2 rounded-full border border-emerald-500/10" />
                    <div className="w-2 h-2 rounded-full bg-emerald-500 core-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- DEVELOPER DOSSIER SECTION --- */}
        <section id="about" className="py-24 px-4 lg:px-8 border-t border-slate-900 bg-slate-950/50">
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="text-center space-y-2">
              <h2 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                {translations[lang].aboutTitle}
              </h2>
              <div className="w-12 h-1 bg-emerald-500 mx-auto rounded" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
              <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-lg space-y-3">
                <div className="w-10 h-10 rounded bg-emerald-950/40 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Briefcase size={20} />
                </div>
                <h3 className="text-lg font-bold text-white">Freelance Operator</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {translations[lang].aboutAge} <br />
                  {translations[lang].aboutOrigin}
                </p>
              </div>

              <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-lg space-y-3">
                <div className="w-10 h-10 rounded bg-emerald-950/40 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <GraduationCap size={20} />
                </div>
                <h3 className="text-lg font-bold text-white">Academic Training</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {translations[lang].aboutDegree}
                </p>
              </div>

              <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-lg space-y-3">
                <div className="w-10 h-10 rounded bg-emerald-950/40 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Code size={20} />
                </div>
                <h3 className="text-lg font-bold text-white">Multi-Role Agility</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Pivoted through commercial, IT operations, and automotive administration tasks to master operational processes.
                </p>
              </div>
            </div>

            <div className="bg-slate-900/30 border border-slate-800/60 p-8 rounded-lg text-left max-w-4xl mx-auto">
              <p className="text-slate-300 leading-relaxed text-base italic">
                {translations[lang].aboutPhilosophy}
              </p>
            </div>
          </div>
        </section>

        {/* --- SKILLS WHEEL SECTION --- */}
        <section id="skills" className="py-24 px-4 lg:px-8 border-t border-slate-900 relative">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="text-center space-y-2">
              <h2 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                {translations[lang].skillsTitle}
              </h2>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                {translations[lang].skillsSubtitle}
              </p>
              <div className="w-12 h-1 bg-emerald-500 mx-auto rounded" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* SVG Interactive Skill Wheel Column */}
              <div className="lg:col-span-6 flex justify-center select-none" onMouseMove={handleSkillMove}>
                <div className="relative w-[340px] h-[340px] sm:w-[380px] sm:h-[380px] flex items-center justify-center bg-slate-950/40 border border-slate-900 rounded-full p-4 shadow-[inset_0_0_30px_rgba(15,23,42,0.8)]">

                  {/* Embedded Spinning Decors */}
                  <div className="absolute inset-10 rounded-full border border-dashed border-slate-800/60 orbit-spin-cc" />
                  <div className="absolute inset-16 rounded-full border border-dashed border-emerald-500/5 orbit-spin-cw" />
                  <div className="absolute inset-28 rounded-full border border-dashed border-slate-800/40 orbit-spin-cc" />

                  {/* Main Interactive SVG Workspace */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-auto" viewBox="0 0 380 380">
                    <defs>
                      {/* Laser Connections Gradients */}
                      <linearGradient id="laserGradActive" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8" />
                      </linearGradient>
                      <linearGradient id="laserGradIdle" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#1e293b" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#334155" stopOpacity="0.1" />
                      </linearGradient>

                      {/* Laser Pulse Glow Effect */}
                      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>

                    {/* Draw connection laser lines from center (190, 190) to each skill coordinates */}
                    {skillsData.map((skill, index) => {
                      const angle = (index * 2 * Math.PI) / skillsData.length;
                      const destX = 190 + wheelRadius * Math.cos(angle);
                      const destY = 190 + wheelRadius * Math.sin(angle);
                      const isSelected = activeSkill?.id === skill.id;
                      const isHovered = hoveredSkill?.id === skill.id;

                      return (
                          <g key={`laser-${skill.id}`}>
                            <line
                                x1="190"
                                y1="190"
                                x2={destX}
                                y2={destY}
                                stroke={isSelected || isHovered ? "url(#laserGradActive)" : "url(#laserGradIdle)"}
                                strokeWidth={isSelected || isHovered ? "2.5" : "1"}
                                className="transition-all duration-300"
                                style={
                                  isSelected || isHovered
                                      ? {
                                        strokeDasharray: "8, 4",
                                        animation: "laserFlow 1.5s linear infinite"
                                      }
                                      : {}
                                }
                            />
                            {(isSelected || isHovered) && (
                                <line
                                    x1="190"
                                    y1="190"
                                    x2={destX}
                                    y2={destY}
                                    stroke="#10b981"
                                    strokeWidth="1.5"
                                    opacity="0.6"
                                    filter="url(#glow)"
                                    className="transition-all duration-300"
                                    style={{
                                      strokeDasharray: "15, 30",
                                      animation: "laserFlow 0.8s linear infinite"
                                    }}
                                />
                            )}
                          </g>
                      );
                    })}

                    {/* Center Core Button */}
                    <circle
                        cx="190"
                        cy="190"
                        r="32"
                        fill="#020617"
                        stroke="#10b981"
                        strokeWidth="2"
                        className="core-pulse cursor-pointer transition-colors hover:fill-slate-900"
                        onClick={() => {
                          synth.playSuccess();
                          setHoveredSkill(null);
                        }}
                    />
                    <text
                        x="190"
                        y="193"
                        textAnchor="middle"
                        fill="#10b981"
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="monospace"
                        className="pointer-events-none select-none"
                    >
                      N29_CORE
                    </text>

                    {/* Nodes Render Loop */}
                    {skillsData.map((skill, index) => {
                      const angle = (index * 2 * Math.PI) / skillsData.length;
                      const cx = 190 + wheelRadius * Math.cos(angle);
                      const cy = 190 + wheelRadius * Math.sin(angle);
                      const isSelected = activeSkill?.id === skill.id;
                      const isHovered = hoveredSkill?.id === skill.id;

                      return (
                          <g
                              key={skill.id}
                              className="cursor-pointer"
                              onMouseEnter={(e) => handleSkillHover(e, skill)}
                              onMouseLeave={(e) => handleSkillHover(e, null)}
                              onClick={() => handleSkillClick(skill)}
                          >
                            {/* Outer Glow Circle */}
                            <circle
                                cx={cx}
                                cy={cy}
                                r={isSelected ? "22" : "18"}
                                fill={isSelected ? "rgba(16, 185, 129, 0.15)" : isHovered ? "rgba(16, 185, 129, 0.08)" : "rgba(15, 23, 42, 0.8)"}
                                stroke={isSelected ? "#10b981" : isHovered ? "#34d399" : "#1e293b"}
                                strokeWidth={isSelected ? "2.5" : "1.5"}
                                className="transition-all duration-300"
                            />

                            {/* Node Label Characters */}
                            <text
                                x={cx}
                                y={cy + 4}
                                textAnchor="middle"
                                fill={isSelected ? "#ffffff" : isHovered ? "#34d399" : "#94a3b8"}
                                fontSize="10"
                                fontWeight={isSelected ? "bold" : "normal"}
                                fontFamily="monospace"
                                className="pointer-events-none select-none transition-colors duration-300"
                            >
                              {skill.id === "gamedesign" ? "GD" : skill.id === "typescript" ? "TS" : skill.id === "csharp" ? "C#" : skill.id === "flutter" ? "FL" : skill.id === "python" ? "PY" : skill.id === "uiux" ? "UI" : "DEV"}
                            </text>
                          </g>
                      );
                    })}
                  </svg>
                </div>
              </div>

              {/* Selected Skill HUD Target Panel */}
              <div className="lg:col-span-6 text-left">
                {activeSkill ? (
                    <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-6 space-y-6 relative overflow-hidden backdrop-blur-md shadow-2xl">
                      {/* Neon top-border highlight */}
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />

                      {/* Category and skill headers */}
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest">{activeSkill.category} telemetry_node</span>
                          <h3 className="text-2xl font-bold text-white mt-1">{activeSkill.name}</h3>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-mono text-slate-500">Node Experience</span>
                          <p className="text-lg font-mono text-white font-bold">LVL {activeSkill.level}</p>
                        </div>
                      </div>

                      {/* Decisional Progress Indicator */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-mono text-slate-400">
                          <span>XP: {activeSkill.xp} / {activeSkill.maxXP}</span>
                          <span>{translations[lang].skillLevel}: {activeSkill.level}%</span>
                        </div>
                        <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-800">
                          <div
                              className="bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 h-full rounded-full transition-all duration-500"
                              style={{ width: `${(activeSkill.xp / activeSkill.maxXP) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Custom Description Paragraph */}
                      <div className="space-y-1">
                        <span className="text-xs font-mono text-slate-500">Summary description</span>
                        <p className="text-slate-300 text-sm leading-relaxed">
                          {activeSkill.details[lang].desc}
                        </p>
                      </div>

                      {/* Core Telemetry Specs Sublists */}
                      <div className="space-y-2">
                        <span className="text-xs font-mono text-slate-500">Key Subsystems</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {activeSkill.details[lang].stats.map((stat, i) => (
                              <div key={i} className="flex items-center gap-2 bg-slate-950/40 border border-slate-800/60 px-3 py-2 rounded text-xs text-slate-300 font-mono">
                                <ChevronRight size={12} className="text-emerald-400" />
                                <span>{stat}</span>
                              </div>
                          ))}
                        </div>
                      </div>

                      {/* Quote block */}
                      <div className="border-l-2 border-emerald-500/40 pl-4 py-1 italic text-xs text-slate-400 font-mono">
                        "{activeSkill.details[lang].quote}"
                      </div>
                    </div>
                ) : (
                    <div className="bg-slate-900/20 border border-dashed border-slate-800 rounded-lg p-12 text-center text-slate-500">
                      {translations[lang].skillsHoverTip}
                    </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* --- PROJECTS SECTION --- */}
        <section id="projects" className="py-24 px-4 lg:px-8 border-t border-slate-900 bg-slate-950/40">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="text-center space-y-2">
              <h2 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                {translations[lang].projectsTitle}
              </h2>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                {translations[lang].projectsSubtitle}
              </p>
              <div className="w-12 h-1 bg-emerald-500 mx-auto rounded" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {projectsData.map((project) => (
                  <div
                      key={project.id}
                      className="bg-slate-900/40 border border-slate-800 hover:border-emerald-500/30 transition-all duration-300 rounded-lg p-6 text-left flex flex-col justify-between group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />

                    <div className="space-y-4">
                      {/* Project Title and Engine tags */}
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{project.icon}</span>
                        <div>
                          <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                            {project.title}
                          </h3>
                          <span className="text-xs font-mono text-emerald-400/80 uppercase">{project.engine}</span>
                        </div>
                      </div>

                      {/* Project Description */}
                      <p className="text-sm text-slate-400 leading-relaxed">
                        {project.desc[lang]}
                      </p>

                      {/* Roles and Responsibilities sublist */}
                      <div className="space-y-2">
                        <span className="text-xs font-mono text-slate-500 block">{translations[lang].projectRole}</span>
                        <ul className="space-y-1">
                          {project.roles[lang].map((role, idx) => (
                              <li key={idx} className="text-xs text-slate-300 flex items-center gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-emerald-400" />
                                <span>{role}</span>
                              </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between">
                      {/* Decorative badge */}
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                    SYSTEM_DEPLOYED
                  </span>

                      {project.id === "kirosjourney" ? (
                          <div className="text-xs font-mono text-emerald-400/80 flex items-center gap-1">
                            <span>Narrative branch unlocked</span>
                          </div>
                      ) : (
                          <div className="text-xs font-mono text-emerald-400/80 flex items-center gap-1">
                            <span>Unity Pipeline</span>
                          </div>
                      )}
                    </div>
                  </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- CONTACT & COMMAND SHELL SECTION --- */}
        <section id="contact" className="py-24 px-4 lg:px-8 border-t border-slate-900 relative">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="text-center space-y-2">
              <h2 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                {translations[lang].contactTitle}
              </h2>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                {translations[lang].contactSubtitle}
              </p>
              <div className="w-12 h-1 bg-emerald-500 mx-auto rounded" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              {/* Interactive Terminal Shell (Left 7 Columns) */}
              <div className="lg:col-span-7 flex flex-col h-[420px] bg-slate-950 border border-slate-900 rounded-lg shadow-2xl relative overflow-hidden">
                {/* Terminal header */}
                <div className="bg-slate-900 px-4 py-2 flex items-center justify-between border-b border-slate-800 select-none">
                  <div className="flex items-center gap-1.5">
                    <Terminal size={14} className="text-emerald-400" />
                    <span className="text-xs font-mono text-slate-300">{translations[lang].contactTerminalHeader}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                </div>

                {/* Logs Screen Area */}
                <div className="flex-1 p-4 overflow-y-auto font-mono text-xs text-left space-y-2 bg-slate-950/80">
                  {terminalLogs.map((log, index) => (
                      <div key={index} className="whitespace-pre-wrap leading-relaxed text-slate-300">
                        {log}
                      </div>
                  ))}
                  {isAiTyping && (
                      <div className="flex items-center gap-1 text-emerald-400 text-xs">
                        <span className="animate-pulse">Thinking...</span>
                        <span className="w-1.5 h-3.5 bg-emerald-400 animate-pulse" />
                      </div>
                  )}
                  <div ref={terminalEndRef} />
                </div>

                {/* Input console area */}
                <div className="bg-slate-900 border-t border-slate-800 px-3 py-2 flex items-center">
                <span className="text-xs font-mono text-emerald-400 pr-1 select-none">
                  {translations[lang].cliPlaceholder}
                </span>
                  <input
                      type="text"
                      value={terminalInput}
                      onChange={(e) => setTerminalInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSendCommand();
                        }
                      }}
                      placeholder="Ask me something, like 'What is Studio N29?'..."
                      className="flex-1 bg-transparent text-xs font-mono text-white outline-none border-none placeholder-slate-600 focus:ring-0 focus:border-none p-0"
                  />
                </div>
              </div>

              {/* Basic Static Form (Right 5 Columns) */}
              <div className="lg:col-span-5 bg-slate-900/40 border border-slate-800 rounded-lg p-6 text-left relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/20" />

                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase">{translations[lang].contactFormName}</label>
                    <input
                        type="text"
                        required
                        placeholder="John Doe"
                        className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors placeholder-slate-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase">{translations[lang].contactFormMail}</label>
                    <input
                        type="email"
                        required
                        placeholder="john@example.com"
                        className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors placeholder-slate-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-500 uppercase">{translations[lang].contactFormMsg}</label>
                    <textarea
                        rows={4}
                        required
                        placeholder="Type message content..."
                        className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors placeholder-slate-600 resize-none"
                    />
                  </div>

                  <button
                      type="submit"
                      onClick={() => {
                        synth.playSuccess();
                        setTerminalLogs(prev => [
                          ...prev,
                          "📥 TRANSMITTING CONTACT packet...",
                          "✅ SUCCESS: Form parameters queued successfully. I will get back to you shortly!"
                        ]);
                      }}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm tracking-wide py-3 rounded transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)]"
                  >
                    <Send size={16} />
                    <span>{translations[lang].contactFormSend}</span>
                  </button>
                </form>

                {/* Sub-footer metadata */}
                <div className="mt-6 pt-4 border-t border-slate-800/60 flex justify-between items-center text-[10px] font-mono text-slate-500">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <Check size={10} className="text-emerald-400" />
                  <span>STUDIO_N29_OK</span>
                </span>
                  <span>Onnaing, France</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- SITE FOOTER --- */}
        <footer className="py-12 px-4 border-t border-slate-900 bg-slate-950 text-slate-500 text-center">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono">
            <p>© 2026 Djason Nathiez - STUDIO N29. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="https://centralcars.fr" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors flex items-center gap-1">
                <span>centralcars.fr</span>
                <ExternalLink size={12} />
              </a>
              <span className="text-slate-800">|</span>
              <span className="text-emerald-500/80">dnathiez.pro@gmail.com</span>
            </div>
          </div>
        </footer>
      </div>
  );
}