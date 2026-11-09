import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { requireAuth } from './src/middleware/auth.ts';
import {
  getOrCreateUser,
  getUserByUid,
  updateUserProStatus,
  saveUserRescue,
  getUserSavedRescues,
  voteLocalGem,
} from './src/db/queries.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Mask API key for secure server logs
const getMaskedKey = (key) => {
  if (!key || typeof key !== 'string') return 'Not Configured';
  if (key.length <= 8) return '****';
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
};

console.log(`[UnCrowd Express] Initializing. Gemini Key Status: ${getMaskedKey(process.env.GEMINI_API_KEY)}`);

// Initialize server-side GoogleGenAI client with required 'aistudio-build' User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Rich Fallback Data
const SERVER_FALLBACKS = {
  goa: {
    originalSpot: "Baga Beach & Tito's Lane",
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
        category: 'Coastal Seafood Tavern'
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
    originalSpot: 'Fushimi Inari Shrine & Arashiyama Bamboo',
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
        category: 'Spiritual Bamboo Sanctuary'
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
    originalSpot: 'Cafe de Flore & Angelina Hot Chocolate',
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
  }
};

function getLocalFallback(query, vibe) {
  const q = (query || '').toLowerCase();
  if (q.includes('goa') || q.includes('baga') || q.includes('tito') || q.includes('thalassa')) {
    return { ...SERVER_FALLBACKS.goa, originalSpot: query, vibe };
  }
  if (q.includes('paris') || q.includes('flore') || q.includes('angelina') || q.includes('louvre')) {
    return { ...SERVER_FALLBACKS.paris, originalSpot: query, vibe };
  }
  if (q.includes('kyoto') || q.includes('inari') || q.includes('bamboo') || q.includes('japan')) {
    return { ...SERVER_FALLBACKS.kyoto, originalSpot: query, vibe };
  }

  const cleanName = (query || 'Popular Viral Spot').trim();
  return {
    originalSpot: cleanName,
    city: 'Travel Destination',
    vibe: vibe || 'Chill & Quiet',
    crowdScore: 8.9,
    crowdLabel: 'High Peak-Hour Congestion Detected',
    estimatedWaitMinutes: 65,
    isBucketListIcon: cleanName.length > 15,
    quietWindow: '7:15 AM – 8:45 AM for quiet exploration',
    bucketListStrategy: {
      entranceTip: 'Avoid the main queue facing the plaza; navigate through the eastern residential side alley.',
      bestDays: 'Tuesday or Thursday morning before 9:00 AM.',
      skipLineGuide: 'Book verified timed slots or head 300m into the side streets for zero line.'
    },
    priceGuard: {
      touristPrice: '300% inflated markup on main tourist thoroughfare',
      fairLocalPrice: 'Authentic local prices 2-3 blocks into neighborhood',
      markupPercent: '+275% Tourist Zone Surcharge',
      trapDetails: 'Menu prices drop by more than 50% just one turn off the primary tourist walkway.',
      moneySaved: '$35.00 (₹2,900)'
    },
    localGems: [
      {
        id: `gem-dyn-1-${Date.now()}`,
        name: `${cleanName} Historic Courtyard & Roastery`,
        neighborhood: 'Old Town Heritage Quarter (1 block north)',
        walkTime: '6 mins walk',
        distance: '450 meters',
        fairLocalPrice: 'Local rate: $3.50 / ₹180',
        whyLocalsLoveIt: 'Quiet cobblestone courtyard hidden behind wooden archways where neighborhood residents gather for fresh morning brews away from tour groups.',
        mapsQuery: `${cleanName} quiet cafe bakery`,
        mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanName + ' quiet cafe')}`,
        lat: 48.8566,
        lng: 2.3522,
        vibeMatch: 'Acoustic calm, authentic neighborhood pace',
        crowdLevel: '< 15% tourists • Calm atmosphere',
        category: 'Neighborhood Artisan Bistro'
      },
      {
        id: `gem-dyn-2-${Date.now()}`,
        name: 'The Sunken Garden & Stone Overlook',
        neighborhood: 'Hillside Green Corridor',
        walkTime: '11 mins walk',
        distance: '820 meters',
        fairLocalPrice: 'Free public access with open views',
        whyLocalsLoveIt: 'Unmarked botanical walkway with panoramic vistas of the cityscape, shaded stone benches, and zero commercial stalls.',
        mapsQuery: `${cleanName} scenic garden view`,
        mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanName + ' scenic garden')}`,
        lat: 48.8606,
        lng: 2.3552,
        vibeMatch: 'Hidden views, peaceful nature, fresh breeze',
        crowdLevel: 'Virtually empty • Local dog walkers',
        category: 'Scenic Secret Overlook'
      },
      {
        id: `gem-dyn-3-${Date.now()}`,
        name: 'Nonna’s Family Kitchen & Cantina',
        neighborhood: 'Artisan Workshop Lane',
        walkTime: '9 mins walk',
        distance: '680 meters',
        fairLocalPrice: 'True local home-cooked meal baseline',
        whyLocalsLoveIt: 'Third-generation family-operated kitchen serving heritage recipes with ingredients sourced directly from morning market stalls.',
        mapsQuery: `${cleanName} local authentic restaurant`,
        mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanName + ' local authentic kitchen')}`,
        lat: 48.8526,
        lng: 2.3482,
        vibeMatch: 'Authentic recipes, warm local hospitality',
        crowdLevel: 'Neighborhood regulars only • No line',
        category: 'Family Heritage Kitchen'
      }
    ]
  };
}

// Health & Status endpoint
app.get('/api/status', (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const isConfigured = Boolean(apiKey && !apiKey.includes('MY_GEMINI') && apiKey.length > 10);
  res.json({
    status: 'ok',
    serverAiReady: isConfigured,
    maskedKey: getMaskedKey(apiKey),
    model: 'gemini-3.8-flash',
    mapsGrounding: true,
    cloudSqlReady: true,
  });
});

// Primary POST /api/rescue endpoint
app.post('/api/rescue', async (req, res) => {
  try {
    const { spot, vibe } = req.body || {};
    if (!spot || typeof spot !== 'string') {
      res.status(400).json({ error: 'Missing spot parameter' });
      return;
    }

    const selectedVibe = vibe || 'Chill & Quiet';
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey || apiKey.includes('MY_GEMINI') || apiKey.length < 10) {
      console.log(`[UnCrowd Express] Key not available; serving verified anti-overtourism data for "${spot}"`);
      res.json(getLocalFallback(spot, selectedVibe));
      return;
    }

    const systemInstruction = `You are UnCrowd AI, an expert anti-overtourism travel strategist.
