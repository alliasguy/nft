export type Category = "Art" | "Music" | "Photography" | "Gaming" | "Virtual Worlds";
export type Status   = "buy-now" | "auction" | "new";
export type ArtShape = "hex" | "grid" | "wave" | "burst" | "circuit" | "orbit" | "prism" | "plasma" | "genesis";

export interface Bid {
  bidder:   string;
  amount:   string;
  time:     string;
  gradient: string;
}

export interface Trait {
  label:  string;
  value:  string;
  rarity: string;
}

export interface NFTCreator {
  name:     string;
  handle:   string;
  verified: boolean;
  gradient: string;
}

export interface NFTItem {
  id:          string;
  title:       string;
  art:         { shape: ArtShape; stops: [string, string] };
  creator:     NFTCreator;
  price:       string;
  description: string;
  category:    Category;
  status:      Status;
  likes:       number;
  isLive?:     boolean;
  badge?:      string;
  collection:  string;
  tokenId:     string;
  views:       number;
  traits:      Trait[];
  bids:        Bid[];
  /** Supabase Storage URL when the NFT was created via file upload (image or audio). */
  image_url?:  string | null;
}

/* ── helpers ─────────────────────────────────────────────── */
const t = (label: string, value: string, rarity: string): Trait => ({ label, value, rarity });
const b = (bidder: string, amount: string, time: string, gradient: string): Bid =>
  ({ bidder, amount, time, gradient });

