import { pgTable, serial, varchar, text, decimal, timestamp, integer, boolean, jsonb, unique, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  upiId: varchar('upi_id', { length: 100 }),
  totalSavings: decimal('total_savings', { precision: 10, scale: 2 }).default('0.00'),
  todayRoundUp: decimal('today_round_up', { precision: 10, scale: 2 }).default('0.00'),
  currentStreak: integer('current_streak').default(0),
  memberSince: timestamp('member_since').defaultNow(),
  profilePicture: text('profile_picture'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Transactions table
export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(), // 'payment', 'round-up', 'auto-save', 'challenge'
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  originalAmount: decimal('original_amount', { precision: 10, scale: 2 }),
  roundUpAmount: decimal('round_up_amount', { precision: 10, scale: 2 }),
  payee: varchar('payee', { length: 255 }),
  upiId: varchar('upi_id', { length: 100 }),
  note: text('note'),
  status: varchar('status', { length: 20 }).default('completed'), // 'pending', 'completed', 'failed'
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  userIdIdx: index('transactions_user_id_idx').on(table.userId),
  statusIdx: index('transactions_status_idx').on(table.status),
  createdAtIdx: index('transactions_created_at_idx').on(table.createdAt)
}));

// Savings goals/challenges table
export const challenges = pgTable('challenges', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  targetAmount: decimal('target_amount', { precision: 10, scale: 2 }).notNull(),
  currentAmount: decimal('current_amount', { precision: 10, scale: 2 }).default('0.00'),
  deadline: timestamp('deadline'),
  status: varchar('status', { length: 20 }).default('active'), // 'active', 'completed', 'paused'
  category: varchar('category', { length: 100 }), // 'vacation', 'emergency', 'gadget', etc.
  isTemplate: boolean('is_template').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  completedAt: timestamp('completed_at')
}, (table) => ({
  userIdIdx: index('challenges_user_id_idx').on(table.userId),
  statusIdx: index('challenges_status_idx').on(table.status)
}));

// User badges/achievements table
export const userBadges = pgTable('user_badges', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  badgeId: varchar('badge_id', { length: 100 }).notNull(),
  badgeName: varchar('badge_name', { length: 255 }).notNull(),
  badgeIcon: varchar('badge_icon', { length: 100 }),
  badgeColor: varchar('badge_color', { length: 50 }),
  earned: boolean('earned').default(false),
  earnedAt: timestamp('earned_at')
}, (table) => ({
  userBadgeUnique: unique('user_badge_unique').on(table.userId, table.badgeId),
  userIdIdx: index('user_badges_user_id_idx').on(table.userId)
}));

// Activity feed table
export const activities = pgTable('activities', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }),
  description: text('description'),
  icon: varchar('icon', { length: 100 }),
  metadata: jsonb('metadata'), // For additional flexible data
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  userIdIdx: index('activities_user_id_idx').on(table.userId),
  createdAtIdx: index('activities_created_at_idx').on(table.createdAt)
}));

// Investment portfolios table
export const portfolios = pgTable('portfolios', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'mutual_fund', 'etf', 'sip', 'goal_based'
  totalInvested: decimal('total_invested', { precision: 15, scale: 2 }).default('0.00'),
  currentValue: decimal('current_value', { precision: 15, scale: 2 }).default('0.00'),
  returns: decimal('returns', { precision: 15, scale: 2 }).default('0.00'),
  returnsPercentage: decimal('returns_percentage', { precision: 5, scale: 2 }).default('0.00'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  userIdIdx: index('portfolios_user_id_idx').on(table.userId),
  typeIdx: index('portfolios_type_idx').on(table.type)
}));

// SIP plans table
export const sipPlans = pgTable('sip_plans', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  portfolioId: integer('portfolio_id').notNull().references(() => portfolios.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  monthlyAmount: decimal('monthly_amount', { precision: 10, scale: 2 }).notNull(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  nextPaymentDate: timestamp('next_payment_date').notNull(),
  isActive: boolean('is_active').default(true),
  autoInvestRoundups: boolean('auto_invest_roundups').default(false),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  userIdIdx: index('sip_plans_user_id_idx').on(table.userId),
  portfolioIdIdx: index('sip_plans_portfolio_id_idx').on(table.portfolioId),
  nextPaymentDateIdx: index('sip_plans_next_payment_date_idx').on(table.nextPaymentDate)
}));