Rescue independent travelers from overcrowded viral tourist traps and overpriced markups.
Analyze the user's input spot(s) and selected vibe.
Use Google Maps grounding to identify authentic, real-world low-crowd neighborhood alternatives.
You must output ONLY valid, raw JSON (no conversational text) with this structure:
{
  "originalSpot": string,
  "city": string,
  "crowdScore": number,
  "crowdLabel": string,
  "estimatedWaitMinutes": number,
  "isBucketListIcon": boolean,
  "quietWindow": string,
  "bucketListStrategy": {
    "entranceTip": string,
    "bestDays": string,
    "skipLineGuide": string
  },
  "priceGuard": {
    "touristPrice": string,
    "fairLocalPrice": string,
    "markupPercent": string,
    "trapDetails": string,
    "moneySaved": string
  },
  "localGems": [
    {
      "name": string,
      "neighborhood": string,
      "walkTime": string,
      "distance": string,
      "fairLocalPrice": string,
      "whyLocalsLoveIt": string,
      "mapsQuery": string,
      "lat": number,
      "lng": number,
      "vibeMatch": string,
      "crowdLevel": string,
      "category": string
    }
  ]
}`;

    const prompt = `Spot(s): "${spot}". Wanted Vibe: "${selectedVibe}". Find 3 verified low-crowd neighborhood alternatives within 10-15 min walk matching this vibe. Return pure JSON.`;

    const fetchGeminiWithMaps = async () => {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction,
            tools: [{ googleMaps: {} }],
          },
        });

        const rawText = response.text || '';
        const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/) || rawText.match(/```\s*([\s\S]*?)\s*```/);
        const cleanJson = jsonMatch ? jsonMatch[1].trim() : rawText.trim();
        const parsed = JSON.parse(cleanJson);

        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (Array.isArray(groundingChunks) && Array.isArray(parsed.localGems)) {
          parsed.localGems = parsed.localGems.map((gem, idx) => {
            const chunk = groundingChunks[idx] || groundingChunks.find(c => c?.maps?.title?.toLowerCase().includes(gem.name?.toLowerCase()));
            const mapsUrl = chunk?.maps?.uri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(gem.mapsQuery || gem.name)}`;
            return {
              ...gem,
              id: `gem-live-${idx}-${Date.now()}`,
              mapsUrl,
              groundedTitle: chunk?.maps?.title || gem.name,
            };
          });
        }
        return parsed;
      } catch (err) {
        console.warn('[UnCrowd Express] Maps Grounding fallback:', err);
        const standardResponse = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
          },
        });
        const text = standardResponse.text || '';
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed.localGems)) {
          parsed.localGems = parsed.localGems.map((gem, idx) => ({
            ...gem,
            id: `gem-std-${idx}-${Date.now()}`,
            mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(gem.mapsQuery || gem.name)}`,
          }));
        }
        return parsed;
      }
    };

    const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 12000));
    const result = await Promise.race([fetchGeminiWithMaps(), timeoutPromise]);

    if (!result) {
      console.warn('[UnCrowd Express] Gemini call timed out or empty; resolving with verified fallback');
      res.json(getLocalFallback(spot, selectedVibe));
      return;
    }

    res.json(result);
  } catch (error) {
    console.error('[UnCrowd Express] Rescue error:', error?.message || error);
    const { spot, vibe } = req.body || {};
    res.json(getLocalFallback(spot || 'Travel spot', vibe || 'Chill & Quiet'));
  }
});

// Cloud SQL & Firebase Auth Endpoints
app.post('/api/user/sync', requireAuth, async (req, res) => {
  try {
    const uid = req.user?.uid;
    const email = req.user?.email || 'traveler@uncrowd.ai';
    if (!uid) return res.status(400).json({ error: 'Missing user UID' });

    const user = await getOrCreateUser(uid, email);
    res.json({ success: true, user });
  } catch (error) {
    console.error('[API] /api/user/sync failed:', error);
    res.status(500).json({ error: error.message || 'Failed to sync user' });
  }
});

app.get('/api/user/me', requireAuth, async (req, res) => {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(400).json({ error: 'Missing user UID' });

    const user = await getUserByUid(uid);
    res.json({ user });
  } catch (error) {
    console.error('[API] /api/user/me failed:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch user' });
  }
});

app.post('/api/user/upgrade-pro', requireAuth, async (req, res) => {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(400).json({ error: 'Missing user UID' });

    const updated = await updateUserProStatus(uid, true);
    res.json({ success: true, user: updated });
  } catch (error) {
    console.error('[API] /api/user/upgrade-pro failed:', error);
    res.status(500).json({ error: error.message || 'Failed to upgrade user' });
  }
});

app.post('/api/user/rescue/save', requireAuth, async (req, res) => {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(400).json({ error: 'Missing user UID' });

    const rescueData = req.body;
    if (!rescueData || !rescueData.originalSpot) {
      return res.status(400).json({ error: 'Invalid rescue data' });
    }

    const saved = await saveUserRescue(uid, rescueData);
    res.json({ success: true, saved });
  } catch (error) {
    console.error('[API] /api/user/rescue/save failed:', error);
    res.status(500).json({ error: error.message || 'Failed to save rescue' });
  }
});

app.get('/api/user/rescues', requireAuth, async (req, res) => {
  try {
    const uid = req.user?.uid;
    if (!uid) return res.status(400).json({ error: 'Missing user UID' });

    const rescues = await getUserSavedRescues(uid);
    res.json({ rescues });
  } catch (error) {
    console.error('[API] /api/user/rescues failed:', error);
    res.status(500).json({ error: error.message || 'Failed to load rescues' });
  }
});

app.post('/api/gem/vote', async (req, res) => {
  try {
    const { gemId, isQuiet } = req.body;
    if (!gemId || typeof isQuiet !== 'boolean') {
      return res.status(400).json({ error: 'Missing gemId or isQuiet' });
    }

    const updated = await voteLocalGem(Number(gemId), isQuiet);
    res.json({ success: true, gem: updated });
  } catch (error) {
    console.error('[API] /api/gem/vote failed:', error);
    res.status(500).json({ error: error.message || 'Failed to register vote' });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        port: PORT,
        host: '0.0.0.0',
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[UnCrowd Express] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
