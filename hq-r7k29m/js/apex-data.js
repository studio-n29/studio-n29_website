/* Apex Prompt Studio — data tables (ported unchanged from the original standalone tool).
   FR label + EN value used in the generated prompt. */
(function () {
  "use strict";
  const CUSTOM = "__custom__";
  // ---------- Bases de données : [libellé FR, valeur EN utilisée dans le prompt] ----------
    const DATA = {
      sexe: [["Mâle", "man"], ["Femelle", "woman"]],
  
      role: [
        ["Super-héros", "superhero"], ["Anti-héros", "anti-hero"], ["Vilain", "villain"],
        ["Mercenaire", "mercenary"], ["Militaire", "military soldier"],
        ["Soldat d'élite", "elite special forces operative"], ["Policier", "police officer"],
        ["Détective", "detective"], ["Agent secret", "secret agent"], ["Civil", "civilian"],
        ["Journaliste", "journalist"], ["Médecin", "doctor"], ["Scientifique", "scientist"],
        ["Ingénieur", "engineer"], ["Hacker", "hacker"], ["Pilote", "pilot"],
        ["Chasseur", "hunter"], ["Survivant", "survivor"], ["Pillard", "raider"],
        ["Chef de guerre", "warlord"], ["Mage", "mage"], ["Moine guerrier", "warrior monk"],
        ["Mécanicien", "mechanic"], ["Ouvrier", "factory worker"], ["Mentor", "mentor"]
      ],
  
      age: [
        ["Fin de l'adolescence (17-19 ans)", "late teens"], ["Début de la vingtaine", "early 20s"],
        ["Milieu de la vingtaine", "mid 20s"], ["Fin de la vingtaine", "late 20s"],
        ["Début de la trentaine", "early 30s"], ["Milieu de la trentaine", "mid 30s"],
        ["Fin de la trentaine", "late 30s"], ["Quarantaine", "in their 40s"],
        ["Cinquantaine", "in their 50s"], ["Soixantaine", "in their 60s"],
        ["Soixante-dix ans", "in their 70s"], ["Très âgé", "elderly"]
      ],
  
      peau: [
        ["Très pâle", "very pale skin"], ["Pâle", "pale skin"], ["Clair", "fair skin"],
        ["Beige clair", "light beige skin"], ["Mate", "olive skin"], ["Bronzé", "tanned skin"],
        ["Caramel", "caramel skin"], ["Brun", "brown skin"], ["Brun foncé", "dark brown skin"],
        ["Ébène", "deep ebony skin"], ["Bronze", "bronze skin"], ["Doré", "golden skin"],
        ["Cuivré", "copper-toned skin"], ["Gris cendré (fantastique)", "ashen grey skin"],
        ["Bleuté (fantastique)", "blue-tinted skin"], ["Verdâtre (fantastique)", "green-tinted skin"],
        ["Métallique (fantastique)", "metallic skin"]
      ],
  
      ethnie: [
        ["Européenne", "European features"], ["Nordique", "Nordic features"],
        ["Slave", "Slavic features"], ["Méditerranéenne", "Mediterranean features"],
        ["Ibérique", "Iberian features"], ["Moyen-orientale", "Middle Eastern features"],
        ["Nord-africaine", "North African features"], ["Subsaharienne", "Sub-Saharan African features"],
        ["Afro-caribéenne", "Afro-Caribbean features"], ["Est-asiatique", "East Asian features"],
        ["Sud-asiatique", "South Asian features"], ["Asie du Sud-Est", "Southeast Asian features"],
        ["Latino-américaine", "Latin American features"], ["Amérindienne", "Indigenous American features"],
        ["Océanienne", "Pacific Islander features"], ["Métisse", "mixed heritage features"]
      ],
  
      cheveux: [
        ["Rasés", "shaved head"], ["Très courts", "very short cropped hair"],
        ["Coupe militaire", "military buzz cut"], ["Undercut", "undercut hairstyle"],
        ["Courts en bataille", "short messy hair"], ["Courts coiffés", "short neatly styled hair"],
        ["En pointes", "spiky hair"], ["Crête", "spiky mohawk"], ["Pompadour", "voluminous pompadour"],
        ["Plaqués en arrière", "hair slicked back"], ["Mèche sur l'œil", "hair falling over one eye"],
        ["Frange", "hair with bangs"], ["Ébouriffés", "wild tousled hair"],
        ["Mi-longs", "shoulder-length hair"], ["Mi-longs ondulés", "shoulder-length wavy hair"],
        ["Longs lisses", "long straight hair"], ["Longs ondulés", "long wavy hair blowing in the wind"],
        ["Longs bouclés", "long curly hair"], ["Longs épars", "long loose hair"],
        ["Mouillés", "wet slicked-back hair"], ["Queue de cheval", "ponytail"],
        ["Chignon", "hair tied in a bun"], ["Tresses", "braided hair"],
        ["Couronne tressée", "braided crown hairstyle"], ["Dreadlocks", "dreadlocks"],
        ["Afro", "voluminous afro"], ["Brûlés, effilochés", "singed frayed hair"],
        ["Chauve", "bald head"]
      ],
  
      couleur: [
        ["Noir ébène", "ebony black"], ["Noir de jais", "jet-black"], ["Brun foncé", "dark brown"],
        ["Brun chocolat", "chocolate brown"], ["Châtain", "light brown"], ["Châtain cendré", "ash brown"],
        ["Blond cendré", "ash blonde"], ["Blond doré", "golden blonde"], ["Blond platine", "platinum blonde"],
        ["Blond vénitien", "strawberry blonde"], ["Roux auburn", "auburn"], ["Roux cuivré", "copper red"],
        ["Rouge vif", "bright red"], ["Rouge sang", "blood red"], ["Blanc neige", "snow-white"],
        ["Blanc cassé", "off-white"], ["Argenté", "silver"], ["Gris argenté", "silver-grey"],
        ["Gris acier", "steel grey"], ["Gris cendré", "ashen grey"], ["Violet", "violet"],
        ["Mauve", "lilac"], ["Rose fuchsia", "fuchsia pink"], ["Bleu électrique", "electric blue"],
        ["Bleu nuit", "midnight blue"], ["Vert émeraude", "emerald green"],
        ["Noir avec mèches rouges", "black with red streaks"], ["Bicolore noir et blanc", "black and white two-tone"]
      ],
  
      yeux: [
        ["Bleu clair", "light blue"], ["Bleu acier", "steel blue"],
        ["Bleu électrique lumineux", "glowing electric blue"], ["Vert émeraude", "emerald green"],
        ["Vert clair", "pale green"], ["Vert lumineux", "glowing green"], ["Gris", "grey"],
        ["Gris argenté", "silver-grey"], ["Noisette", "hazel"], ["Marron", "brown"],
        ["Marron foncé", "dark brown"], ["Ambre", "amber"], ["Doré", "golden"],
        ["Jaune vif lumineux", "glowing yellow"], ["Orange lumineux", "glowing orange"],
        ["Rouge lumineux", "glowing red"], ["Violet", "violet"], ["Cyan lumineux", "glowing cyan"],
        ["Blanc lumineux (pupilles blanches)", "glowing white eyes"], ["Noirs (sans blanc)", "fully black eyes"],
        ["Hétérochromie (deux couleurs)", "heterochromia, two different eye colors"]
      ],
  
      visage: [
        ["Ovale", "oval face"], ["Rond", "round face"], ["Rond et doux", "soft round face"],
        ["Carré, mâchoire carrée", "square face with a square jaw"], ["Rectangulaire", "rectangular face"],
        ["Triangulaire (en V)", "V-shaped face"], ["En cœur", "heart-shaped face"], ["Allongé", "long face"],
        ["Anguleux", "angular sharp features"], ["Mâchoire marquée", "strong jawline"],
        ["Pommettes hautes", "high cheekbones"], ["Visage émacié", "gaunt hollow-cheeked face"],
        ["Visage large", "broad face"], ["Visage fin", "narrow face"], ["Visage buriné", "weathered rugged face"]
      ],
  
      corpulence: [
        ["Filiforme", "wiry thin build"], ["Maigre", "gaunt lean build"], ["Svelte", "lithe build"],
        ["Mince", "slim build"], ["Élancé", "lean build"], ["Athlétique", "athletic build"],
        ["Musclé", "muscular build"], ["Très musclé", "very muscular build"],
        ["Bodybuilder", "bodybuilder physique"], ["Bâti en V", "V-shaped physique"],
        ["Robuste", "sturdy build"], ["Trapu", "stocky build"], ["Puissant", "powerful build"],
        ["Massif", "massive heavy build"], ["Imposant (géant)", "imposing giant build"],
        ["Corpulence moyenne", "average build"], ["Ventripotent", "heavyset build"]
      ],
  
      atmosphere: [
        ["Apocalyptique", "apocalyptic"], ["Post-apocalyptique", "post-apocalyptic"],
        ["Fin du monde", "end-of-the-world"], ["Héroïque", "heroic"], ["Épique", "epic"],
        ["Tragique", "tragic"], ["Mélancolique", "melancholic"], ["Désolé", "desolate"],
        ["Lugubre", "gloomy"], ["Sinistre", "sinister"], ["Menaçant", "ominous"], ["Tendu", "tense"],
        ["Chaotique", "chaotic"], ["Mystérieux", "mysterious"], ["Surnaturel", "supernatural"],
        ["Sacré", "sacred"], ["Onirique", "dreamlike"], ["Brumeux", "hazy misty"],
        ["Poussiéreux", "dusty"], ["Orageux", "stormy"], ["Pluie battante", "heavy rain"],
        ["Crépusculaire", "twilight dusk"], ["Embrasé, braises", "smouldering with floating embers"],
        ["Cendres", "ashy"], ["Électrique", "electric, charged"], ["Cyberpunk, néons", "cyberpunk neon-lit"],
        ["Guerre", "war-torn"], ["Lumineux et serein", "bright and serene"]
      ],
  
      palette: [
        ["Orange", "orange"], ["Rouge brique", "brick red"], ["Rouge sang", "blood red"],
        ["Bordeaux", "burgundy"], ["Ocre", "ochre"], ["Ambre", "amber"], ["Or", "gold"],
        ["Jaune moutarde", "mustard yellow"], ["Sépia", "sepia"], ["Brun", "brown"], ["Kaki", "khaki"],
        ["Vert olive", "olive green"], ["Vert émeraude", "emerald green"], ["Turquoise", "turquoise"],
        ["Cyan", "cyan"], ["Bleu acier", "steel blue"], ["Bleu nuit", "midnight blue"],
        ["Violet", "violet"], ["Pourpre", "purple"], ["Rose", "pink"], ["Beige sable", "sand beige"],
        ["Blanc cassé", "off-white"], ["Argent", "silver"], ["Gris ardoise", "slate grey"],
        ["Noir charbon", "charcoal black"]
      ],
  
      lieu: [
        ["Ville", "city"], ["Campagne", "countryside fields"], ["Forêt", "dense forest"],
        ["Forêt enneigée", "snowy forest"], ["Désert", "desert"], ["Montagne", "mountain range"],
        ["Plage", "beach"], ["Île tropicale", "tropical island"], ["Côte rocheuse", "rocky coastline"],
        ["Banlieue", "suburban neighborhood"], ["Zone industrielle", "industrial zone"],
        ["Port", "harbor"], ["Autoroute", "highway"], ["Village abandonné", "abandoned village"],
        ["Base militaire", "military base"], ["Ruines d'un temple", "ruined temple"],
        ["Grotte", "cave system"], ["Souterrains", "underground tunnels"], ["Marais", "swamp"],
        ["Toundra", "frozen tundra"], ["Volcan", "volcanic plain"], ["Lac gelé", "frozen lake"],
        ["Aéroport", "airport"], ["Hôpital", "hospital interior"], ["Toits de la ville", "city rooftops"],
        ["Station spatiale", "space station interior"], ["Planète étrangère", "alien planet"]
      ],
  
      // ----- Créatures -----
      creatTypes: [["Animal", "animal"], ["Cryptide", "cryptid"], ["Insecte", "insect"], ["Personnalisé", "custom"]],
  
      cats: {
        animal: [
          ["Félin", "feline"], ["Canidé", "canine"], ["Équidé", "equine"], ["Ursidé", "bear"],
          ["Primate", "primate"], ["Reptile", "reptile"], ["Oiseau", "bird"], ["Rapace", "raptor"],
          ["Serpent", "snake"], ["Poisson", "fish"], ["Requin", "shark"]
        ],
        insect: [
          ["Coléoptère", "beetle"], ["Hyménoptère", "hymenopteran insect"],
          ["Lépidoptère", "butterfly or moth"], ["Diptère", "fly"], ["Orthoptère", "grasshopper-type insect"],
          ["Mantidé", "mantis"], ["Hémiptère", "cicada-type insect"],
          ["Arachnide / myriapode", "arachnid or myriapod"], ["Blatte", "cockroach"]
        ]
      },
  
      especes: {
        feline: [["Chat domestique", "domestic cat"], ["Lion", "lion"], ["Tigre", "tiger"], ["Léopard", "leopard"],
          ["Guépard", "cheetah"], ["Lynx", "lynx"], ["Puma", "cougar"], ["Panthère noire", "black panther"],
          ["Serval", "serval"], ["Ocelot", "ocelot"]],
        canine: [["Chien", "dog"], ["Loup", "wolf"], ["Renard", "fox"], ["Chacal", "jackal"],
          ["Coyote", "coyote"], ["Dhole", "dhole"], ["Fennec", "fennec fox"]],
        equine: [["Cheval", "horse"], ["Zèbre", "zebra"], ["Âne", "donkey"], ["Hémione", "onager"]],
        bear: [["Ours brun", "brown bear"], ["Ours polaire", "polar bear"], ["Ours noir", "black bear"],
          ["Panda géant", "giant panda"]],
        primate: [["Gorille", "gorilla"], ["Chimpanzé", "chimpanzee"], ["Orang-outan", "orangutan"],
          ["Babouin", "baboon"], ["Mandrill", "mandrill"]],
        reptile: [["Crocodile", "crocodile"], ["Alligator", "alligator"], ["Varan", "monitor lizard"],
          ["Iguane", "iguana"], ["Caméléon", "chameleon"], ["Tortue", "turtle"], ["Gecko", "gecko"]],
        bird: [["Corbeau", "raven"], ["Autruche", "ostrich"], ["Pingouin", "penguin"],
          ["Perroquet", "parrot"], ["Paon", "peacock"]],
        raptor: [["Aigle royal", "golden eagle"], ["Faucon pèlerin", "peregrine falcon"], ["Condor", "condor"],
          ["Vautour", "vulture"], ["Hibou grand-duc", "eagle owl"]],
        snake: [["Cobra", "cobra"], ["Python", "python"], ["Anaconda", "anaconda"], ["Vipère", "viper"],
          ["Mamba", "mamba"]],
        fish: [["Piranha", "piranha"], ["Anguille", "eel"], ["Poisson-lune", "sunfish"],
          ["Raie", "manta ray"], ["Poisson-scorpion", "lionfish"]],
        shark: [["Grand requin blanc", "great white shark"], ["Requin tigre", "tiger shark"],
          ["Requin marteau", "hammerhead shark"], ["Requin mako", "mako shark"]],
        beetle: [["Scarabée", "scarab beetle"], ["Coccinelle", "ladybug"], ["Lucane", "stag beetle"],
          ["Hanneton", "may beetle"]],
        "hymenopteran insect": [["Guêpe", "wasp"], ["Abeille", "bee"], ["Frelon", "hornet"], ["Fourmi", "ant"]],
        "butterfly or moth": [["Papillon monarque", "monarch butterfly"], ["Papillon de nuit", "moth"],
          ["Morpho bleu", "blue morpho butterfly"]],
        fly: [["Moustique", "mosquito"], ["Mouche", "housefly"], ["Taon", "horsefly"]],
        "grasshopper-type insect": [["Criquet", "locust"], ["Sauterelle", "katydid"], ["Grillon", "cricket"]],
        mantis: [["Mante religieuse", "praying mantis"]],
        "cicada-type insect": [["Cigale", "cicada"], ["Punaise", "stink bug"]],
        "arachnid or myriapod": [["Araignée", "spider"], ["Scorpion", "scorpion"],
          ["Mille-pattes", "centipede"], ["Tarentule", "tarantula"]],
        cockroach: [["Cafard géant", "giant cockroach"]]
      },
  
      races: {
        dog: [["Berger allemand", "German Shepherd"], ["Husky", "Siberian Husky"], ["Rottweiler", "Rottweiler"],
          ["Doberman", "Doberman"], ["Bouledogue français", "French Bulldog"], ["Dogue allemand", "Great Dane"],
          ["Akita", "Akita"], ["Malinois", "Belgian Malinois"], ["Lévrier", "Greyhound"],
          ["Saint-Bernard", "Saint Bernard"]],
        horse: [["Pur-sang", "thoroughbred"], ["Frison", "Friesian"], ["Shire", "Shire"], ["Mustang", "mustang"],
          ["Arabe", "Arabian"], ["Appaloosa", "Appaloosa"], ["Islandais", "Icelandic"]],
        "domestic cat": [["Maine Coon", "Maine Coon"], ["Sphynx", "Sphynx"], ["Bengal", "Bengal"],
          ["Siamois", "Siamese"], ["Norvégien", "Norwegian Forest"], ["Persan", "Persian"],
          ["British Shorthair", "British Shorthair"]]
      },
  
      cryptids: [
        ["Bigfoot (Sasquatch)", "Bigfoot Sasquatch"], ["Yéti", "yeti"], ["Mothman", "Mothman"],
        ["Chupacabra", "chupacabra"], ["Monstre du Loch Ness", "Loch Ness monster"],
        ["Diable du New Jersey", "Jersey Devil"], ["Wendigo", "wendigo"], ["Kraken", "kraken"],
        ["Oiseau-tonnerre", "Thunderbird"], ["Loup-garou", "werewolf"], ["Mokele-mbembe", "Mokele-mbembe"],
        ["Skunk ape", "skunk ape"], ["Dahu", "dahu"], ["Kelpie", "kelpie water horse"],
        ["Mapinguari", "mapinguari"], ["Yowie", "yowie"], ["Hydre", "hydra"]
      ],
  
      // ----- Paysage -----
      moments: [
        ["Aube", "at dawn, soft pink sunrise"], ["Matin", "in the morning"],
        ["Midi", "at midday, harsh overhead light"], ["Après-midi", "in the afternoon"],
        ["Crépuscule", "at dusk"], ["Nuit", "at night"], ["Nuit noire", "in pitch darkness"],
        ["Clair de lune", "under moonlight"], ["Aurore boréale", "under an aurora"]
      ],
      meteos: [
        ["Ciel dégagé", "clear sky"], ["Nuageux", "overcast cloudy sky"], ["Pluie", "heavy rain"],
        ["Orage", "thunderstorm with lightning"], ["Brouillard", "thick fog"], ["Neige", "falling snow"],
        ["Tempête de sable", "sandstorm"], ["Cendres", "falling ash"], ["Vent violent", "strong wind"],
        ["Pluie de météores", "meteor shower"]
      ],
      presences: [
        ["Aucune présence humaine", "no people in the scene"],
        ["Une silhouette au loin", "a lone small figure in the distance"],
        ["Petit groupe", "a small group of survivors"], ["Foule", "a crowd of people"],
        ["Véhicules abandonnés", "abandoned vehicles, no people"]
      ],
      points: [
        ["Plan large", "wide establishing shot"], ["Vue aérienne", "aerial view"],
        ["Vue au niveau du sol", "low ground-level view"], ["Contre-plongée", "low angle"],
        ["Vue panoramique", "panoramic view"], ["Plongée", "high angle view"]
      ],
  
      // ----- Carte -----
      cardTypes: [["Héros", "hero"], ["Attaque", "attack"], ["Défense", "defense"], ["Sort", "spell"],
        ["Créature", "creature"], ["Équipement", "equipment"], ["Événement", "event"],
        ["Compétence", "skill"], ["Artefact", "artifact"]],
      affinities: [["Feu", "fire"], ["Glace", "ice"], ["Foudre", "lightning"], ["Ténèbres", "darkness"],
        ["Lumière", "light"], ["Nature", "nature"], ["Eau", "water"], ["Psychique", "psychic"],
        ["Métal", "metal"], ["Vent", "wind"], ["Sang", "blood"], ["Terre", "earth"]],
      compositions: [["Sujet centré", "centered single subject"], ["Scène d'action", "dynamic action scene"],
        ["Gros plan", "tight close-up"], ["Emblème symbolique", "symbolic emblem"], ["Silhouette", "silhouette"],
        ["Duo", "two figures facing each other"], ["Vue de dos", "back view"]],
      cardFormats: [["Carte portrait 2:3", "vertical trading card composition 2:3"],
        ["Carte carrée 1:1", "square card composition 1:1"],
        ["Carte paysage 3:2", "horizontal card composition 3:2"]]
    };
  
    // ---------- Pays et villes (filtrables) ----------
    const CITIES = {
      "Argentina": ["Buenos Aires", "Cordoba"],
      "Australia": ["Sydney", "Melbourne", "Perth", "Darwin"],
      "Belgium": ["Brussels", "Antwerp", "Ghent"],
      "Brazil": ["Rio de Janeiro", "São Paulo", "Salvador", "Recife"],
      "Canada": ["Toronto", "Montreal", "Vancouver", "Quebec City"],
      "China": ["Shanghai", "Beijing", "Shenzhen", "Chongqing", "Xi'an"],
      "Egypt": ["Cairo", "Alexandria", "Luxor"],
      "France": ["Paris", "Lyon", "Marseille", "Bordeaux", "Lille", "Strasbourg", "Nantes", "Toulouse", "Nice"],
      "Germany": ["Berlin", "Munich", "Hamburg", "Cologne", "Frankfurt"],
      "Greece": ["Athens", "Thessaloniki"],
      "India": ["Mumbai", "Delhi", "Kolkata", "Chennai", "Varanasi"],
      "Indonesia": ["Jakarta", "Surabaya", "Denpasar"],
      "Iran": ["Tehran", "Isfahan"],
      "Italy": ["Rome", "Venice", "Milan", "Naples", "Florence"],
      "Japan": ["Tokyo", "Osaka", "Kyoto", "Yokohama", "Sapporo", "Hiroshima"],
      "Mexico": ["Mexico City", "Guadalajara", "Monterrey"],
      "Morocco": ["Casablanca", "Marrakesh", "Fez"],
      "Netherlands": ["Amsterdam", "Rotterdam"],
      "Nigeria": ["Lagos", "Abuja"],
      "Norway": ["Oslo", "Bergen"],
      "Poland": ["Warsaw", "Krakow"],
      "Portugal": ["Lisbon", "Porto"],
      "Russia": ["Moscow", "Saint Petersburg", "Novosibirsk"],
      "South Africa": ["Johannesburg", "Cape Town", "Durban"],
      "South Korea": ["Seoul", "Busan"],
      "Spain": ["Madrid", "Barcelona", "Seville"],
      "Sweden": ["Stockholm", "Gothenburg"],
      "Switzerland": ["Zurich", "Geneva"],
      "Thailand": ["Bangkok", "Chiang Mai"],
      "Turkey": ["Istanbul", "Ankara"],
      "United Kingdom": ["London", "Manchester", "Liverpool", "Edinburgh", "Glasgow", "Birmingham"],
      "United States": ["New York", "Los Angeles", "Chicago", "San Francisco", "Detroit", "Miami", "Las Vegas", "Houston", "New Orleans", "Seattle", "Boston"],
      "Vietnam": ["Ho Chi Minh City", "Hanoi"]
    };
  
    // ---------- Textes proposés au remplissage aléatoire (en anglais) ----------
    const TEXT_POOLS = {
      tenue: [
        "tattered leather duster over a dark bodysuit, high collar",
        "fitted black tactical suit with red armored plates on shoulders and chest",
        "torn charcoal hoodie with a faded emblem on the chest",
        "heavy grey-green combat armor with thick shoulder pauldrons",
        "long dark coat with brass buckles, belted at the waist",
        "navy bodysuit with glowing blue seams along the arms",
        "ragged red cape over a dark armored vest",
        "sleeveless black jumpsuit with a silver chest plate",
        "patched denim jacket over a dark turtleneck",
        "white and black sports suit with a red visor stripe",
        "futuristic purple bodysuit with segmented shoulder guards",
        "worn military fatigues with a rolled-up sleeve",
        "dark kevlar vest over a grey long-sleeve shirt",
        "gladiator-style leather harness across the chest",
        "hooded cloak with frayed edges and ash-stained fabric",
        "sleek black catsuit with thin gold trim",
        "scavenged mismatched armor pieces bolted together",
        "tailored dark suit with torn sleeves and a loose tie",
        "oversized flannel shirt over a black tank top, rolled jeans",
        "reinforced jumpsuit with orange safety stripes",
        "ceremonial plate armor with cracked engravings",
        "sleek white armor plating with blue energy lines",
        "shredded tunic over a chainmail shirt",
        "biker jacket with metal studs and a scarf",
        "dark robes with ember-red embroidery",
        "heavy longcoat with a high collar and leather gloves",
        "grey skin-tight suit with a red chest emblem",
        "faded red-and-blue uniform, torn and dusty",
        "black hooded suit with a glowing red vent on the shoulder",
        "modular exosuit with exposed cables and copper plates",
        "rugged brown field jacket over a plaid shirt"
      ],
      detail: [
        "scar across the left cheek", "burn marks on the forearms", "red gauntlet on the right hand",
        "a missing tooth and a crooked smile", "geometric tattoo lines along the neck",
        "bloody split lip and a bruised eye", "heavy stubble and a healed nose fracture",
        "glowing cybernetic eye", "metal prosthetic left arm with exposed gears",
        "blue veins glowing under the skin", "soot smudged across the face", "long claw-like fingernails",
        "pointed ears and sharp canine teeth", "silver streak through the hair", "rope burns on the wrists",
        "cross-shaped scar on the chest", "tribal face paint in red and white", "freckles and a sunburnt neck",
        "deep wrinkles around the eyes and a grey beard", "shaved sides with a thin braid",
        "thick scar running down the jaw", "cracked ceramic-like skin on the shoulder",
        "dried blood on the knuckles", "tiny glowing runes on the forearms", "a leather patch over one eye",
        "heavy silver earring and a nose ring", "bandages wrapped around the torso",
        "lightning-shaped scar on the forehead", "sweat-soaked skin and a clenched jaw",
        "spiky bone protrusions along the spine", "shoulder-length dreadlocks tied back"
      ],
      pouvoir: [
        "blue energy crackling along the arm", "red embers floating around the body",
        "shadowy tendrils pouring from the shoulders", "bright lightning arcing between the fingers",
        "a shockwave of dust rippling outward from the fists", "glowing crimson cracks spreading across the skin",
        "a translucent energy shield shimmering in front of the chest", "flames wrapped around the forearm",
        "ice crystals forming on the hands and shoulders", "a faint halo of golden light behind the head",
        "smoke swirling from the hands", "a purple aura pulsing around the body",
        "debris and gravel levitating in the air around the body",
        "a sonic ring of distortion radiating from the chest", "spectral wings made of light",
        "electric sparks dancing across the armor", "water streams bending around the arms",
        "a black void swallowing the light near the hand", "rays of sunlight piercing through the body",
        "glowing green vines growing from the ground around the feet", "tiny stars orbiting the head",
        "a blade of energy extending from the wrist", "red light leaking out of cracks in the armor",
        "an afterimage trail of motion behind the figure", "metal fragments orbiting the body",
        "sand spiraling upward into a whirlwind", "golden sparks raining down from above",
        "a wave of blue fire rolling along the ground", "bioluminescent veins pulsing with cyan light",
        "lightning-shaped energy halo around the head"
      ],
      posture: [
        "sitting on a broken rocky ledge, glancing to the side", "standing in a fighting stance, fists raised",
        "crouched low, one hand touching the ground", "mid-leap, body twisted in the air",
        "arms crossed, looking down with a stern expression", "walking forward through smoke, cape flowing behind",
        "kneeling among rubble, head bowed", "leaning against a crumbling wall, arms relaxed",
        "reaching toward the viewer with an open hand", "back turned, looking over the shoulder",
        "charging forward, weight leaning into the movement", "standing on top of a wrecked car, fist clenched",
        "holding a heavy weapon across the chest", "arms spread wide as if absorbing energy",
        "hunched forward, breathing heavily", "one knee on the ground, fist pressed to the rock",
        "standing tall on a rooftop, wind blowing the hair", "pointing toward the horizon with a steady arm",
        "sitting on a stone bench with elbows on the knees", "turning around sharply, eyes narrowed",
        "emerging from the dust with a determined stride", "dropping into a low landing with one hand on the ground",
        "hands clasped in front of the body, calm stance", "pulling a blade from its sheath",
        "gripping the steering wheel of a truck", "sitting cross-legged on a rooftop edge",
        "leaning forward with clenched fists at the sides", "sprinting toward the camera, cape flaring",
        "shielding the face with one arm", "rolling the shoulders before a fight"
      ],
      env: [
        "ruined city street at dusk, collapsed buildings, burning fires",
        "rocky cliff above a burning metropolis, stormy sky with red cracks",
        "abandoned highway under an orange sky, wrecked vehicles",
        "dusty desert canyon with jagged red rock formations",
        "flooded subway station with broken lights and sparks",
        "snowy mountain pass with a dark wind and drifting ash",
        "overgrown forest ruins with broken statues and mist",
        "rooftop overlooking a neon city in the rain",
        "crumbling cathedral at sunset with scattered debris",
        "industrial harbor with rusted cranes and smoke",
        "abandoned amusement park with a rusted ferris wheel",
        "dark cave lit by glowing crystals",
        "bombed-out market square with scattered crates",
        "burning forest clearing with falling embers",
        "empty city avenue flooded with shallow water and reflections",
        "alien desert with two suns and floating rocks",
        "crashed spaceship hull in a ravine",
        "mountain temple surrounded by storm clouds",
        "ruined stadium with cracked bleachers",
        "gothic plaza under a blood-red moon",
        "frozen tundra with a broken radio tower",
        "sunken church half submerged in dark water",
        "steel bridge over a burning river",
        "junkyard of cars piled under a grey sky",
        "tunnel of rusted pipes with dripping water",
        "ash-covered farmland with a burned barn",
        "futuristic megacity skyline at night",
        "hospital corridor with flickering lights",
        "volcanic plain with glowing lava cracks",
        "small village square in ruins, smoke rising from the roofs"
      ],
      premier: [
        "broken rubble and dust in the foreground", "tall dry grass and wildflowers",
        "wet asphalt reflecting the fire", "a fallen tree trunk across the path",
        "cracked stone path with weeds", "scattered debris and glowing embers",
        "frozen puddles and snowdrifts", "rusted car wrecks half buried in sand",
        "moss-covered boulders by a river", "a shattered road sign"
      ],
      sujet: [
        "a lone warrior raising a glowing sword", "a beast with armored plates roaring",
        "a sorceress casting a spiral of light", "a robot guardian with a cracked visor",
        "a hooded figure holding a lantern", "a giant creature rising from the water",
        "a pilot standing beside a damaged jet", "a monk meditating above a waterfall",
        "a knight in heavy plate armor", "a wolf-like creature with glowing eyes"
      ],
      arriere: [
        "stormy sky with red lightning", "ruined city skyline at sunset", "dense misty forest",
        "ancient temple with glowing runes", "desert under two suns", "starfield with a planet in the distance",
        "burning cityscape", "frozen mountain peaks under aurora", "dark cave with crystals",
        "abstract swirling energy vortex"
      ],
      effets: [
        "sparks and floating embers", "glowing energy aura", "swirling smoke and dust",
        "lightning arcs around the figure", "rain streaks and splashes", "petals and light particles",
        "frost crystals spreading", "shockwave rings", "shadow tendrils", "lens flare and bright highlights"
      ]
    };
  
    // ---------- Style commun (onglet Paramètres) ----------
    const NEGATIVE = "photorealistic, 3D render, plastic skin, extra fingers, deformed hands, blurry face, asymmetrical eyes, text, watermark, logo, cartoon chibi, pastel colors, bright daylight, cape covering face";
  
    const STYLE_FACTORY = {
      base: "stylized semi-3D animated cinematic still, low-poly faceted shading with visible polygonal facets on faces, clothing and rocks, cel-shaded lighting with soft painterly texture",
      ombres: "desaturated dark shadows",
      eclairage: "dramatic rim light",
      cadrage: "dynamic camera angle (low angle or tight close-up)",
      profondeur: "shallow depth of field",
      cadre: "cinematic 16:9 framing",
      finition: "graphic novel animation quality",
      negative: NEGATIVE
    };
  
    const STYLE_OPTIONS = {
      eclairage: ["dramatic rim light", "warm backlight", "soft key light", "neon rim light",
        "hard sunlight from the side", "golden hour glow", "moonlight rim light",
        "volumetric god rays", "firelight from below", "overcast diffuse light"],
      ombres: ["desaturated dark shadows", "bold dark shadows", "soft shadows", "high-contrast shadows",
        "deep black shadows", "warm amber shadows", "cool blue-night shadows", "flat soft shadows"],
      cadrage: ["dynamic camera angle (low angle or tight close-up)", "low angle", "high angle",
        "tight close-up", "extreme close-up", "medium shot", "wide establishing shot",
        "over-the-shoulder shot", "dutch angle", "three-quarter view", "eye-level shot"],
      profondeur: ["shallow depth of field", "deep focus", "bokeh background", "motion blur background"],
      cadre: ["cinematic 16:9 framing", "vertical 9:16 composition", "square 1:1 composition",
        "ultrawide 21:9 cinematic framing", "portrait 4:5 composition"],
      finition: ["graphic novel animation quality", "comic book illustration quality", "painterly finish",
        "cinematic animation still quality", "high detail concept art quality"]
    };
  (window.HQ = window.HQ || {}).apexData = { CUSTOM, DATA, CITIES, TEXT_POOLS, NEGATIVE, STYLE_FACTORY, STYLE_OPTIONS };
})();