// Investment transactions table
export const investments = pgTable('investments', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  portfolioId: integer('portfolio_id').notNull().references(() => portfolios.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(), // 'buy', 'sell', 'sip', 'roundup'
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  units: decimal('units', { precision: 15, scale: 8 }),
  pricePerUnit: decimal('price_per_unit', { precision: 10, scale: 4 }),
  transactionDate: timestamp('transaction_date').defaultNow(),
  status: varchar('status', { length: 20 }).default('completed'),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  userIdIdx: index('investments_user_id_idx').on(table.userId),
  portfolioIdIdx: index('investments_portfolio_id_idx').on(table.portfolioId),
  transactionDateIdx: index('investments_transaction_date_idx').on(table.transactionDate)
}));

// Goal-based investments table
export const investmentGoals = pgTable('investment_goals', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  portfolioId: integer('portfolio_id').references(() => portfolios.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  targetAmount: decimal('target_amount', { precision: 15, scale: 2 }).notNull(),
  currentAmount: decimal('current_amount', { precision: 15, scale: 2 }).default('0.00'),
  targetDate: timestamp('target_date'),
  category: varchar('category', { length: 100 }), // 'vacation', 'emergency', 'gadget', 'car', 'house'
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  completedAt: timestamp('completed_at')
}, (table) => ({
  userIdIdx: index('investment_goals_user_id_idx').on(table.userId),
  portfolioIdIdx: index('investment_goals_portfolio_id_idx').on(table.portfolioId),
  categoryIdx: index('investment_goals_category_idx').on(table.category)
}));

// Enhanced streak tracking
export const streaks = pgTable('streaks', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(), // 'savings', 'investment', 'challenge'
  currentStreak: integer('current_streak').default(0),
  longestStreak: integer('longest_streak').default(0),
  lastActivityDate: timestamp('last_activity_date'),
  streakMultiplier: decimal('streak_multiplier', { precision: 3, scale: 2 }).default('1.00'),
  totalRewardsEarned: decimal('total_rewards_earned', { precision: 10, scale: 2 }).default('0.00'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  userTypeUnique: unique('streaks_user_type_unique').on(table.userId, table.type),
  userIdIdx: index('streaks_user_id_idx').on(table.userId),
  typeIdx: index('streaks_type_idx').on(table.type),
  lastActivityDateIdx: index('streaks_last_activity_date_idx').on(table.lastActivityDate)
}));

// Seasonal and custom challenges
export const seasonalChallenges = pgTable('seasonal_challenges', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }).notNull(), // 'seasonal', 'custom', 'team'
  targetAmount: decimal('target_amount', { precision: 10, scale: 2 }),
  targetCount: integer('target_count'), // For activity-based challenges
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  rewardPoints: integer('reward_points').default(0),
  rewardBadges: jsonb('reward_badges'),
  participantLimit: integer('participant_limit'),
  isActive: boolean('is_active').default(true),
  createdBy: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  typeIdx: index('seasonal_challenges_type_idx').on(table.type),
  startDateIdx: index('seasonal_challenges_start_date_idx').on(table.startDate),
  createdByIdx: index('seasonal_challenges_created_by_idx').on(table.createdBy)
}));

// User participation in challenges
export const challengeParticipants = pgTable('challenge_participants', {
  id: serial('id').primaryKey(),
  challengeId: integer('challenge_id').notNull().references(() => seasonalChallenges.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  currentProgress: decimal('current_progress', { precision: 10, scale: 2 }).default('0.00'),
  isCompleted: boolean('is_completed').default(false),
  completedAt: timestamp('completed_at'),
  rank: integer('rank'),
  joinedAt: timestamp('joined_at').defaultNow()
}, (table) => ({
  challengeUserUnique: unique('challenge_user_unique').on(table.challengeId, table.userId),
  challengeIdIdx: index('challenge_participants_challenge_id_idx').on(table.challengeId),
  userIdIdx: index('challenge_participants_user_id_idx').on(table.userId)
}));

// Team battles
export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }).notNull(), // 'college', 'friends', 'community'
  captainId: integer('captain_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  totalSavings: decimal('total_savings', { precision: 15, scale: 2 }).default('0.00'),
  memberCount: integer('member_count').default(1),
  maxMembers: integer('max_members').default(50),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  captainIdIdx: index('teams_captain_id_idx').on(table.captainId),
  typeIdx: index('teams_type_idx').on(table.type)
}));