/* ── data ────────────────────────────────────────────────── */
export const ALL_NFTS: NFTItem[] = [

  /* 1 ─ hero piece */
  {
    id: "1", title: "Genesis Bloom #001",
    art: { shape: "genesis", stops: ["#e11d48", "#c026d3"] },
    creator: { name: "CryptoMaestro", handle: "@crypto_maestro", verified: true, gradient: "linear-gradient(135deg,#e11d48,#c026d3)" },
    price: "12.5",
    description: "Genesis Bloom is the inaugural piece of the Bloom Protocol collection — a meditation on emergence and entropy rendered through 10 000 procedurally generated geometry passes. Each diamond ring encodes a unique prime sequence, making this the rarest artefact in the series.",
    category: "Art", status: "auction", likes: 441, isLive: true,
    collection: "Bloom Protocol", tokenId: "001", views: 8_420,
    traits: [t("Background", "Deep Space",    "5% have this"), t("Palette",    "Crimson-Magenta", "8% have this"),
             t("Energy",     "Transcendent",  "2% have this"), t("Rarity",     "Legendary",       "1% have this"),
             t("Edition",    "1 of 1",        "1% have this"), t("Style",      "Generative",      "40% have this")],
    bids: [b("0xMaestro",  "12.5", "2 min ago",   "linear-gradient(135deg,#e11d48,#c026d3)"),
           b("NeonDreamer", "11.2", "34 min ago",  "linear-gradient(135deg,#10b981,#3b82f6)"),
           b("VoidWalker",  "9.8", "2 hrs ago",   "linear-gradient(135deg,#f59e0b,#ef4444)"),
           b("PixelMage",   "8.5", "6 hrs ago",   "linear-gradient(135deg,#8b5cf6,#ec4899)")],
  },

  /* 2 */
  {
    id: "2", title: "Hexel Protocol #11",
    art: { shape: "hex", stops: ["#e11d48", "#c026d3"] },
    creator: { name: "0xArtist", handle: "@0x_artist", verified: true, gradient: "linear-gradient(135deg,#e11d48,#f97316)" },
    price: "2.45",
    description: "A tessellated lattice study exploring the tension between order and dissolution. Each hexagonal node pulses with a hidden Fibonacci ratio, unlocking animation sequences for verified holders.",
    category: "Art", status: "buy-now", likes: 127, badge: "Rare",
    collection: "Hexel Series", tokenId: "011", views: 2_140,
    traits: [t("Background", "Nebula",       "12% have this"), t("Palette",  "Crimson-Magenta", "8% have this"),
             t("Rarity",     "Rare",          "8% have this"),  t("Edition", "1 of 10",          "10% have this"),
             t("Style",      "Geometric",     "30% have this")],
    bids: [b("SolarArtist", "2.10", "1 day ago", "linear-gradient(135deg,#f97316,#fbbf24)"),
           b("CathArt",     "1.80", "3 days ago","linear-gradient(135deg,#0ea5e9,#6366f1)")],
  },

  /* 3 */
  {
    id: "3", title: "Grid Nexus #07",
    art: { shape: "hex", stops: ["#3b82f6", "#06b6d4"] },
    creator: { name: "DigitalDreamer", handle: "@digital_dreamer", verified: false, gradient: "linear-gradient(135deg,#3b82f6,#06b6d4)" },
    price: "1.80",
    description: "Grid Nexus explores the visual language of data infrastructure — the hidden architecture beneath our digital lives. Rendered from live network topology data captured over 72 hours.",
    category: "Art", status: "auction", likes: 89,
    collection: "Nexus Series", tokenId: "007", views: 1_870,
    traits: [t("Background", "Void",       "18% have this"), t("Palette",  "Azure-Cyan",   "15% have this"),
             t("Rarity",     "Uncommon",   "20% have this"), t("Edition", "1 of 25",        "25% have this"),
             t("Style",      "Abstract",   "35% have this")],
    bids: [b("0xCreative",  "1.80", "5 min ago",  "linear-gradient(135deg,#ec4899,#f43f5e)"),
           b("MetaForge",   "1.50", "2 hrs ago",  "linear-gradient(135deg,#64748b,#334155)"),
           b("FractalLabs", "1.20", "8 hrs ago",  "linear-gradient(135deg,#a855f7,#3b82f6)")],
  },

  /* 4 */
  {
    id: "4", title: "Sonic Drift #29",
    art: { shape: "wave", stops: ["#f59e0b", "#ef4444"] },
    creator: { name: "WaveLabs", handle: "@wave_labs", verified: true, gradient: "linear-gradient(135deg,#f59e0b,#ef4444)" },
    price: "0.95",
    description: "Sonic Drift translates frequency analysis from three unreleased tracks into visual waveform topographies. Owning this NFT grants a licence to use the embedded stems in personal projects.",
    category: "Music", status: "buy-now", likes: 204, badge: "1 of 1",
    collection: "Sonic Series", tokenId: "029", views: 3_210,
    traits: [t("Background", "Starfield",  "10% have this"), t("Palette", "Gold-Red",       "12% have this"),
             t("BPM",        "140",        "5% have this"),  t("Key",    "F# Minor",         "3% have this"),
             t("Edition",    "1 of 1",     "1% have this"),  t("Style",  "Generative",       "40% have this")],
    bids: [b("NeonDreamer", "0.80", "2 days ago", "linear-gradient(135deg,#10b981,#3b82f6)")],
  },

  /* 5 */
  {
    id: "5", title: "Radiant Core #03",
    art: { shape: "burst", stops: ["#10b981", "#3b82f6"] },
    creator: { name: "0xCreator", handle: "@0x_creator", verified: true, gradient: "linear-gradient(135deg,#10b981,#06b6d4)" },
    price: "3.20",
    description: "Radiant Core is an exploration of stellar nucleosynthesis through abstract generative art. Twelve thousand data points from NASA's public spectroscopy archives define each burst ray's trajectory and colour temperature.",
    category: "Art", status: "buy-now", likes: 56, badge: "Featured",
    collection: "Cosmos Series", tokenId: "003", views: 980,
    traits: [t("Background", "Cosmic",      "7% have this"), t("Palette", "Emerald-Blue",  "10% have this"),
             t("Rarity",     "Epic",         "5% have this"), t("Style",  "Scientific",     "8% have this"),
             t("Edition",    "1 of 5",       "5% have this")],
    bids: [b("VoidWalker",  "2.90", "4 days ago", "linear-gradient(135deg,#f59e0b,#ef4444)")],
  },

  /* 6 */
  {
    id: "6", title: "Circuit Sage #88",
    art: { shape: "circuit", stops: ["#8b5cf6", "#ec4899"] },
    creator: { name: "PixelMage", handle: "@pixel_mage", verified: false, gradient: "linear-gradient(135deg,#8b5cf6,#ec4899)" },
    price: "0.65",
    description: "A love letter to the era of hand-etched PCB boards — each trace has been individually placed to form a working logic gate diagram when decoded. Twelve hidden messages are embedded in the routing layers.",
    category: "Virtual Worlds", status: "auction", likes: 312, isLive: true,
    collection: "Silicon Dreams", tokenId: "088", views: 5_670,
    traits: [t("Background", "Deep Space",  "5% have this"),  t("Palette",  "Violet-Pink",   "11% have this"),
             t("Rarity",     "Rare",         "8% have this"),  t("Edition", "1 of 50",         "50% have this"),
             t("Logic Gate", "NAND Array",   "4% have this")],
    bids: [b("SolarArtist", "0.65", "8 min ago",  "linear-gradient(135deg,#f97316,#fbbf24)"),
           b("CathArt",     "0.48", "1 hr ago",   "linear-gradient(135deg,#0ea5e9,#6366f1)"),
           b("MetaForge",   "0.32", "5 hrs ago",  "linear-gradient(135deg,#64748b,#334155)")],
  },

  /* 7 */
  {
    id: "7", title: "Sol Orbit #003",
    art: { shape: "orbit", stops: ["#f97316", "#fbbf24"] },
    creator: { name: "SolarArtist", handle: "@solar_artist", verified: true, gradient: "linear-gradient(135deg,#f97316,#fbbf24)" },
    price: "5.50",
    description: "Sol Orbit captures the gravitational dance of six exoplanets orbiting Kepler-442b, rendered as luminous orbital paths. Each ellipse represents 100 000 simulated years of trajectory data.",
    category: "Virtual Worlds", status: "buy-now", likes: 441, badge: "Rare",
    collection: "Kepler Series", tokenId: "003", views: 7_240,
    traits: [t("Background", "Solar Flare", "4% have this"), t("Palette",  "Orange-Gold",   "9% have this"),
             t("Bodies",     "6 Planets",   "3% have this"), t("Rarity",   "Epic",           "5% have this"),
             t("Edition",    "1 of 3",      "3% have this"), t("Style",    "Scientific",     "8% have this")],
    bids: [b("NeonDreamer",  "5.00", "3 days ago", "linear-gradient(135deg,#10b981,#3b82f6)"),
           b("0xArtist",     "4.20", "5 days ago", "linear-gradient(135deg,#e11d48,#f97316)")],
  },

  /* 8 */
  {
    id: "8", title: "Prism Break #19",
    art: { shape: "prism", stops: ["#a855f7", "#3b82f6"] },
    creator: { name: "FractalLabs", handle: "@fractal_labs", verified: false, gradient: "linear-gradient(135deg,#a855f7,#3b82f6)" },
    price: "1.15",
    description: "Prism Break deconstructs natural light refraction into discrete geometric events. Each triangle panel corresponds to an actual spectroscopic reading taken from a fibre-optic installation in Helsinki.",
    category: "Photography", status: "new", likes: 73,
    collection: "Refraction", tokenId: "019", views: 430,
    traits: [t("Background", "Nebula",      "12% have this"), t("Palette",  "Violet-Blue",  "13% have this"),
             t("Rarity",     "Uncommon",    "20% have this"), t("Edition", "1 of 100",       "100% have this"),
             t("Style",      "Abstract",    "35% have this")],
    bids: [b("DigitalDreamer","1.00","6 hrs ago","linear-gradient(135deg,#3b82f6,#06b6d4)")],
  },

  /* 9 */
  {
    id: "9", title: "Plasma Gate #44",
    art: { shape: "plasma", stops: ["#0ea5e9", "#6366f1"] },
    creator: { name: "CathArt", handle: "@cath_art", verified: true, gradient: "linear-gradient(135deg,#0ea5e9,#6366f1)" },
    price: "4.80",
    description: "Plasma Gate portrays the moment of magnetic reconnection at the boundary of a stellar corona. Two plasma fields are suspended mid-collision, their turbulence encoded at sub-pixel resolution.",
    category: "Art", status: "buy-now", likes: 189, badge: "1 of 1",
    collection: "Corona Series", tokenId: "044", views: 3_880,
    traits: [t("Background", "Cosmic",      "7% have this"), t("Palette",  "Cyan-Indigo",  "8% have this"),
             t("Energy",     "Plasma",       "6% have this"), t("Rarity",  "Legendary",     "1% have this"),
             t("Edition",    "1 of 1",       "1% have this"), t("Style",  "Generative",     "40% have this")],
    bids: [b("0xCreative",  "4.50", "2 days ago", "linear-gradient(135deg,#ec4899,#f43f5e)"),
           b("WaveLabs",    "3.80", "5 days ago", "linear-gradient(135deg,#f59e0b,#ef4444)")],
  },

  /* 10 */
  {
    id: "10", title: "Wave Rider #55",
    art: { shape: "wave", stops: ["#e11d48", "#f97316"] },
    creator: { name: "NeonDreamer", handle: "@neon_dreamer", verified: true, gradient: "linear-gradient(135deg,#e11d48,#f97316)" },
    price: "2.10",
    description: "Wave Rider captures sixteen hours of ocean-surface oscillation data from a buoy off the coast of Oahu. The undulating forms are a direct visual translation of wave height, frequency, and drift.",
    category: "Music", status: "auction", likes: 167,
    collection: "Pacific Series", tokenId: "055", views: 2_590,
    traits: [t("Background", "Deep Space",  "5% have this"),  t("Palette",  "Crimson-Orange","7% have this"),
             t("Rarity",     "Rare",         "8% have this"),  t("BPM",     "92",             "9% have this"),
             t("Edition",    "1 of 20",      "20% have this"), t("Style",   "Organic",         "15% have this")],
    bids: [b("VoidWalker",   "2.10",  "12 min ago", "linear-gradient(135deg,#f59e0b,#ef4444)"),
           b("PixelMage",    "1.85",  "3 hrs ago",  "linear-gradient(135deg,#8b5cf6,#ec4899)"),
           b("SolarArtist",  "1.60",  "9 hrs ago",  "linear-gradient(135deg,#f97316,#fbbf24)"),
           b("CryptoMaestro","1.30",  "18 hrs ago", "linear-gradient(135deg,#e11d48,#c026d3)")],
  },

  /* 11 */
  {
    id: "11", title: "Burst Nova #12",
    art: { shape: "burst", stops: ["#8b5cf6", "#c026d3"] },
    creator: { name: "0xCreative", handle: "@0x_creative", verified: false, gradient: "linear-gradient(135deg,#8b5cf6,#c026d3)" },
    price: "0.80",
    description: "Burst Nova is an in-game artefact from the upcoming open-world title Metaversia. Holding this NFT grants founders-tier access and a unique spawn point in the game world at launch.",
    category: "Gaming", status: "buy-now", likes: 98,
    collection: "Metaversia Genesis", tokenId: "012", views: 1_450,
    traits: [t("Background", "Void",        "18% have this"), t("Palette",  "Violet-Magenta","6% have this"),
             t("Tier",       "Founders",    "5% have this"),  t("Edition", "1 of 500",        "500% have this"),
             t("Style",      "Gaming",      "20% have this")],
    bids: [b("MetaForge",    "0.70", "1 day ago", "linear-gradient(135deg,#64748b,#334155)")],
  },

  /* 12 */
  {
    id: "12", title: "Gold Rush #99",
    art: { shape: "hex", stops: ["#f59e0b", "#f97316"] },
    creator: { name: "GoldForge", handle: "@gold_forge", verified: true, gradient: "linear-gradient(135deg,#f59e0b,#f97316)" },
    price: "6.50",
    description: "Gold Rush is the 99th and final entry in the Gold Lattice series. The hexagonal structure is derived from the crystal growth patterns of real gold at 200× magnification — each facet unique and non-repeating.",
    category: "Art", status: "new", likes: 310, badge: "Final Drop",
    collection: "Gold Lattice", tokenId: "099", views: 4_120,
    traits: [t("Background", "Starfield",   "10% have this"), t("Palette",  "Gold-Orange",  "9% have this"),
             t("Rarity",     "Legendary",   "1% have this"),  t("Edition", "Final Edition",  "1% have this"),
             t("Series No.", "99 of 99",    "1% have this"),  t("Style",   "Crystalline",   "3% have this")],
    bids: [b("0xArtist",    "6.00", "4 hrs ago", "linear-gradient(135deg,#e11d48,#f97316)")],
  },

  /* 13 */
  {
    id: "13", title: "Teal Matrix #33",
    art: { shape: "circuit", stops: ["#06b6d4", "#10b981"] },
    creator: { name: "TealMind", handle: "@teal_mind", verified: false, gradient: "linear-gradient(135deg,#06b6d4,#10b981)" },
    price: "1.95",
    description: "Teal Matrix models the neural topology of a distributed AI system trained entirely on sea-floor sonar data. Every node represents a real synapse weight from the final training epoch.",
    category: "Virtual Worlds", status: "auction", likes: 142,
    collection: "AI Series", tokenId: "033", views: 2_030,
    traits: [t("Background", "Cosmic",       "7% have this"),  t("Palette", "Teal-Emerald",   "5% have this"),
             t("Nodes",      "10,000",        "3% have this"),  t("Rarity", "Epic",             "5% have this"),
             t("Edition",    "1 of 10",       "10% have this")],
    bids: [b("DigitalDreamer","1.95","18 min ago","linear-gradient(135deg,#3b82f6,#06b6d4)"),
           b("FractalLabs",   "1.70","4 hrs ago", "linear-gradient(135deg,#a855f7,#3b82f6)"),
           b("WaveLabs",      "1.45","12 hrs ago","linear-gradient(135deg,#f59e0b,#ef4444)")],
  },

  /* 14 */
  {
    id: "14", title: "Pink Haze #77",
    art: { shape: "plasma", stops: ["#ec4899", "#f43f5e"] },
    creator: { name: "RoseLab", handle: "@rose_lab", verified: true, gradient: "linear-gradient(135deg,#ec4899,#f43f5e)" },
    price: "3.75",
    description: "Pink Haze is a long-exposure composite of 3 400 frames captured through a homemade schlieren optics rig. The swirling plasma fields are turbulence made visible — heat, pressure and colour coexisting.",
    category: "Photography", status: "buy-now", likes: 277, badge: "Rare",
    collection: "Schlieren Series", tokenId: "077", views: 4_880,
    traits: [t("Background", "Nebula",       "12% have this"), t("Palette",  "Pink-Rose",    "7% have this"),
             t("Frames",     "3,400",         "2% have this"), t("Rarity",   "Rare",          "8% have this"),
             t("Edition",    "1 of 10",       "10% have this"), t("Style",  "Photography",    "10% have this")],
    bids: [b("NeonDreamer", "3.40","2 days ago","linear-gradient(135deg,#10b981,#3b82f6)"),
           b("CryptoMaestro","2.90","4 days ago","linear-gradient(135deg,#e11d48,#c026d3)")],
  },

  /* 15 */
  {
    id: "15", title: "Crystal Prism #44",
    art: { shape: "prism", stops: ["#f59e0b", "#a855f7"] },
    creator: { name: "PrismStudio", handle: "@prism_studio", verified: false, gradient: "linear-gradient(135deg,#f59e0b,#a855f7)" },
    price: "0.45",
    description: "Crystal Prism is the entry-level piece in the Refraction Collection — an accessible gateway to generative art for first-time collectors. Holders automatically join the Studio's early-access Discord channel.",
    category: "Art", status: "new", likes: 52,
    collection: "Refraction", tokenId: "044", views: 620,
    traits: [t("Background", "Void",        "18% have this"), t("Palette", "Gold-Violet",   "4% have this"),
             t("Rarity",     "Common",      "40% have this"), t("Edition","1 of 250",        "250% have this"),
             t("Style",      "Geometric",   "30% have this")],
    bids: [b("MetaForge", "0.38","8 hrs ago","linear-gradient(135deg,#64748b,#334155)")],
  },

  /* 16 */
  {
    id: "16", title: "Sound Wave #08",
    art: { shape: "grid", stops: ["#f59e0b", "#ef4444"] },
    creator: { name: "BeatForge", handle: "@beat_forge", verified: true, gradient: "linear-gradient(135deg,#f59e0b,#ef4444)" },
    price: "7.20",
    description: "Sound Wave #08 encodes an entire unreleased EP as a 4K visual waveform. The purchase includes perpetual sync-licencing rights and a physical vinyl pressing delivered to the buyer.",
    category: "Music", status: "buy-now", likes: 389, badge: "Legendary",
    collection: "BeatForge Records", tokenId: "008", views: 6_510,
    traits: [t("Background", "Deep Space",  "5% have this"),  t("Palette", "Gold-Red",       "12% have this"),
             t("Tracks",     "6",           "2% have this"),  t("Rarity",  "Legendary",       "1% have this"),
             t("Edition",    "1 of 1",      "1% have this"),  t("License", "Sync + Vinyl",    "1% have this")],
    bids: [b("CryptoMaestro","6.80","5 days ago","linear-gradient(135deg,#e11d48,#c026d3)"),
           b("SolarArtist",  "5.90","7 days ago","linear-gradient(135deg,#f97316,#fbbf24)")],
  },

];

/* ── convenience lookups ─────────────────────────────────── */
export const CATEGORIES: Category[] = ["Art", "Music", "Photography", "Gaming", "Virtual Worlds"];
export const STATUSES = [
  { key: "buy-now"  as Status, label: "Buy Now"    },
  { key: "auction"  as Status, label: "On Auction" },
  { key: "new"      as Status, label: "New"        },
] as const;

export const SORT_OPTIONS = [
  { value: "recent",     label: "Recently Listed"      },
  { value: "price-asc",  label: "Price: Low to High"   },
  { value: "price-desc", label: "Price: High to Low"   },
  { value: "most-liked", label: "Most Liked"           },
  { value: "most-viewed",label: "Most Viewed"          },
] as const;
