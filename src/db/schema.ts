import { relations } from 'drizzle-orm';
import { boolean, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Users table linked to Firebase Auth UID
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  isPro: boolean('is_pro').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Saved Wishlist Audits and Street Rescues
export const savedRescues = pgTable('saved_rescues', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  originalSpot: text('original_spot').notNull(),
  city: text('city'),
  crowdScore: text('crowd_score').notNull(),
  quietWindow: text('quiet_window'),
  touristPrice: text('tourist_price'),
  fairLocalPrice: text('fair_local_price'),
  moneySaved: text('money_saved'),
  vibe: text('vibe'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Discovered Local Gems with Maps Grounding
export const localGems = pgTable('local_gems', {
  id: serial('id').primaryKey(),
  rescueId: integer('rescue_id').references(() => savedRescues.id),
  name: text('name').notNull(),
  neighborhood: text('neighborhood'),
  walkTime: text('walk_time'),
  fairPrice: text('fair_price'),
  whyLocalsLoveIt: text('why_locals_love_it'),
  mapsQuery: text('maps_query'),
  mapsUrl: text('maps_url'),
  quietVotes: integer('quiet_votes').default(0),
  busyVotes: integer('busy_votes').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relationships
export const usersRelations = relations(users, ({ many }) => ({
  rescues: many(savedRescues),
}));

export const savedRescuesRelations = relations(savedRescues, ({ one, many }) => ({
  user: one(users, {
    fields: [savedRescues.userId],
    references: [users.id],
  }),
  gems: many(localGems),
}));

export const localGemsRelations = relations(localGems, ({ one }) => ({
  rescue: one(savedRescues, {
    fields: [localGems.rescueId],
    references: [savedRescues.id],
  }),
}));