// Team memberships
export const teamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 50 }).default('member'), // 'captain', 'member'
  joinedAt: timestamp('joined_at').defaultNow(),
  contributedAmount: decimal('contributed_amount', { precision: 10, scale: 2 }).default('0.00')
}, (table) => ({
  teamUserUnique: unique('team_user_unique').on(table.teamId, table.userId),
  teamIdIdx: index('team_members_team_id_idx').on(table.teamId),
  userIdIdx: index('team_members_user_id_idx').on(table.userId)
}));

// Achievement trees
export const achievementTrees = pgTable('achievement_trees', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }), // 'savings', 'investment', 'social', 'education'
  level: integer('level').notNull(), // Tree level (1, 2, 3...)
  prerequisiteIds: jsonb('prerequisite_ids'), // Array of required achievement IDs
  rewardPoints: integer('reward_points').default(0),
  rewardCoins: integer('reward_coins').default(0),
  unlocksFeatures: jsonb('unlocks_features'), // Array of feature names
  icon: varchar('icon', { length: 100 }),
  color: varchar('color', { length: 50 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  categoryIdx: index('achievement_trees_category_idx').on(table.category),
  levelIdx: index('achievement_trees_level_idx').on(table.level)
}));

// User achievement progress
export const userAchievements = pgTable('user_achievements', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  achievementId: integer('achievement_id').notNull().references(() => achievementTrees.id, { onDelete: 'cascade' }),
  progress: decimal('progress', { precision: 5, scale: 2 }).default('0.00'), // Percentage
  isUnlocked: boolean('is_unlocked').default(false),
  unlockedAt: timestamp('unlocked_at'),
  isCompleted: boolean('is_completed').default(false),
  completedAt: timestamp('completed_at')
}, (table) => ({
  userAchievementUnique: unique('user_achievement_unique').on(table.userId, table.achievementId),
  userIdIdx: index('user_achievements_user_id_idx').on(table.userId),
  achievementIdIdx: index('user_achievements_achievement_id_idx').on(table.achievementId)
}));

// Reward store
export const rewardStore = pgTable('reward_store', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }).notNull(), // 'cashback', 'discount', 'voucher', 'physical'
  pointsCost: integer('points_cost').notNull(),
  coinsCost: integer('coins_cost').default(0),
  value: decimal('value', { precision: 10, scale: 2 }), // Actual value in rupees
  category: varchar('category', { length: 100 }), // 'shopping', 'food', 'entertainment', 'travel'
  vendor: varchar('vendor', { length: 255 }),
  validityDays: integer('validity_days').default(30),
  stockQuantity: integer('stock_quantity'),
  isActive: boolean('is_active').default(true),
  imageUrl: text('image_url'),
  termsConditions: text('terms_conditions'),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  typeIdx: index('reward_store_type_idx').on(table.type),
  categoryIdx: index('reward_store_category_idx').on(table.category),
  isActiveIdx: index('reward_store_is_active_idx').on(table.isActive)
}));

// User reward redemptions
export const userRewards = pgTable('user_rewards', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  rewardId: integer('reward_id').notNull().references(() => rewardStore.id, { onDelete: 'restrict' }),
  pointsSpent: integer('points_spent').notNull(),
  coinsSpent: integer('coins_spent').default(0),
  status: varchar('status', { length: 20 }).default('active'), // 'active', 'used', 'expired'
  redemptionCode: varchar('redemption_code', { length: 100 }).unique(),
  expiresAt: timestamp('expires_at'),
  usedAt: timestamp('used_at'),
  redeemedAt: timestamp('redeemed_at').defaultNow()
}, (table) => ({
  userIdIdx: index('user_rewards_user_id_idx').on(table.userId),
  rewardIdIdx: index('user_rewards_reward_id_idx').on(table.rewardId),
  statusIdx: index('user_rewards_status_idx').on(table.status),
  expiresAtIdx: index('user_rewards_expires_at_idx').on(table.expiresAt)
}));

