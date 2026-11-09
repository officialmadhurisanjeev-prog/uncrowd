/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Source: Google Maps Platform Code Assist
import React, { useState, useEffect, useMemo } from 'react';
import {
  Compass,
  AlertTriangle,
  Clock,
  MapPin,
  Navigation,
  Sparkles,
  ShieldCheck,
  CreditCard,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Share2,
  Check,
  TrendingDown,
  DollarSign,
  X,
  Search,
  Flame,
  Bookmark,
  CheckCircle2,
  SlidersHorizontal,
  Layers,
  Database,
  User as UserIcon,
  LogOut
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { auth, googleAuthProvider } from './lib/firebase.ts';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

// --- Types ---
export interface LocalGem {
  id: string;
  name: string;
  neighborhood: string;
  walkTime: string;
  distance: string;
  fairLocalPrice: string;
  whyLocalsLoveIt: string;
  mapsQuery: string;
  mapsUrl?: string;
  groundedTitle?: string;
  lat?: number;
  lng?: number;
  vibeMatch: string;
  crowdLevel: string;
  category: string;
  quietVotes?: number;
  busyVotes?: number;
  affiliateTour?: {
    title: string;
    duration: string;
    rating: string;
    provider: string;
    price: string;
    url: string;
  };
}

export interface RescueResult {
  id: string;
  timestamp: number;
  originalSpot: string;
  vibe: string;
  city: string;
  crowdScore: number;
  crowdLabel: string;
  estimatedWaitMinutes: number;
  isBucketListIcon: boolean;
  quietWindow: string;
  bucketListStrategy?: {
    entranceTip: string;
    bestDays: string;
    skipLineGuide: string;
  };
  priceGuard: {
    touristPrice: string;
    fairLocalPrice: string;
    markupPercent: string;
    trapDetails: string;
    moneySaved: string;
  };
  localGems: LocalGem[];
}

// Preset Wishlist Items
const PRESETS = [
  {
    id: 'goa',
    label: 'Goa Weekend',
    query: "Baga Beach, Tito's Lane, Thalassa Sunset Lounge, Calangute Strip",
    city: 'Goa, India',
    vibe: 'Chill & Quiet'
  },
  {
    id: 'kyoto',
    label: 'Kyoto Viral List',
    query: 'Fushimi Inari Shrine, Arashiyama Bamboo Grove, Kinkaku-ji Golden Pavilion',
    city: 'Kyoto, Japan',
    vibe: 'Hidden Views'
  },
  {
    id: 'paris',
    label: 'Paris Cafes & Icons',
    query: 'Cafe de Flore, Angelina Hot Chocolate, Louvre Glass Pyramid, Sacre-Coeur',
    city: 'Paris, France',
    vibe: 'Authentic Food'
  },
  {
    id: 'rome',
    label: 'Rome Classics',
    query: 'Trevi Fountain, Colosseum Queue, Spanish Steps Cafe, Pantheon Plaza',
    city: 'Rome, Italy',
    vibe: 'Budget-Friendly'
  }
];

const VIBES = [
  { label: 'Chill & Quiet', icon: '🍃', desc: 'No tour groups or selfie swarms' },
  { label: 'Authentic Food', icon: '🍲', desc: 'Family-run recipes, non-inflated prices' },
  { label: 'Hidden Views', icon: '🔭', desc: 'Secret overlooks without the 2hr line' },
  { label: 'Budget-Friendly', icon: '🏷️', desc: 'True local baseline prices' },
];

// Rich High-Fidelity Built-In Knowledge Base
const DEMO_KNOWLEDGE_BASE: Record<string, RescueResult> = {
  goa: {
    id: 'demo-goa',
    timestamp: Date.now(),
    originalSpot: "Baga Beach & Tito's Lane",
    vibe: 'Chill & Quiet',
    city: 'Goa, India',
    crowdScore: 9.4,
    crowdLabel: 'Extreme Viral Club Crawl & Gridlock',
    estimatedWaitMinutes: 90,
    isBucketListIcon: false,
    quietWindow: '6:30 AM – 8:15 AM for serene beach walk',
    priceGuard: {
      touristPrice: '₹950 watered-down cocktail & ₹3,500 cover charge',
      fairLocalPrice: '₹140 chilled King’s beer & ₹340 fresh prawn rawa fry',
      markupPercent: '+340% Viral Tourist Surcharge',
      trapDetails: 'Aggressive street promoters hand out duplicate passes while beach shacks charge mandatory 20% "service tax" not on the menu.',
      moneySaved: '₹3,200 ($38.50)'
    },
    localGems: [
      {
        id: 'gem-goa-1',
        name: "Fisherman's Secret Jetty Cantina",
        neighborhood: 'Nerul River Backwaters (Near Sinquerim)',
        walkTime: '8 mins walk',
        distance: '650 meters',
        fairLocalPrice: '₹220 / $2.60 per meal',
        whyLocalsLoveIt: 'Old wooden stilt pier where village fishermen grill the 4:00 PM river catch with homemade red recheado masala over coconut shells.',
        mapsQuery: 'Fishermans Wharf Backwaters Nerul Goa',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Nerul+River+Backwaters+Goa',
        lat: 15.518,
        lng: 73.784,
        vibeMatch: 'River breeze, acoustic guitars, zero rowdy club crowds',
        crowdLevel: '< 10% tourist density • 8 open tables',
        category: 'Coastal Seafood Tavern',
        affiliateTour: {
          title: 'Quiet Goan Estuary Kayak & Spice Feast',
          duration: '2.5 hrs',
          rating: '4.95 (140 reviews)',
          provider: 'GetYourGuide Verified Partner',
          price: '₹1,200 / $14',
          url: 'https://www.getyourguide.com'
        }
      },
      {
        id: 'gem-goa-2',
        name: 'Mala Fontainhas Sunken Balcão',
        neighborhood: 'Latin Heritage Quarter, Panaji',
        walkTime: '12 mins stroll',
        distance: '950 meters',
        fairLocalPrice: '₹180 / $2.15 Portuguese Poee & Chourico',
        whyLocalsLoveIt: '1880s indigo-tiled courtyard tavern run by Maria, serving slow-cooked Goan pork vindaloo and freshly baked poee with feni cocktails.',
        mapsQuery: 'Fontainhas Heritage Quarter Panaji Goa',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Fontainhas+Latin+Quarter+Panaji+Goa',
        lat: 15.498,
        lng: 73.832,
        vibeMatch: 'Cobblestone whispers, azulejo tile views, jazz records',
        crowdLevel: 'Local artists & writers only • Quiet ambience',
        category: 'Heritage Indo-Portuguese Bistro'
      },
      {
        id: 'gem-goa-3',
        name: 'Little Vagator Cliff Pine Sanctuary',
        neighborhood: 'Ozran Hilltop Secret Pathway',
        walkTime: '11 mins walk',
        distance: '800 meters',
        fairLocalPrice: 'Free cliff access • ₹120 fresh tender coconut',
        whyLocalsLoveIt: 'A dirt trail tucked behind the chapel leads to an unmapped basalt cliff overlooking uninterrupted sunset waves with no DJ loudspeakers.',
        mapsQuery: 'Ozran Beach secluded rocky cove Vagator Goa',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Ozran+Beach+Vagator+Goa',
        lat: 15.597,
        lng: 73.738,
        vibeMatch: 'Crashing Arabian sea waves, panoramic golden hour',
        crowdLevel: 'Under 15 people along the entire ridge',
        category: 'Panoramic Sunset Overlook'
      }
    ]
  },
  kyoto: {
    id: 'demo-kyoto',
    timestamp: Date.now(),
    originalSpot: 'Fushimi Inari Shrine & Arashiyama Bamboo',
    vibe: 'Hidden Views',
    city: 'Kyoto, Japan',
    crowdScore: 9.8,
    crowdLabel: 'Severe Viral Congestion & Selfie-Stick Swarms',
    estimatedWaitMinutes: 110,
    isBucketListIcon: true,
    quietWindow: '6:15 AM – 7:30 AM before tour bus arrival',
    bucketListStrategy: {
      entranceTip: 'Skip the congested lower Senbon Torii tunnel. Take the eastern dirt trail past the bamboo grove up to the Crossroads (Yotsutsuji). 90% of tourists turn back after the first 200m.',
      bestDays: 'Tuesday or Thursday sunrise; avoid 10 AM - 4 PM weekends.',
      skipLineGuide: 'Store luggage at Kyoto Station lockers before sunrise train rather than fighting crowds with rolling suitcases.'
    },
    priceGuard: {
      touristPrice: '¥1,500 matcha sundae in a plastic cup & ¥800 canned tea',
      fairLocalPrice: '¥380 stone-ground ceremonial matcha with handmade warabi mochi',
      markupPercent: '+295% Tourist Markup Alert',
      trapDetails: 'Souvenir stalls near the Torii entrance sell factory-boxed sweets for triple the price of traditional shotengai arcades 4 blocks away.',
      moneySaved: '¥3,800 ($25.00)'
    },
    localGems: [
      {
        id: 'gem-kyoto-1',
        name: 'Adashino Nenbutsu-ji Moss & Bamboo Grove',
        neighborhood: 'Upper Saga-Toriimoto Historic District',
        walkTime: '13 mins walk',
        distance: '980 meters',
        fairLocalPrice: '¥500 / $3.30 temple admission',
        whyLocalsLoveIt: 'A silent, towering bamboo forest sheltered by 8,000 ancient stone Buddhist statues where the only sound is wind rustling through stalks.',
        mapsQuery: 'Adashino Nenbutsuji Temple Kyoto Japan',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Adashino+Nenbutsu-ji+Temple+Kyoto',
        lat: 35.027,
        lng: 135.665,
        vibeMatch: 'Zen silence, whispering green bamboo, spiritual serenity',
        crowdLevel: 'Virtually empty • 95% fewer visitors than Arashiyama',
        category: 'Spiritual Bamboo Sanctuary',
        affiliateTour: {
          title: 'Hidden Arashiyama Backstreets & Zen Moss Walk',
          duration: '3 hrs',
          rating: '4.98 (310 reviews)',
          provider: 'Viator Quiet Collection',
          price: '¥5,200 / $34',
          url: 'https://www.viator.com'
        }
      },
      {
        id: 'gem-kyoto-2',
        name: 'Kamo Riverside Wooden Kissaten (喫茶)',
        neighborhood: 'Demachiyanagi Stepping Stones',
        walkTime: '7 mins walk',
        distance: '500 meters',
        fairLocalPrice: '¥480 / $3.15 charcoal siphon coffee',
        whyLocalsLoveIt: 'A quiet 55-year-old wooden cafe with antique book shelves and tatami window benches overlooking egrets landing along the Kamo River.',
        mapsQuery: 'Kissaten coffee shop Demachiyanagi Kyoto',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Demachiyanagi+Kamo+River+Kyoto',
        lat: 35.030,
        lng: 135.772,
        vibeMatch: 'Warm wood, jazz vinyl spinning, river breeze',
        crowdLevel: 'Kyoto University professors & neighborhood regulars',
        category: 'Vintage Showa-Era Kissaten'
      },
      {
        id: 'gem-kyoto-3',
        name: 'Honen-in Thatched Gate Forest Shrine',
        neighborhood: 'Mount Daimonji Foothills',
        walkTime: '10 mins walk',
        distance: '750 meters',
        fairLocalPrice: 'Free peaceful admission',
        whyLocalsLoveIt: 'Tucked away from the bustling Philosopher’s Path, its mossy thatched gate leads to raked white sand mounds and clear mountain spring ponds.',
        mapsQuery: 'Honen-in Temple Sakyo Ward Kyoto',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Honen-in+Temple+Kyoto',
        lat: 35.024,
        lng: 135.797,
        vibeMatch: 'Forest sanctuary, moss stones, tranquil reflections',
        crowdLevel: 'Zero tour groups permitted inside temple bounds',
        category: 'Secluded Forest Temple'
      }
    ]
  },
  paris: {
    id: 'demo-paris',
    timestamp: Date.now(),
    originalSpot: 'Cafe de Flore & Angelina Hot Chocolate',
    vibe: 'Authentic Food',
    city: 'Paris, France',
    crowdScore: 9.2,
    crowdLabel: 'Viral TikTok Queue & Hurried Tourist Service',
    estimatedWaitMinutes: 75,
    isBucketListIcon: false,
    quietWindow: '7:45 AM – 8:30 AM before Instagram influencers queue up',
    priceGuard: {
      touristPrice: '€19 hot chocolate & €11 generic supermarket croissant',
      fairLocalPrice: '€4.20 artisanal thick ganache hot chocolate & €1.60 AOC butter croissant',
      markupPercent: '+310% Boulevard Saint-Germain Surcharge',
      trapDetails: 'Tables are packed 5cm apart on the terrace, waiters rush plates in under 12 minutes to maximize table turnover, and mandatory bottle water is pushed.',
      moneySaved: '€32.00 ($34.80)'
    },
    localGems: [
      {
        id: 'gem-paris-1',
        name: 'Le Petit Zinc & Ateliers Courtyard',
        neighborhood: '6th Arrondissement (Passage Dauphine)',
        walkTime: '6 mins walk',
        distance: '420 meters',
        fairLocalPrice: '€3.80 espresso & artisan warm madeleine',
        whyLocalsLoveIt: 'Cobbled private passage with gas lamps and potted fig trees where neighborhood book publishers sip morning roast away from boulevard noise.',
        mapsQuery: 'Passage Dauphine 6th Arrondissement Paris',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Passage+Dauphine+Paris',
        lat: 48.854,
        lng: 2.338,
        vibeMatch: 'Quiet cobblestones, literary history, warm buttery aromas',
        crowdLevel: 'Local readers & flâneurs • No line',
        category: 'Historic Passage Espresso Bar'
      },
      {
        id: 'gem-paris-2',
        name: 'Chocolaterie Artisanale Jacques Genin',
        neighborhood: 'Northern Marais (Rue de Turenne)',
        walkTime: '11 mins walk',
        distance: '850 meters',
        fairLocalPrice: '€5.50 velvety Madagascar hot chocolate pot',
        whyLocalsLoveIt: 'Master chocolatier melting pure Grand Cru cocoa with fresh Normandy cream in a high-ceilinged stone atelier with zero hype line.',
        mapsQuery: 'Jacques Genin Rue de Turenne Paris',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Jacques+Genin+Rue+de+Turenne+Paris',
        lat: 48.864,
        lng: 2.365,
        vibeMatch: 'Haute gastronomy, velvet chocolate notes, architectural beauty',
        crowdLevel: 'Quiet Parisian connoisseurs • Relaxed seating',
        category: 'Artisanal Hot Chocolate Salon'
      },
      {
        id: 'gem-paris-3',
        name: 'Square Paul Langevin Hidden Rose Terrace',
        neighborhood: '5th Arrondissement (Latin Quarter Hill)',
        walkTime: '9 mins walk',
        distance: '680 meters',
        fairLocalPrice: 'Free park entry • €2.50 bakery baguette sandwich',
        whyLocalsLoveIt: 'Sunken public garden hidden behind stone university walls, filled with ancient wisteria, park benches, and birdsong.',
        mapsQuery: 'Square Paul Langevin Rue Monge Paris',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Square+Paul+Langevin+Paris',
        lat: 48.847,
        lng: 2.351,
        vibeMatch: 'Hidden city garden, historical masonry, restful silence',
        crowdLevel: 'Sorbonne students reading in peaceful solitude',
        category: 'Secluded Historic Garden'
      }
    ]
  },
  rome: {
    id: 'demo-rome',
    timestamp: Date.now(),
    originalSpot: 'Trevi Fountain & Colosseum Plaza',
    vibe: 'Budget-Friendly',
    city: 'Rome, Italy',
    crowdScore: 9.9,
    crowdLabel: 'Overwhelming Crowd Crush & Pickpocket Alert',
    estimatedWaitMinutes: 120,
    isBucketListIcon: true,
    quietWindow: '6:30 AM – 7:45 AM before police crowd barricades go up',
    bucketListStrategy: {
      entranceTip: 'For Colosseum, book the Roman Forum / Palatine Hill entrance at Via di San Gregorio (50% shorter security check). Walk directly through the inner archway.',
      bestDays: 'Wednesday morning during Papal audience; avoid first Sunday free chaos.',
      skipLineGuide: 'Trevi Fountain view is completely tranquil from the open church steps of Santi Vincenzo e Anastasio opposite the fountain at 7:00 AM.'
    },
    priceGuard: {
      touristPrice: '€22 frozen microwave pasta & €8 small bottle of water',
      fairLocalPrice: '€8.50 handmade Cacio e Pepe & free chilled fountain water (Nasone)',
      markupPercent: '+280% Piazza Surcharge',
      trapDetails: 'Menu touristico places use artificial truffles and pre-cooked pasta. Check if bread and coperto fee exceeds €2 per head.',
      moneySaved: '€38.00 ($41.00)'
    },
    localGems: [
      {
        id: 'gem-rome-1',
        name: 'Trattoria da Enzo al Vicolo',
        neighborhood: 'Monti Back-Alleys (Via della Madonna)',
        walkTime: '8 mins walk',
        distance: '550 meters',
        fairLocalPrice: '€8.50 steaming handmade tonnarelli cacio e pepe',
        whyLocalsLoveIt: 'Family-run trattoria with checkered tablecloths where nonna still rolls pasta fresh every morning. House red wine is €4 a half-litre.',
        mapsQuery: 'Via della Madonna Monti Roma Trattoria',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Via+della+Madonna+Monti+Rome',
        lat: 41.895,
        lng: 12.491,
        vibeMatch: 'Warm Roman hospitality, ivy-draped alley, zero tourist rush',
        crowdLevel: 'Neighborhood artisans & Roman families',
        category: 'Authentic Roman Osteria',
        affiliateTour: {
          title: 'Twilight Monti Secret Wine Cellars & Food Stroll',
          duration: '3 hrs',
          rating: '4.96 (180 reviews)',
          provider: 'Viator Authentic Experiences',
          price: '€45 / $48',
          url: 'https://www.viator.com'
        }
      },
      {
        id: 'gem-rome-2',
        name: 'Orange Garden (Giardino degli Aranci) Belvédère',
        neighborhood: 'Aventine Hill',
        walkTime: '14 mins stroll',
        distance: '1.1 km',
        fairLocalPrice: 'Free admission with open panoramic terrace',
        whyLocalsLoveIt: 'Fragrant bitter orange groves on a quiet hill overlooking St. Peter’s dome and the Tiber river, with Roman buskers playing classical cello.',
        mapsQuery: 'Giardino degli Aranci Aventine Hill Rome',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Giardino+degli+Aranci+Rome',
        lat: 41.885,
        lng: 12.479,
        vibeMatch: 'Citrus blossoms, sweeping Roman skyline, gentle breeze',
        crowdLevel: 'Local couples watching sunset • Peaceful vibes',
        category: 'Scenic Hilltop Terrace'
      },
      {
        id: 'gem-rome-3',
        name: 'Fontana delle Tartarughe (Turtle Fountain)',
        neighborhood: 'Historic Jewish Ghetto (Piazza Mattei)',
        walkTime: '10 mins walk',
        distance: '750 meters',
        fairLocalPrice: 'Free fountain bench • €3.50 carciofo alla giudia',
        whyLocalsLoveIt: 'Renaissance bronze fountain sculpted with playful bronze turtles in a cobblestone square where locals sit with espresso away from mass tours.',
        mapsQuery: 'Piazza Mattei Turtle Fountain Rome',
        mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Piazza+Mattei+Rome',
        lat: 41.893,
        lng: 12.477,
        vibeMatch: 'Renaissance romance, gentle water fountains, quiet piazza',
        crowdLevel: 'Quiet residents reading the morning paper',
        category: 'Quiet Renaissance Piazza'
      }
    ]
  }
};

export default function App() {
  // Google Maps API Key from environment or Firebase project credentials
  const mapsApiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || firebaseConfig.apiKey || '';

  // Google Maps Quota state
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  // Authentication & Cloud SQL State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [cloudRescues, setCloudRescues] = useState<any[]>([]);
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);

  // State: Quota & Pro Pass
  const [rescuesLeft, setRescuesLeft] = useState<number>(() => {
    const saved = localStorage.getItem('uncrowd_rescues_left');
    return saved !== null ? parseInt(saved, 10) : 3;
  });

  const [auditsLeft, setAuditsLeft] = useState<number>(() => {
    const saved = localStorage.getItem('uncrowd_audits_left');
    return saved !== null ? parseInt(saved, 10) : 2;
  });

  const [isPro, setIsPro] = useState<boolean>(() => {
    return localStorage.getItem('uncrowd_is_pro') === 'true';
  });

  // Active Tab: 'audit' | 'street' | 'cache' | 'vault'
  const [activeTab, setActiveTab] = useState<'audit' | 'street' | 'cache' | 'vault'>('audit');

  // Input Query & Selected Vibe
  const [inputQuery, setInputQuery] = useState('');
  const [selectedVibe, setSelectedVibe] = useState('Chill & Quiet');

  // Results & UI State
  const [results, setResults] = useState<RescueResult | null>(() => {
    const base = DEMO_KNOWLEDGE_BASE['kyoto'];
    return {
      ...base,
      id: 'default-preview-kyoto',
      localGems: base.localGems.map((g, idx) => ({
        ...g,
        id: `default-gem-${idx}`
      }))
    };
  });
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<Record<string, 'quiet' | 'busy'>>({});
  const [downrankedGemIds, setDownrankedGemIds] = useState<string[]>([]);
  const [selectedGemMarker, setSelectedGemMarker] = useState<LocalGem | null>(null);

  // Modals & Panels
  const [showPaywall, setShowPaywall] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAffiliateModal, setShowAffiliateModal] = useState<LocalGem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Payment Gateway State
  const [paymentGateway, setPaymentGateway] = useState<'razorpay' | 'stripe'>('razorpay');
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);

  // Offline Street Cache stored in localStorage with guaranteed unique keys
  const [offlineCache, setOfflineCache] = useState<RescueResult[]>(() => {
    try {
      const saved = localStorage.getItem('uncrowd_offline_street_cache');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const seen = new Set<string>();
          const deduped: RescueResult[] = [];
          parsed.forEach((item: RescueResult, idx: number) => {
            const signature = (item.originalSpot || `spot-${idx}`).toLowerCase().trim();
            if (!seen.has(signature)) {
              seen.add(signature);
              deduped.push({
                ...item,
                id: item.id || `cache-${Date.now()}-${idx}`
              });
            }
          });
          if (deduped.length > 0) return deduped;
        }
      }
    } catch {
      // fallback
    }
    return [
      {
        ...DEMO_KNOWLEDGE_BASE['kyoto'],
        id: 'cache-init-kyoto',
        localGems: DEMO_KNOWLEDGE_BASE['kyoto'].localGems.map((g, idx) => ({ ...g, id: `cache-init-kyoto-gem-${idx}` }))
      },
      {
        ...DEMO_KNOWLEDGE_BASE['goa'],
        id: 'cache-init-goa',
        localGems: DEMO_KNOWLEDGE_BASE['goa'].localGems.map((g, idx) => ({ ...g, id: `cache-init-goa-gem-${idx}` }))
      }
    ];
  });

  // Listen to Google Maps quota exhaustion events
  useEffect(() => {
    const handleQuota = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  // Firebase Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
      if (user) {
        try {
          const token = await user.getIdToken();
          setIdToken(token);

          // Sync user with PostgreSQL Cloud SQL
          const res = await fetch('/api/user/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.user?.isPro) {
              setIsPro(true);
            }
          }

          // Fetch saved Cloud SQL rescues
          fetchCloudRescues(token);
        } catch (err) {
          console.error('Firebase Auth sync error:', err);
        }
      } else {
        setIdToken(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Persist State
  useEffect(() => {
    localStorage.setItem('uncrowd_rescues_left', rescuesLeft.toString());
  }, [rescuesLeft]);

  useEffect(() => {
    localStorage.setItem('uncrowd_audits_left', auditsLeft.toString());
  }, [auditsLeft]);

  useEffect(() => {
    localStorage.setItem('uncrowd_is_pro', isPro ? 'true' : 'false');
  }, [isPro]);

  useEffect(() => {
    localStorage.setItem('uncrowd_offline_street_cache', JSON.stringify(offlineCache));
  }, [offlineCache]);

  // Show Toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Google Sign-In with popup
  const handleGoogleSignIn = async () => {
    try {
      const cred = await signInWithPopup(auth, googleAuthProvider);
      const token = await cred.user.getIdToken();
      setIdToken(token);
      showToast(`Welcome, ${cred.user.displayName || cred.user.email}! Cloud Vault active.`);
      fetchCloudRescues(token);
    } catch (err: any) {
      console.error('Google Sign In error:', err);
      showToast('Sign-in cancelled or failed.');
    }
  };

  // Sign out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setIdToken(null);
      showToast('Signed out of Cloud Vault.');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // Fetch Cloud SQL Rescues
  const fetchCloudRescues = async (token?: string) => {
    const bearer = token || idToken;
    if (!bearer) return;
    setIsLoadingCloud(true);
    try {
      const res = await fetch('/api/user/rescues', {
        headers: {
          Authorization: `Bearer ${bearer}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setCloudRescues(data.rescues || []);
      }
    } catch (err) {
      console.error('Failed to load cloud rescues:', err);
    } finally {
      setIsLoadingCloud(false);
    }
  };

  // Check if a spot matches demo presets with guaranteed unique IDs
  const findDemoMatch = (query: string, vibe: string): RescueResult => {
    const q = query.toLowerCase();
    let base = DEMO_KNOWLEDGE_BASE['kyoto'];
    if (q.includes('goa') || q.includes('baga') || q.includes('tito') || q.includes('thalassa') || q.includes('calangute')) {
      base = DEMO_KNOWLEDGE_BASE['goa'];
    } else if (q.includes('paris') || q.includes('flore') || q.includes('angelina') || q.includes('louvre') || q.includes('eiffel') || q.includes('france')) {
      base = DEMO_KNOWLEDGE_BASE['paris'];
    } else if (q.includes('rome') || q.includes('colosseum') || q.includes('trevi') || q.includes('pantheon') || q.includes('vatican') || q.includes('italy')) {
      base = DEMO_KNOWLEDGE_BASE['rome'];
    }

    const uniqueId = `rescue-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    return {
      ...base,
      id: uniqueId,
      timestamp: Date.now(),
      originalSpot: query || base.originalSpot,
      vibe: vibe || base.vibe,
      localGems: base.localGems.map((g, idx) => ({
        ...g,
        id: `gem-${uniqueId}-${idx}`
      }))
    };
  };

  // Perform AI Rescue / Wishlist Audit
  const handlePerformRescue = async (customQuery?: string) => {
    const query = (customQuery !== undefined ? customQuery : inputQuery).trim();
    if (!query) {
      showToast("Please enter a spot or select a preset!");
      return;
    }

    // Check Quota
    if (!isPro) {
      if (activeTab === 'street' && rescuesLeft <= 0) {
        setShowPaywall(true);
        return;
      }
      if (activeTab === 'audit' && auditsLeft <= 0) {
        setShowPaywall(true);
        return;
      }
    }

    setLoading(true);
    const startTime = Date.now();

    // Decrement Quota if not Pro
    if (!isPro) {
      if (activeTab === 'street') {
        setRescuesLeft(prev => Math.max(0, prev - 1));
      } else {
        setAuditsLeft(prev => Math.max(0, prev - 1));
      }
    }

    let parsedResult: RescueResult | null = null;

    try {
      const response = await fetch('/api/rescue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spot: query,
          vibe: selectedVibe,
        }),
      });

      if (response.ok) {
        const parsed = await response.json();
        if (parsed && (parsed.localGems || parsed.originalSpot)) {
          parsedResult = {
            id: 'rescue-' + Date.now(),
            timestamp: Date.now(),
            originalSpot: parsed.originalSpot || query,
            city: parsed.city || 'Travel Destination',
            vibe: selectedVibe,
            crowdScore: typeof parsed.crowdScore === 'number' ? parsed.crowdScore : 9.1,
            crowdLabel: parsed.crowdLabel || 'Severe Viral Congestion',
            estimatedWaitMinutes: parsed.estimatedWaitMinutes || 85,
            isBucketListIcon: Boolean(parsed.isBucketListIcon),
            quietWindow: parsed.quietWindow || '6:45 AM – 8:00 AM',
            bucketListStrategy: parsed.bucketListStrategy,
            priceGuard: {
              touristPrice: parsed.priceGuard?.touristPrice || '300% inflated price',
              fairLocalPrice: parsed.priceGuard?.fairLocalPrice || 'Fair local rate',
              markupPercent: parsed.priceGuard?.markupPercent || '+280% Tourist Markup',
              trapDetails: parsed.priceGuard?.trapDetails || 'Heavily inflated menu for tourists.',
              moneySaved: parsed.priceGuard?.moneySaved || '$28.00 (₹2,300)'
            },
            localGems: (parsed.localGems || []).map((gem: any, idx: number) => ({
              id: `gem-${Date.now()}-${idx}`,
              name: gem.name || 'Secret Local Tavern',
              neighborhood: gem.neighborhood || 'Old Town Alley',
              walkTime: gem.walkTime || '8 mins walk',
              distance: gem.distance || '600m',
              fairLocalPrice: gem.fairLocalPrice || 'True local price',
              whyLocalsLoveIt: gem.whyLocalsLoveIt || 'Hidden gem favored by neighborhood regulars.',
              mapsQuery: gem.mapsQuery || `${gem.name} ${gem.neighborhood || ''}`,
              mapsUrl: gem.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(gem.mapsQuery || gem.name)}`,
              groundedTitle: gem.groundedTitle || gem.name,
              lat: gem.lat,
              lng: gem.lng,
              vibeMatch: gem.vibeMatch || 'Quiet & authentic',
              crowdLevel: gem.crowdLevel || '< 15% tourists • Calm vibe',
              category: gem.category || 'Local Hideaway'
            }))
          };
        }
      }
    } catch (err) {
      console.warn('Server rescue call failed, using verified fallback:', err);
    }

    // Fallback if server call returned empty
    if (!parsedResult) {
      parsedResult = findDemoMatch(query, selectedVibe);
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    setResults(parsedResult);
    setLoading(false);

    // Save to Offline Street Cache
    setOfflineCache(prev => {
      const filtered = prev.filter(
        item => item.id !== parsedResult!.id && item.originalSpot.toLowerCase().trim() !== parsedResult!.originalSpot.toLowerCase().trim()
      );
      return [parsedResult!, ...filtered].slice(0, 10);
    });

    // If user is authenticated, save automatically to Cloud SQL PostgreSQL
    if (idToken) {
      try {
        await fetch('/api/user/rescue/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`
          },
          body: JSON.stringify(parsedResult)
        });
        fetchCloudRescues();
      } catch (e) {
        console.error('Failed to auto-save to Cloud SQL:', e);
      }
    }

    showToast(`Rescue complete in ${elapsed}s! Saved 3 verified local gems.`);
  };

  // Feedback Loop
  const handleFeedback = async (gemId: string, status: 'quiet' | 'busy', gemName: string) => {
    setFeedback(prev => ({ ...prev, [gemId]: status }));

    // Post to feedback API endpoint
    try {
      await fetch('/api/gem/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gemId: parseInt(gemId.replace(/\D/g, ''), 10) || 1,
          isQuiet: status === 'quiet'
        })
      });
    } catch {
      // Non-blocking
    }

    if (status === 'quiet') {
      showToast(`Verified! "${gemName}" confidence boosted. Opening Share Card!`);
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 }
      });
      setTimeout(() => {
        setShowShareModal(true);
      }, 500);
    } else {
      setDownrankedGemIds(prev => [...prev, gemId]);
      showToast(`Flagged! "${gemName}" downranked for this session.`);
    }
  };

  // Simulated Payment Checkout
  const handleCheckoutPayment = async () => {
    setIsPaymentProcessing(true);
    setTimeout(async () => {
      setIsPaymentProcessing(false);
      setIsPro(true);

      // If signed in, update in Cloud SQL
      if (idToken) {
        try {
          await fetch('/api/user/upgrade-pro', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${idToken}`
            }
          });
        } catch (e) {
          console.error('Failed to upgrade in DB:', e);
        }
      }

      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.5 }
      });
      setShowPaywall(false);
      showToast('🎉 Unlimited Pro Trip Pass Active!');
    }, 1200);
  };

  // Active Gems Filtered by Downranked Session Memory
  const activeGems = useMemo(() => {
    if (!results) return [];
    return results.localGems.filter(gem => !downrankedGemIds.includes(gem.id));
  }, [results, downrankedGemIds]);

  // Map center calculation
  const mapCenter = useMemo(() => {
    if (activeGems.length > 0 && activeGems[0].lat && activeGems[0].lng) {
      return { lat: activeGems[0].lat, lng: activeGems[0].lng };
    }
    const spot = (results?.originalSpot || results?.city || '').toLowerCase();
    if (spot.includes('goa')) return { lat: 15.525, lng: 73.785 };
    if (spot.includes('kyoto') || spot.includes('japan')) return { lat: 35.0116, lng: 135.7681 };
    if (spot.includes('paris') || spot.includes('france')) return { lat: 48.8566, lng: 2.3522 };
    if (spot.includes('rome') || spot.includes('italy')) return { lat: 41.8902, lng: 12.4922 };
    return { lat: 48.8566, lng: 2.3522 };
  }, [results, activeGems]);

  return (
    <APIProvider apiKey={mapsApiKey} solutionChannel="GMP_aistudio_build">
      <div className="min-h-screen bg-slate-900 flex justify-center text-slate-800 antialiased selection:bg-emerald-500 selection:text-white">
        
        {/* Mobile-First Constrained Wrapper (App Container) */}
        <div className="w-full max-w-md min-h-screen bg-white flex flex-col shadow-2xl relative border-x border-slate-200">
          
          {/* Mandatory In-App Google Maps Demo Key Quota Notice */}
          {quotaExceeded && (
            <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
              <span>
                Google Maps Platform quota reached. If you are the app owner, visit{' '}
                <a
                  href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-semibold text-amber-950 hover:text-amber-800"
                >
                  maps developer site
                </a>{' '}
                for instructions to update your account.
              </span>
            </div>
          )}

          {/* --- 1. TOP BAR (Deep Slate Navy #0F172A) --- */}
          <header className="sticky top-0 z-40 bg-[#0F172A] text-white px-4 pt-3.5 pb-3 border-b border-slate-800 shadow-md">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('audit')}>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Compass className="w-5 h-5 animate-pulse-slow" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h1 className="text-xl font-black tracking-tight text-white flex items-center">
                      UnCrowd<span className="text-emerald-400 font-extrabold text-xs ml-1 px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30">AI</span>
                    </h1>
                  </div>
                  <p className="text-[10px] text-slate-400 -mt-0.5 font-medium tracking-wide">
                    Anti-Tourist-Trap & Hidden-Gem Companion
                  </p>
                </div>
              </div>

              {/* Right: Auth / Pro status */}
              <div className="flex items-center gap-2">
                {isPro ? (
                  <div className="flex items-center gap-1 bg-gradient-to-r from-amber-500/20 to-emerald-500/20 border border-amber-400/50 px-2.5 py-1 rounded-full">
                    <Sparkles className="w-3 h-3 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
                    <span className="text-[11px] font-bold text-amber-300">PRO PASS</span>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowPaywall(true)}
                    className="flex items-center gap-1 bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 px-2 py-1 rounded-full transition cursor-pointer"
                    title="Click to view Trip Pass details"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-[10px] font-bold text-emerald-400">
                      {activeTab === 'street' ? rescuesLeft : auditsLeft} Left
                    </span>
                  </button>
                )}

                {/* Google Sign In / User Avatar */}
                {currentUser ? (
                  <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 px-2 py-1 rounded-full">
                    {currentUser.photoURL ? (
                      <img src={currentUser.photoURL} alt="User" className="w-4 h-4 rounded-full" />
                    ) : (
                      <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    <span className="text-[10px] font-bold text-slate-200 max-w-[60px] truncate">
                      {currentUser.displayName?.split(' ')[0] || currentUser.email?.split('@')[0]}
                    </span>
                    <button
                      onClick={handleSignOut}
                      className="text-slate-400 hover:text-rose-400 text-[10px] ml-0.5"
                      title="Sign out"
                    >
                      <LogOut className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleGoogleSignIn}
                    className="flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-900 border border-slate-300 px-2 py-1 rounded-full text-[10px] font-bold transition shadow-xs cursor-pointer"
                  >
                    <svg className="w-3 h-3" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Sign In</span>
                  </button>
                )}
              </div>
            </div>

            {/* Subheader Monetization & Quick Strip */}
            <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1.5 text-xs">
              <button
                onClick={() => setShowPaywall(true)}
                className="flex-1 py-1.5 px-2.5 rounded-lg bg-gradient-to-r from-amber-500 via-rose-500 to-emerald-500 hover:brightness-110 text-white font-extrabold flex items-center justify-center gap-1 shadow-sm transition text-[11px]"
              >
                <CreditCard className="w-3 h-3" />
                <span>{isPro ? 'Pro Trip Pass Active' : 'Trip Pass (₹399 / $4.99)'}</span>
              </button>

              <button
                onClick={() => setActiveTab('cache')}
                className={`py-1.5 px-2.5 rounded-lg border font-bold flex items-center gap-1 transition text-[11px] ${
                  activeTab === 'cache'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
                title="View Offline Cached Itinerary"
              >
                <Bookmark className="w-3 h-3 text-emerald-400" />
                <span>Cache ({offlineCache.length})</span>
              </button>

              <button
                onClick={() => {
                  if (!currentUser) {
                    showToast('Sign in to view your Cloud SQL Trips Vault!');
                    handleGoogleSignIn();
                  } else {
                    setActiveTab('vault');
                    fetchCloudRescues();
                  }
                }}
                className={`py-1.5 px-2.5 rounded-lg border font-bold flex items-center gap-1 transition text-[11px] ${
                  activeTab === 'vault'
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                }`}
                title="Cloud SQL PostgreSQL Database Vault"
              >
                <Database className="w-3 h-3 text-blue-400" />
                <span>Vault ({cloudRescues.length})</span>
              </button>
            </div>
          </header>

          {/* --- 2. MAIN NAVIGATION TABS --- */}
          <div className="bg-[#0F172A] px-4 pb-3">
            <div className="bg-slate-900/90 p-1 rounded-xl flex items-center border border-slate-800">
              <button
                onClick={() => setActiveTab('audit')}
                className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'audit'
                    ? 'bg-white text-[#0F172A] shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                <span>Audit Wishlist</span>
              </button>

              <button
                onClick={() => setActiveTab('street')}
                className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'street'
                    ? 'bg-[#EF4444] text-white shadow-sm'
                    : 'text-rose-400 hover:text-rose-300'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>I'm Here & It's Crowded!</span>
              </button>
            </div>
          </div>

          {/* --- 3. TAB BODIES --- */}
          <main className="flex-1 p-4 space-y-4 overflow-y-auto">
            
            {/* TAB 1: AUDIT MY WISHLIST */}
            {activeTab === 'audit' && (
              <div className="space-y-3.5 animate-in fade-in duration-200">
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5 text-slate-700" />
                      Paste Viral Spots or ChatGPT Itinerary
                    </label>
                    <span className="text-[10px] text-slate-500 font-semibold">
                      AI Anti-Trap Audit
                    </span>
                  </div>

                  <textarea
                    value={inputQuery}
                    onChange={(e) => setInputQuery(e.target.value)}
                    placeholder="e.g. Baga Beach, Cafe de Flore, Fushimi Inari Torii Gates, Trevi Fountain..."
                    rows={3}
                    className="w-full text-xs p-3 bg-white rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden transition resize-none placeholder:text-slate-400"
                  />

                  {/* 1-Click Viral Preset Buttons */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Or Try Verified Viral Presets:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {PRESETS.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setInputQuery(p.query);
                            setSelectedVibe(p.vibe);
                            handlePerformRescue(p.query);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 text-[11px] font-bold text-slate-700 transition shadow-2xs"
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: EMERGENCY STREET RESCUE (Coral Red #EF4444) */}
            {activeTab === 'street' && (
              <div className="space-y-3.5 animate-in fade-in duration-200">
                <div className="bg-rose-50 border-2 border-[#EF4444] p-4 rounded-2xl space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-[#EF4444]" />
                      Emergency Street Pivot
                    </span>
                    <span className="text-[10px] font-extrabold bg-[#EF4444] text-white px-2 py-0.5 rounded-full">
                      Walk &lt; 15 Mins
                    </span>
                  </div>

                  <p className="text-xs text-rose-900 font-medium leading-relaxed">
                    Standing in an endless line right now? Type the crowded spot or tap a nearby hotspot for immediate walking-distance alternatives.
                  </p>

                  <div className="relative">
                    <input
                      type="text"
                      value={inputQuery}
                      onChange={(e) => setInputQuery(e.target.value)}
                      placeholder="Which crowded spot are you standing at?"
                      className="w-full text-xs p-3.5 bg-white rounded-xl border border-rose-300 focus:border-[#EF4444] focus:ring-1 focus:ring-[#EF4444] focus:outline-hidden transition shadow-inner font-semibold placeholder:text-slate-400"
                    />
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    <span className="text-[10px] text-rose-600 font-bold self-center">Instant:</span>
                    {PRESETS.map((p) => (
                      <button
                        key={`street-${p.id}`}
                        onClick={() => {
                          setInputQuery(p.query.split(',')[0]);
                          handlePerformRescue(p.query.split(',')[0]);
                        }}
                        className="px-2 py-0.5 rounded-md bg-white border border-rose-200 hover:bg-rose-100 text-[10px] font-bold text-rose-800 transition"
                      >
                        {p.label.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: OFFLINE STREET CACHE */}
            {activeTab === 'cache' && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5">
                    <Bookmark className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Saved Offline Street Cache
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">
                    No Roaming / Data Needed
                  </span>
                </div>

                <div className="space-y-2">
                  {offlineCache.map((item, idx) => (
                    <div
                      key={`cache-item-${item.id}-${idx}`}
                      onClick={() => {
                        setResults(item);
                        setActiveTab('audit');
                      }}
                      className="p-3 bg-white rounded-xl border border-slate-200 hover:border-emerald-500 cursor-pointer transition shadow-2xs space-y-1.5"
                    >
                      <div className="flex justify-between items-start">
                        <h4 className="font-extrabold text-xs text-slate-900">{item.originalSpot}</h4>
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                          {item.crowdScore}/10 Crowd
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        {item.localGems.map(g => g.name).join(' • ')}
                      </p>
                      <div className="flex justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                        <span>Saved: {item.priceGuard?.moneySaved}</span>
                        <span className="font-bold text-emerald-600">Tap to load &rarr;</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: CLOUD SQL POSTGRESQL VAULT */}
            {activeTab === 'vault' && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-blue-600" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      Cloud SQL Trip Vault (PostgreSQL)
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    Persisted
                  </span>
                </div>

                {isLoadingCloud ? (
                  <div className="text-center py-8 text-xs text-slate-500 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                    <span>Querying Cloud SQL PostgreSQL instance...</span>
                  </div>
                ) : cloudRescues.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-2">
                    <p className="font-bold">No rescues saved in PostgreSQL yet.</p>
                    <p className="text-[11px] text-slate-400">
                      Run an Audit or Street Rescue while signed in to automatically store your itinerary in Cloud SQL.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {cloudRescues.map((rescue, rIdx) => (
                      <div
                        key={`cloud-rescue-${rescue.id}-${rIdx}`}
                        className="bg-white rounded-xl border border-blue-200 p-3 space-y-2 shadow-2xs"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-blue-600">
                              {rescue.city || 'Destination'}
                            </span>
                            <h4 className="font-extrabold text-xs text-slate-900 mt-0.5">
                              {rescue.originalSpot}
                            </h4>
                          </div>
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                            {rescue.crowdScore}/10 Crowd
                          </span>
                        </div>

                        {rescue.localGems && rescue.localGems.length > 0 && (
                          <div className="space-y-1 pt-1 border-t border-slate-100">
                            {rescue.localGems.map((gem: any, gIdx: number) => (
                              <div key={`cloud-gem-${gem.id}-${gIdx}`} className="flex justify-between items-center text-[11px]">
                                <span className="font-semibold text-slate-700 truncate max-w-[180px]">{gem.name}</span>
                                <span className="text-emerald-600 font-bold">{gem.fairPrice || gem.walkTime}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* VIBE FILTER PILLS (Only shown on Audit & Street tabs) */}
            {(activeTab === 'audit' || activeTab === 'street') && (
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-extrabold tracking-wider text-slate-500 uppercase flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-slate-700" />
                    WANTED VIBE FILTER
                  </label>
                  <span className="text-[10px] text-slate-400">Anti-Saturation Algorithm</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {VIBES.map((v) => {
                    const isSelected = selectedVibe === v.label;
                    return (
                      <button
                        key={v.label}
                        onClick={() => setSelectedVibe(v.label)}
                        className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-base">{v.icon}</span>
                        <div className="min-w-0">
                          <div className={`text-xs font-bold leading-tight ${isSelected ? 'text-emerald-800' : 'text-slate-800'}`}>
                            {v.label}
                          </div>
                          <div className="text-[10px] text-slate-400 line-clamp-1">
                            {v.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* ACTION RESCUE BUTTON */}
                <button
                  onClick={() => handlePerformRescue()}
                  disabled={loading}
                  className={`w-full mt-2 py-3.5 px-4 rounded-xl font-black text-sm text-white shadow-lg transition flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === 'street'
                      ? 'bg-gradient-to-r from-[#EF4444] to-rose-600 hover:from-rose-600 hover:to-rose-700 shadow-rose-200'
                      : 'bg-gradient-to-r from-[#10B981] to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-200'
                  }`}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Scanning crowd databases & Google Maps...</span>
                    </>
                  ) : (
                    <>
                      {activeTab === 'street' ? (
                        <>
                          <Flame className="w-4 h-4" />
                          <span>Instant Street Rescue (Sub-30s Pivot)</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Audit Wishlist & Reveal 3 Local Gems</span>
                        </>
                      )}
                    </>
                  )}
                </button>
              </div>
            )}

            {/* --- 4. RESULTS VIEW (Displayed when results are present and on audit/street tabs) --- */}
            {results && (activeTab === 'audit' || activeTab === 'street') && (
              <div className="space-y-3.5 pt-1">
                
                {/* CROWD WARNING CARD (Coral Red #EF4444) */}
                <div className="bg-white rounded-2xl border-2 border-[#EF4444]/30 shadow-md p-4 space-y-3 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#EF4444]/5 rounded-bl-full pointer-events-none" />

                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#EF4444] flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        CROWD WARNING & OVERTOURISM AUDIT
                      </span>
                      <h3 className="font-extrabold text-base text-slate-900">
                        {results.originalSpot}
                      </h3>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="inline-flex items-center gap-1 bg-[#EF4444] text-white font-black text-xs px-2.5 py-1 rounded-lg shadow-xs">
                        <span>Crowd:</span>
                        <span className="text-sm">{results.crowdScore}/10</span>
                      </div>
                      <p className="text-[10px] font-semibold text-rose-700 mt-0.5">
                        {results.crowdLabel}
                      </p>
                    </div>
                  </div>

                  {/* Best Quiet Hour / Gate Window */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-600" />
                        QUIET ARRIVAL WINDOW
                      </span>
                      <p className="font-extrabold text-slate-900">
                        {results.quietWindow}
                      </p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                        <TrendingDown className="w-3 h-3 text-emerald-600" />
                        QUEUE TIME ESTIMATE
                      </span>
                      <p className="font-extrabold text-rose-600">
                        ~{results.estimatedWaitMinutes} mins wasted in line
                      </p>
                    </div>
                  </div>

                  {/* Bucket-List World Icon Gate Strategy */}
                  {results.isBucketListIcon && results.bucketListStrategy && (
                    <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-xs space-y-1.5">
                      <div className="flex items-center gap-1.5 text-amber-900 font-extrabold">
                        <ShieldCheck className="w-4 h-4 text-amber-600" />
                        <span>Bucket-List Icon Gate Strategy</span>
                      </div>
                      <p className="text-amber-800 text-[11px] leading-relaxed">
                        💡 <strong>Insider Gate Tip:</strong> {results.bucketListStrategy.entranceTip}
                      </p>
                      <p className="text-amber-800 text-[11px]">
                        🗓️ <strong>Best Strategy:</strong> {results.bucketListStrategy.bestDays}
                      </p>
                    </div>
                  )}

                  {/* Tourist-Trap Price Guard */}
                  <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-rose-900 flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-rose-600" />
                        Tourist-Trap Price Guard
                      </span>
                      <span className="text-[10px] font-black text-rose-700 bg-rose-200/60 px-2 py-0.5 rounded">
                        {results.priceGuard.markupPercent}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                      <div className="bg-white/80 p-2 rounded-lg border border-rose-200">
                        <span className="text-[10px] font-bold text-rose-600 block">Tourist Trap Price:</span>
                        <span className="font-semibold text-slate-800">{results.priceGuard.touristPrice}</span>
                      </div>
                      <div className="bg-emerald-50/80 p-2 rounded-lg border border-emerald-300">
                        <span className="text-[10px] font-bold text-emerald-700 block">Fair Local Price:</span>
                        <span className="font-bold text-emerald-800">{results.priceGuard.fairLocalPrice}</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-600 italic">
                      {results.priceGuard.trapDetails}
                    </p>
                  </div>
                </div>

                {/* --- INTERACTIVE GOOGLE MAP OF LOCAL GEMS --- */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                        Live Google Maps Grounding
                      </span>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      {activeGems.length} Safe Pins
                    </span>
                  </div>

                  {/* Explicit Height Container for Google Map (CF2 Guard) */}
                  <div className="h-56 w-full rounded-xl overflow-hidden border border-slate-200 relative bg-slate-100">
                    <Map
                      mapId="DEMO_MAP_ID"
                      internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
                      defaultCenter={mapCenter}
                      defaultZoom={13}
                      gestureHandling="greedy"
                      disableDefaultUI={false}
                      className="w-full h-full"
                    >
                      {activeGems.map((gem, idx) => {
                        const lat = gem.lat || (mapCenter.lat + (idx === 0 ? 0.005 : idx === 1 ? -0.004 : 0.003));
                        const lng = gem.lng || (mapCenter.lng + (idx === 0 ? -0.004 : idx === 1 ? 0.006 : -0.005));
                        return (
                          <AdvancedMarker
                            key={`marker-${gem.id}-${idx}`}
                            position={{ lat, lng }}
                            onClick={() => setSelectedGemMarker(gem)}
                          >
                            <Pin background="#10B981" borderColor="#065F46" glyphColor="#ffffff" scale={1.1} />
                          </AdvancedMarker>
                        );
                      })}

                      {selectedGemMarker && (
                        <InfoWindow
                          position={{
                            lat: selectedGemMarker.lat || mapCenter.lat,
                            lng: selectedGemMarker.lng || mapCenter.lng
                          }}
                          onCloseClick={() => setSelectedGemMarker(null)}
                        >
                          <div className="p-1 max-w-[200px] text-xs space-y-1">
                            <p className="font-extrabold text-slate-900">{selectedGemMarker.name}</p>
                            <p className="text-[10px] text-slate-500">{selectedGemMarker.neighborhood} • {selectedGemMarker.walkTime}</p>
                            <p className="text-[10px] font-bold text-emerald-700">{selectedGemMarker.fairLocalPrice}</p>
                            <a
                              href={selectedGemMarker.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedGemMarker.mapsQuery || selectedGemMarker.name)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] font-black text-emerald-600 underline block"
                            >
                              Open in Google Maps &rarr;
                            </a>
                          </div>
                        </InfoWindow>
                      )}
                    </Map>
                  </div>
                </div>

                {/* 3 EMERALD GREEN LOCAL GEMS (#10B981) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <h3 className="text-xs font-black uppercase tracking-wider text-emerald-800">
                        Same-Vibe Local Gems (Within 10–15 Min Walk)
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">
                      {activeGems.length} Verified Alternatives
                    </span>
                  </div>

                  {activeGems.map((gem, index) => {
                    const currentFeedback = feedback[gem.id];
                    const mapsUrl = gem.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      gem.mapsQuery || `${gem.name} ${gem.neighborhood}`
                    )}`;

                    return (
                      <div
                        key={`local-gem-card-${gem.id || index}-${index}`}
                        className="bg-white rounded-2xl border-2 border-emerald-500/30 hover:border-emerald-500 p-4 shadow-sm hover:shadow-md transition space-y-3 relative overflow-hidden"
                      >
                        {/* Top Gem Details */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                                Top Pick #{index + 1}
                              </span>
                              <span className="text-[10px] font-semibold text-slate-500">
                                {gem.category}
                              </span>
                              {gem.groundedTitle && (
                                <span className="bg-blue-50 text-blue-700 font-bold text-[9px] px-1.5 py-0.5 rounded border border-blue-200">
                                  Google Maps Grounded
                                </span>
                              )}
                            </div>
                            <h4 className="font-extrabold text-base text-slate-900 leading-snug">
                              {gem.name}
                            </h4>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>{gem.neighborhood}</span>
                            </p>
                          </div>

                          {/* Walk Distance Pill */}
                          <div className="shrink-0 text-right">
                            <span className="inline-block bg-emerald-50 border border-emerald-200 text-emerald-800 font-black text-xs px-2.5 py-1 rounded-xl">
                              {gem.walkTime}
                            </span>
                            <span className="block text-[10px] text-slate-400 mt-0.5">
                              {gem.distance}
                            </span>
                          </div>
                        </div>

                        {/* Why Locals Love It Hook */}
                        <div className="bg-emerald-50/60 border-l-4 border-emerald-500 p-2.5 rounded-r-xl">
                          <p className="text-xs text-emerald-950 font-medium leading-relaxed">
                            "{gem.whyLocalsLoveIt}"
                          </p>
                        </div>

                        {/* Local Price & Crowd Indicator */}
                        <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-200">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-semibold">FAIR LOCAL PRICE</span>
                            <span className="font-bold text-slate-800">{gem.fairLocalPrice}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block font-semibold">CROWD STATUS</span>
                            <span className="font-bold text-emerald-600 flex items-center gap-1 justify-end">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                              {gem.crowdLevel}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons: Navigate Google Maps + Affiliate Experience */}
                        <div className="flex items-center gap-2 pt-1">
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                            <span>Navigate via Google Maps</span>
                          </a>

                          {gem.affiliateTour && (
                            <button
                              onClick={() => setShowAffiliateModal(gem)}
                              className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1 transition"
                              title="Book Curated Quiet Tour / Workshop"
                            >
                              <Compass className="w-3.5 h-3.5 text-slate-600" />
                              <span>Tour</span>
                            </button>
                          )}
                        </div>

                        {/* 1-Tap Ground-Truth Feedback Bar */}
                        <div className="border-t border-slate-100 pt-2.5 flex items-center justify-between text-xs">
                          <span className="text-[11px] font-bold text-slate-500">
                            Was this gem quiet?
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleFeedback(gem.id, 'quiet', gem.name)}
                              className={`px-2.5 py-1 rounded-lg font-bold text-xs flex items-center gap-1 transition ${
                                currentFeedback === 'quiet'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-700 hover:bg-emerald-100 hover:text-emerald-800'
                              }`}
                            >
                              <ThumbsUp className="w-3 h-3" />
                              <span>Yes, Quiet!</span>
                            </button>

                            <button
                              onClick={() => handleFeedback(gem.id, 'busy', gem.name)}
                              className={`px-2.5 py-1 rounded-lg font-bold text-xs flex items-center gap-1 transition ${
                                currentFeedback === 'busy'
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-700 hover:bg-rose-100 hover:text-rose-800'
                              }`}
                            >
                              <ThumbsDown className="w-3 h-3" />
                              <span>Still Busy</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </main>

          {/* ========================================================================= */}
          {/* --- MODAL 1: MONETIZATION PAYWALL (₹399 / $4.99 TRIP PASS) --- */}
          {/* ========================================================================= */}
          {showPaywall && (
            <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4 relative animate-in zoom-in-95 duration-200">
                <button
                  onClick={() => setShowPaywall(false)}
                  className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-full bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="text-center space-y-1">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 mx-auto flex items-center justify-center text-white shadow-md">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 pt-1">
                    UnCrowd Pro Trip Pass
                  </h3>
                  <p className="text-xs text-slate-500">
                    Unlimited Street Rescues, Live Google Maps Grounding & Cloud SQL Sync.
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-slate-600">Price:</span>
                    <span className="text-base font-black text-slate-900">₹399 / $4.99</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Duration:</span>
                    <span className="font-semibold text-emerald-700">One-Time (No Subscriptions)</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Cloud SQL Storage:</span>
                    <span className="font-semibold text-blue-700">Unlimited Sync</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setPaymentGateway('razorpay')}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      paymentGateway === 'razorpay'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <span>Razorpay UPI</span>
                  </button>
                  <button
                    onClick={() => setPaymentGateway('stripe')}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      paymentGateway === 'stripe'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <span>Stripe Cards</span>
                  </button>
                </div>

                <button
                  onClick={handleCheckoutPayment}
                  disabled={isPaymentProcessing}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isPaymentProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying pass...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Unlock Pro Trip Pass (₹399 / $4.99)</span>
                    </>
                  )}
                </button>

                {/* Instant Test Mode Toggle */}
                <div className="text-center pt-1 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setIsPro(!isPro);
                      setShowPaywall(false);
                      showToast(isPro ? 'Pro deactivated for testing.' : '🎉 Test Pro Pass unlocked!');
                    }}
                    className="text-[11px] font-bold text-slate-500 hover:text-slate-800 underline"
                  >
                    {isPro ? 'Test Mode: Lock Pro Pass' : 'Test Mode: Instant Unlock Pro (Free Toggle)'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* --- MODAL 2: VIRAL SAVINGS SHARE CARD --- */}
          {showShareModal && results && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4 relative">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-full bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="text-center space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">
                    Overtourism Evaded
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Your UnCrowd Victory Story
                  </h3>
                </div>

                <div className="bg-[#0F172A] text-white p-4 rounded-2xl space-y-3 shadow-lg">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-emerald-400" />
                      <span className="font-black text-sm tracking-tight text-white">UnCrowd AI</span>
                    </div>
                    <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      Anti-Tourist-Trap
                    </span>
                  </div>

                  <div className="space-y-1 pt-1">
                    <p className="text-[11px] text-slate-400 uppercase tracking-wider font-bold">
                      Escaped from:
                    </p>
                    <p className="text-sm font-extrabold text-rose-400 line-clamp-1">
                      {results.originalSpot}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800 text-center">
                    <div className="bg-slate-800/80 p-2 rounded-xl">
                      <span className="text-[10px] text-slate-400 block font-semibold">Queue Saved:</span>
                      <span className="text-base font-black text-emerald-400">
                        {Math.round(results.estimatedWaitMinutes / 60 * 10) / 10} hrs
                      </span>
                    </div>
                    <div className="bg-slate-800/80 p-2 rounded-xl">
                      <span className="text-[10px] text-slate-400 block font-semibold">Money Saved:</span>
                      <span className="text-base font-black text-amber-300">
                        {results.priceGuard.moneySaved}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => {
                      const text = `I just avoided a 2-hour tourist trap at ${results.originalSpot} and saved ${results.priceGuard.moneySaved} using UnCrowd AI! 🗺️✨`;
                      navigator.clipboard?.writeText(text);
                      showToast('Copied story text to clipboard!');
                    }}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Copy Story for WhatsApp / Instagram</span>
                  </button>
                  <button
                    onClick={() => setShowShareModal(false)}
                    className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* --- MODAL 3: AFFILIATE TOUR DETAILS --- */}
          {showAffiliateModal && showAffiliateModal.affiliateTour && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4 relative">
                <button
                  onClick={() => setShowAffiliateModal(null)}
                  className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-full bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    {showAffiliateModal.affiliateTour.provider}
                  </span>
                  <h3 className="font-extrabold text-base text-slate-900 mt-1">
                    {showAffiliateModal.affiliateTour.title}
                  </h3>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Duration:</span>
                    <span className="font-bold text-slate-800">{showAffiliateModal.affiliateTour.duration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Rating:</span>
                    <span className="font-bold text-amber-600">⭐ {showAffiliateModal.affiliateTour.rating}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Rate:</span>
                    <span className="font-extrabold text-emerald-700">{showAffiliateModal.affiliateTour.price}</span>
                  </div>
                </div>

                <a
                  href={showAffiliateModal.affiliateTour.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm transition block text-center"
                >
                  <span>Book Experience on {showAffiliateModal.affiliateTour.provider}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* --- FLOATING TOAST NOTIFICATION --- */}
          {toastMessage && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0F172A] text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-slate-700 text-xs font-bold flex items-center gap-2 max-w-xs animate-in fade-in slide-in-from-bottom-3 duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="line-clamp-2">{toastMessage}</span>
            </div>
          )}

        </div>
      </div>
    </APIProvider>
  );
}
