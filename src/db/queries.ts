import { eq, desc } from 'drizzle-orm';
import { db } from './index.ts';
import { users, savedRescues, localGems } from './schema.ts';

// Get or create user record by Firebase UID
export async function getOrCreateUser(uid: string, email: string) {
  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        email,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database getOrCreateUser failed:', error);
    throw new Error('Database operation failed. Unable to sync user profile.', { cause: error });
  }
}

// Update user Pro Trip Pass status
export async function updateUserProStatus(uid: string, isPro: boolean = true) {
  try {
    const result = await db
      .update(users)
      .set({ isPro })
      .where(eq(users.uid, uid))
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database updateUserProStatus failed:', error);
    throw new Error('Database operation failed. Unable to update pro status.', { cause: error });
  }
}

// Get user profile by UID
export async function getUserByUid(uid: string) {
  try {
    const found = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    return found[0] || null;
  } catch (error) {
    console.error('Database getUserByUid failed:', error);
    throw new Error('Database operation failed. Unable to retrieve user.', { cause: error });
  }
}

// Save a completed rescue and its 3 local gems into Cloud SQL
export async function saveUserRescue(uid: string, rescueData: {
  originalSpot: string;
  city?: string;
  crowdScore: number | string;
  quietWindow?: string;
  touristPrice?: string;
  fairLocalPrice?: string;
  moneySaved?: string;
  vibe?: string;
  localGems?: Array<{
    name: string;
    neighborhood?: string;
    walkTime?: string;
    fairLocalPrice?: string;
    fairPrice?: string;
    whyLocalsLoveIt?: string;
    mapsQuery?: string;
    mapsUrl?: string;
  }>;
}) {
  try {
    // 1. Ensure user exists
    const userRecord = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    let userId: number;
    if (userRecord.length > 0) {
      userId = userRecord[0].id;
    } else {
      const created = await getOrCreateUser(uid, 'traveler@uncrowd.ai');
      userId = created.id;
    }

    // 2. Insert saved rescue
    const [rescueRow] = await db
      .insert(savedRescues)
      .values({
        userId,
        originalSpot: rescueData.originalSpot,
        city: rescueData.city || 'Global Destination',
        crowdScore: String(rescueData.crowdScore || '9.0'),
        quietWindow: rescueData.quietWindow || 'Early morning sunrise',
        touristPrice: rescueData.touristPrice || '',
        fairLocalPrice: rescueData.fairLocalPrice || '',
        moneySaved: rescueData.moneySaved || '',
        vibe: rescueData.vibe || 'Chill & Quiet',
      })
      .returning();

    // 3. Insert local gems
    if (rescueData.localGems && Array.isArray(rescueData.localGems)) {
      for (const gem of rescueData.localGems) {
        await db.insert(localGems).values({
          rescueId: rescueRow.id,
          name: gem.name,
          neighborhood: gem.neighborhood || '',
          walkTime: gem.walkTime || '8 mins walk',
          fairPrice: gem.fairPrice || gem.fairLocalPrice || 'Local Price',
          whyLocalsLoveIt: gem.whyLocalsLoveIt || '',
          mapsQuery: gem.mapsQuery || gem.name,
          mapsUrl: gem.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(gem.mapsQuery || gem.name)}`,
        });
      }
    }

    return rescueRow;
  } catch (error) {
    console.error('Database saveUserRescue failed:', error);
    throw new Error('Database operation failed. Unable to save rescue record.', { cause: error });
  }
}

// Fetch all saved rescues with their local gems for a user
export async function getUserSavedRescues(uid: string) {
  try {
    const user = await getUserByUid(uid);
    if (!user) return [];

    const rescues = await db
      .select()
      .from(savedRescues)
      .where(eq(savedRescues.userId, user.id))
      .orderBy(desc(savedRescues.createdAt));

    const rescuesWithGems = [];
    for (const r of rescues) {
      const gems = await db
        .select()
        .from(localGems)
        .where(eq(localGems.rescueId, r.id));
      rescuesWithGems.push({
        ...r,
        localGems: gems,
      });
    }

    return rescuesWithGems;
  } catch (error) {
    console.error('Database getUserSavedRescues failed:', error);
    throw new Error('Database operation failed. Unable to retrieve saved rescues.', { cause: error });
  }
}

// Vote on a local gem (Was this quiet? Yes / Still Busy)
export async function voteLocalGem(gemId: number, isQuiet: boolean) {
  try {
    const gem = await db.select().from(localGems).where(eq(localGems.id, gemId)).limit(1);
    if (!gem.length) {
      throw new Error(`Gem with id ${gemId} not found`);
    }

    const currentQuiet = gem[0].quietVotes || 0;
    const currentBusy = gem[0].busyVotes || 0;

    const [updated] = await db
      .update(localGems)
      .set(isQuiet ? { quietVotes: currentQuiet + 1 } : { busyVotes: currentBusy + 1 })
      .where(eq(localGems.id, gemId))
      .returning();

    return updated;
  } catch (error) {
    console.error('Database voteLocalGem failed:', error);
    throw new Error('Database operation failed. Unable to register vote.', { cause: error });
  }
}