// Budget settings
export const budgets = pgTable('budgets', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  category: varchar('category', { length: 100 }).notNull(),
  monthlyLimit: decimal('monthly_limit', { precision: 10, scale: 2 }).notNull(),
  currentSpent: decimal('current_spent', { precision: 10, scale: 2 }).default('0.00'),
  alertThreshold: decimal('alert_threshold', { precision: 3, scale: 2 }).default('0.80'), // 80%
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
}, (table) => ({
  userIdIdx: index('budgets_user_id_idx').on(table.userId),
  categoryIdx: index('budgets_category_idx').on(table.category),
  isActiveIdx: index('budgets_is_active_idx').on(table.isActive)
}));

// Financial health scores
export const financialHealth = pgTable('financial_health', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  overallScore: integer('overall_score').notNull(), // 0-100
  savingsScore: integer('savings_score').notNull(),
  spendingScore: integer('spending_score').notNull(),
  investmentScore: integer('investment_score').notNull(),
  budgetScore: integer('budget_score').notNull(),
  streakScore: integer('streak_score').notNull(),
  calculatedAt: timestamp('calculated_at').defaultNow(),
  recommendations: jsonb('recommendations'), // Array of improvement suggestions
  trends: jsonb('trends') // Score trends over time
}, (table) => ({
  userIdIdx: index('financial_health_user_id_idx').on(table.userId),
  overallScoreIdx: index('financial_health_overall_score_idx').on(table.overallScore),
  calculatedAtIdx: index('financial_health_calculated_at_idx').on(table.calculatedAt)
}));

// Group savings goals
export const groupGoals = pgTable('group_goals', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  targetAmount: decimal('target_amount', { precision: 15, scale: 2 }).notNull(),
  currentAmount: decimal('current_amount', { precision: 15, scale: 2 }).default('0.00'),
  targetDate: timestamp('target_date'),
  category: varchar('category', { length: 100 }),
  createdBy: integer('created_by').notNull().references(() => users.id, { onDelete: 'restrict' }),
  isActive: boolean('is_active').default(true),
  isPublic: boolean('is_public').default(false),
  memberLimit: integer('member_limit').default(10),
  createdAt: timestamp('created_at').defaultNow(),
  completedAt: timestamp('completed_at')
}, (table) => ({
  createdByIdx: index('group_goals_created_by_idx').on(table.createdBy),
  categoryIdx: index('group_goals_category_idx').on(table.category)
}));

// Group goal participants
export const groupGoalMembers = pgTable('group_goal_members', {
  id: serial('id').primaryKey(),
  goalId: integer('goal_id').notNull().references(() => groupGoals.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  contributedAmount: decimal('contributed_amount', { precision: 10, scale: 2 }).default('0.00'),
  targetContribution: decimal('target_contribution', { precision: 10, scale: 2 }),
  joinedAt: timestamp('joined_at').defaultNow()
}, (table) => ({
  goalUserUnique: unique('goal_user_unique').on(table.goalId, table.userId),
  goalIdIdx: index('group_goal_members_goal_id_idx').on(table.goalId),
  userIdIdx: index('group_goal_members_user_id_idx').on(table.userId)
}));

// Savings stories/posts
export const savingsStories = pgTable('savings_stories', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }),
  content: text('content').notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }),
  type: varchar('type', { length: 50 }).notNull(), // 'milestone', 'achievement', 'tip', 'challenge_win'
  imageUrl: text('image_url'),
  isPublic: boolean('is_public').default(true),
  likes: integer('likes').default(0),
  comments: integer('comments').default(0),
  shares: integer('shares').default(0),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  userIdIdx: index('savings_stories_user_id_idx').on(table.userId),
  typeIdx: index('savings_stories_type_idx').on(table.type),
  createdAtIdx: index('savings_stories_created_at_idx').on(table.createdAt)
}));

// Story interactions
export const storyInteractions = pgTable('story_interactions', {
  id: serial('id').primaryKey(),
  storyId: integer('story_id').notNull().references(() => savingsStories.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 20 }).notNull(), // 'like', 'comment', 'share'
  comment: text('comment'), // If type is 'comment'
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  storyUserTypeUnique: unique('story_user_type_unique').on(table.storyId, table.userId, table.type),
  storyIdIdx: index('story_interactions_story_id_idx').on(table.storyId),
  userIdIdx: index('story_interactions_user_id_idx').on(table.userId)
}));

// Mentor system
export const mentorships = pgTable('mentorships', {
  id: serial('id').primaryKey(),
  mentorId: integer('mentor_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  menteeId: integer('mentee_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 20 }).default('active'), // 'active', 'completed', 'paused'
  specialization: varchar('specialization', { length: 100 }), // 'investments', 'budgeting', 'savings'
  startedAt: timestamp('started_at').defaultNow(),
  endedAt: timestamp('ended_at')
}, (table) => ({
  mentorMenteeUnique: unique('mentor_mentee_unique').on(table.mentorId, table.menteeId),
  mentorIdIdx: index('mentorships_mentor_id_idx').on(table.mentorId),
  menteeIdIdx: index('mentorships_mentee_id_idx').on(table.menteeId)
}));

// Communities
export const communities = pgTable('communities', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }).notNull(), // 'travel', 'tech', 'students', 'professionals'
  createdBy: integer('created_by').notNull().references(() => users.id, { onDelete: 'restrict' }),
  memberCount: integer('member_count').default(1),
  isPublic: boolean('is_public').default(true),
  imageUrl: text('image_url'),
  rules: text('rules'),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  createdByIdx: index('communities_created_by_idx').on(table.createdBy),
  categoryIdx: index('communities_category_idx').on(table.category)
}));

// Community memberships
export const communityMembers = pgTable('community_members', {
  id: serial('id').primaryKey(),
  communityId: integer('community_id').notNull().references(() => communities.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 50 }).default('member'), // 'admin', 'moderator', 'member'
  joinedAt: timestamp('joined_at').defaultNow()
}, (table) => ({
  communityUserUnique: unique('community_user_unique').on(table.communityId, table.userId),
  communityIdIdx: index('community_members_community_id_idx').on(table.communityId),
  userIdIdx: index('community_members_user_id_idx').on(table.userId)
}));

// Connected bank accounts
export const bankAccounts = pgTable('bank_accounts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  bankName: varchar('bank_name', { length: 255 }).notNull(),
  accountType: varchar('account_type', { length: 50 }).notNull(), // 'savings', 'checking', 'credit'
  accountNumber: varchar('account_number', { length: 100 }), // Encrypted
  balance: decimal('balance', { precision: 15, scale: 2 }),
  isActive: boolean('is_active').default(true),
  isPrimary: boolean('is_primary').default(false),
  lastSyncAt: timestamp('last_sync_at'),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  userIdIdx: index('bank_accounts_user_id_idx').on(table.userId),
  accountTypeIdx: index('bank_accounts_account_type_idx').on(table.accountType)
}));

// Bill splitting
export const billSplits = pgTable('bill_splits', {
  id: serial('id').primaryKey(),
  createdBy: integer('created_by').notNull().references(() => users.id, { onDelete: 'restrict' }),
  title: varchar('title', { length: 255 }).notNull(),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }).default('equal'), // 'equal', 'custom', 'percentage'
  status: varchar('status', { length: 20 }).default('pending'), // 'pending', 'completed', 'cancelled'
  dueDate: timestamp('due_date'),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  createdByIdx: index('bill_splits_created_by_idx').on(table.createdBy),
  statusIdx: index('bill_splits_status_idx').on(table.status)
}));

// Bill split participants
export const billSplitMembers = pgTable('bill_split_members', {
  id: serial('id').primaryKey(),
  billId: integer('bill_id').notNull().references(() => billSplits.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  owedAmount: decimal('owed_amount', { precision: 10, scale: 2 }).notNull(),
  paidAmount: decimal('paid_amount', { precision: 10, scale: 2 }).default('0.00'),
  status: varchar('status', { length: 20 }).default('pending'), // 'pending', 'paid', 'cancelled'
  paidAt: timestamp('paid_at')
}, (table) => ({
  billUserUnique: unique('bill_user_unique').on(table.billId, table.userId),
  billIdIdx: index('bill_split_members_bill_id_idx').on(table.billId),
  userIdIdx: index('bill_split_members_user_id_idx').on(table.userId)
}));

// Scheduled payments
export const scheduledPayments = pgTable('scheduled_payments', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  recipientUpi: varchar('recipient_upi', { length: 100 }).notNull(),
  frequency: varchar('frequency', { length: 20 }).notNull(), // 'weekly', 'monthly', 'quarterly'
  nextPaymentDate: timestamp('next_payment_date').notNull(),
  endDate: timestamp('end_date'),
  isActive: boolean('is_active').default(true),
  autoExecute: boolean('auto_execute').default(false),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  userIdIdx: index('scheduled_payments_user_id_idx').on(table.userId),
  nextPaymentDateIdx: index('scheduled_payments_next_payment_date_idx').on(table.nextPaymentDate)
}));

// Financial literacy modules
export const educationModules = pgTable('education_modules', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }).notNull(), // 'investing', 'budgeting', 'savings', 'insurance'
  level: varchar('level', { length: 20 }).notNull(), // 'beginner', 'intermediate', 'advanced'
  content: text('content').notNull(),
  videoUrl: text('video_url'),
  duration: integer('duration'), // in minutes
  prerequisiteIds: jsonb('prerequisite_ids'),
  rewardPoints: integer('reward_points').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow()
}, (table) => ({
  categoryIdx: index('education_modules_category_idx').on(table.category),
  levelIdx: index('education_modules_level_idx').on(table.level),
  isActiveIdx: index('education_modules_is_active_idx').on(table.isActive)
}));

// User education progress
export const userEducation = pgTable('user_education', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  moduleId: integer('module_id').notNull().references(() => educationModules.id, { onDelete: 'cascade' }),
  progress: decimal('progress', { precision: 5, scale: 2 }).default('0.00'), // Percentage
  isCompleted: boolean('is_completed').default(false),
  completedAt: timestamp('completed_at'),
  lastAccessedAt: timestamp('last_accessed_at').defaultNow(),
  timeSpent: integer('time_spent').default(0) // in minutes
}, (table) => ({
  userModuleUnique: unique('user_module_unique').on(table.userId, table.moduleId),
  userIdIdx: index('user_education_user_id_idx').on(table.userId),
  moduleIdIdx: index('user_education_module_id_idx').on(table.moduleId)
}));

// Quiz questions
export const quizQuestions = pgTable('quiz_questions', {
  id: serial('id').primaryKey(),
  moduleId: integer('module_id').notNull().references(() => educationModules.id, { onDelete: 'cascade' }),
  question: text('question').notNull(),
  options: jsonb('options').notNull(), // Array of answer options
  correctAnswer: integer('correct_answer').notNull(), // Index of correct option
  explanation: text('explanation'),
  difficulty: varchar('difficulty', { length: 20 }).default('medium'),
  isActive: boolean('is_active').default(true)
}, (table) => ({
  moduleIdIdx: index('quiz_questions_module_id_idx').on(table.moduleId),
  difficultyIdx: index('quiz_questions_difficulty_idx').on(table.difficulty)
}));

// User quiz attempts
export const quizAttempts = pgTable('quiz_attempts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  moduleId: integer('module_id').notNull().references(() => educationModules.id, { onDelete: 'cascade' }),
  score: decimal('score', { precision: 5, scale: 2 }).notNull(), // Percentage
  totalQuestions: integer('total_questions').notNull(),
  correctAnswers: integer('correct_answers').notNull(),
  timeSpent: integer('time_spent'), // in seconds
  isPassed: boolean('is_passed').default(false),
  attemptedAt: timestamp('attempted_at').defaultNow()
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  transactions: many(transactions),
  challenges: many(challenges),
  badges: many(userBadges),
  activities: many(activities),
  portfolios: many(portfolios),
  sipPlans: many(sipPlans),
  investments: many(investments),
  investmentGoals: many(investmentGoals),
  streaks: many(streaks),
  challengeParticipants: many(challengeParticipants),
  teamMembers: many(teamMembers),
  userAchievements: many(userAchievements),
  userRewards: many(userRewards),
  budgets: many(budgets),
  financialHealth: many(financialHealth),
  groupGoalMembers: many(groupGoalMembers),
  savingsStories: many(savingsStories),
  storyInteractions: many(storyInteractions),
  mentorshipsAsMentor: many(mentorships, { relationName: "mentor" }),
  mentorshipsAsMentee: many(mentorships, { relationName: "mentee" }),
  communityMembers: many(communityMembers),
  bankAccounts: many(bankAccounts),
  billSplitMembers: many(billSplitMembers),
  scheduledPayments: many(scheduledPayments),
  userEducation: many(userEducation),
  quizAttempts: many(quizAttempts)
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id]
  })
}));

export const challengesRelations = relations(challenges, ({ one }) => ({
  user: one(users, {
    fields: [challenges.userId],
    references: [users.id]
  })
}));

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users, {
    fields: [userBadges.userId],
    references: [users.id]
  })
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  user: one(users, {
    fields: [activities.userId],
    references: [users.id]
  })
}));

export const portfoliosRelations = relations(portfolios, ({ one, many }) => ({
  user: one(users, {
    fields: [portfolios.userId],
    references: [users.id]
  }),
  sipPlans: many(sipPlans),
  investments: many(investments)
}));

export const sipPlansRelations = relations(sipPlans, ({ one }) => ({
  user: one(users, {
    fields: [sipPlans.userId],
    references: [users.id]
  }),
  portfolio: one(portfolios, {
    fields: [sipPlans.portfolioId],
    references: [portfolios.id]
  })
}));

export const investmentsRelations = relations(investments, ({ one }) => ({
  user: one(users, {
    fields: [investments.userId],
    references: [users.id]
  }),
  portfolio: one(portfolios, {
    fields: [investments.portfolioId],
    references: [portfolios.id]
  })
}));

export const investmentGoalsRelations = relations(investmentGoals, ({ one }) => ({
  user: one(users, {
    fields: [investmentGoals.userId],
    references: [users.id]
  }),
  portfolio: one(portfolios, {
    fields: [investmentGoals.portfolioId],
    references: [portfolios.id]
  })
}));

export const streaksRelations = relations(streaks, ({ one }) => ({
  user: one(users, {
    fields: [streaks.userId],
    references: [users.id]
  })
}));

export const seasonalChallengesRelations = relations(seasonalChallenges, ({ one, many }) => ({
  creator: one(users, {
    fields: [seasonalChallenges.createdBy],
    references: [users.id]
  }),
  participants: many(challengeParticipants)
}));

export const challengeParticipantsRelations = relations(challengeParticipants, ({ one }) => ({
  challenge: one(seasonalChallenges, {
    fields: [challengeParticipants.challengeId],
    references: [seasonalChallenges.id]
  }),
  user: one(users, {
    fields: [challengeParticipants.userId],
    references: [users.id]
  })
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  captain: one(users, {
    fields: [teams.captainId],
    references: [users.id]
  }),
  members: many(teamMembers)
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id]
  }),
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id]
  })
}));

export const achievementTreesRelations = relations(achievementTrees, ({ many }) => ({
  userAchievements: many(userAchievements)
}));

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, {
    fields: [userAchievements.userId],
    references: [users.id]
  }),
  achievement: one(achievementTrees, {
    fields: [userAchievements.achievementId],
    references: [achievementTrees.id]
  })
}));

export const rewardStoreRelations = relations(rewardStore, ({ many }) => ({
  userRewards: many(userRewards)
}));

export const userRewardsRelations = relations(userRewards, ({ one }) => ({
  user: one(users, {
    fields: [userRewards.userId],
    references: [users.id]
  }),
  reward: one(rewardStore, {
    fields: [userRewards.rewardId],
    references: [rewardStore.id]
  })
}));

export const budgetsRelations = relations(budgets, ({ one }) => ({
  user: one(users, {
    fields: [budgets.userId],
    references: [users.id]
  })
}));

export const financialHealthRelations = relations(financialHealth, ({ one }) => ({
  user: one(users, {
    fields: [financialHealth.userId],
    references: [users.id]
  })
}));

export const groupGoalsRelations = relations(groupGoals, ({ one, many }) => ({
  creator: one(users, {
    fields: [groupGoals.createdBy],
    references: [users.id]
  }),
  members: many(groupGoalMembers)
}));

export const groupGoalMembersRelations = relations(groupGoalMembers, ({ one }) => ({
  goal: one(groupGoals, {
    fields: [groupGoalMembers.goalId],
    references: [groupGoals.id]
  }),
  user: one(users, {
    fields: [groupGoalMembers.userId],
    references: [users.id]
  })
}));

export const savingsStoriesRelations = relations(savingsStories, ({ one, many }) => ({
  user: one(users, {
    fields: [savingsStories.userId],
    references: [users.id]
  }),
  interactions: many(storyInteractions)
}));

export const storyInteractionsRelations = relations(storyInteractions, ({ one }) => ({
  story: one(savingsStories, {
    fields: [storyInteractions.storyId],
    references: [savingsStories.id]
  }),
  user: one(users, {
    fields: [storyInteractions.userId],
    references: [users.id]
  })
}));

export const mentorshipsRelations = relations(mentorships, ({ one }) => ({
  mentor: one(users, {
    fields: [mentorships.mentorId],
    references: [users.id],
    relationName: "mentor"
  }),
  mentee: one(users, {
    fields: [mentorships.menteeId],
    references: [users.id],
    relationName: "mentee"
  })
}));

export const communitiesRelations = relations(communities, ({ one, many }) => ({
  creator: one(users, {
    fields: [communities.createdBy],
    references: [users.id]
  }),
  members: many(communityMembers)
}));

export const communityMembersRelations = relations(communityMembers, ({ one }) => ({
  community: one(communities, {
    fields: [communityMembers.communityId],
    references: [communities.id]
  }),
  user: one(users, {
    fields: [communityMembers.userId],
    references: [users.id]
  })
}));

export const bankAccountsRelations = relations(bankAccounts, ({ one }) => ({
  user: one(users, {
    fields: [bankAccounts.userId],
    references: [users.id]
  })
}));

export const billSplitsRelations = relations(billSplits, ({ one, many }) => ({
  creator: one(users, {
    fields: [billSplits.createdBy],
    references: [users.id]
  }),
  members: many(billSplitMembers)
}));

export const billSplitMembersRelations = relations(billSplitMembers, ({ one }) => ({
  bill: one(billSplits, {
    fields: [billSplitMembers.billId],
    references: [billSplits.id]
  }),
  user: one(users, {
    fields: [billSplitMembers.userId],
    references: [users.id]
  })
}));

export const scheduledPaymentsRelations = relations(scheduledPayments, ({ one }) => ({
  user: one(users, {
    fields: [scheduledPayments.userId],
    references: [users.id]
  })
}));

export const educationModulesRelations = relations(educationModules, ({ many }) => ({
  userEducation: many(userEducation),
  quizQuestions: many(quizQuestions),
  quizAttempts: many(quizAttempts)
}));

export const userEducationRelations = relations(userEducation, ({ one }) => ({
  user: one(users, {
    fields: [userEducation.userId],
    references: [users.id]
  }),
  module: one(educationModules, {
    fields: [userEducation.moduleId],
    references: [educationModules.id]
  })
}));

export const quizQuestionsRelations = relations(quizQuestions, ({ one }) => ({
  module: one(educationModules, {
    fields: [quizQuestions.moduleId],
    references: [educationModules.id]
  })
}));

export const quizAttemptsRelations = relations(quizAttempts, ({ one }) => ({
  user: one(users, {
    fields: [quizAttempts.userId],
    references: [users.id]
  }),
  module: one(educationModules, {
    fields: [quizAttempts.moduleId],
    references: [educationModules.id]
  })
}));