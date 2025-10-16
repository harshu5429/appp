import { 
  users, transactions, challenges, activities, userBadges,
  portfolios, sipPlans, investments, investmentGoals, streaks,
  seasonalChallenges, challengeParticipants, teams, teamMembers,
  achievementTrees, userAchievements, rewardStore, userRewards,
  budgets, financialHealth, groupGoals, groupGoalMembers,
  savingsStories, storyInteractions, mentorships, communities,
  communityMembers, bankAccounts, billSplits, billSplitMembers,
  scheduledPayments, educationModules, userEducation, quizQuestions,
  quizAttempts
} from '../shared/schema.js';
import bcrypt from 'bcrypt';

// Memory storage implementation (fallback)
export class MemoryStorage {
  constructor() {
    this.users = [];
    this.transactions = [];
    this.challenges = [];
    this.activities = [];
    this.userBadges = [];
    // Investment features
    this.portfolios = [];
    this.sipPlans = [];
    this.investments = [];
    this.investmentGoals = [];
    // Enhanced gamification
    this.streaks = [];
    this.seasonalChallenges = [];
    this.challengeParticipants = [];
    this.teams = [];
    this.teamMembers = [];
    this.achievementTrees = [];
    this.userAchievements = [];
    this.rewardStore = [];
    this.userRewards = [];
    // Financial insights
    this.budgets = [];
    this.financialHealth = [];
    // Social features
    this.groupGoals = [];
    this.groupGoalMembers = [];
    this.savingsStories = [];
    this.storyInteractions = [];
    this.mentorships = [];
    this.communities = [];
    this.communityMembers = [];
    // Banking & payments
    this.bankAccounts = [];
    this.billSplits = [];
    this.billSplitMembers = [];
    this.scheduledPayments = [];
    // Education
    this.educationModules = [];
    this.userEducation = [];
    this.quizQuestions = [];
    this.quizAttempts = [];
    this.nextId = 1;
  }

  async getUser(id) {
    return this.users.find(u => u.id === id);
  }

  async getUserByEmail(email) {
    return this.users.find(u => u.email === email);
  }

  async verifyUserPassword(user, password) {
    return await bcrypt.compare(password, user.passwordHash);
  }

  async createUser(user) {
    if (!user.password) {
      throw new Error('Password is required');
    }
    
    const passwordHash = await bcrypt.hash(user.password, 10);
    const newUser = {
      id: this.nextId++,
      email: user.email,
      username: user.username,
      name: user.name,
      passwordHash,
      upiId: user.upiId || null,
      totalSavings: user.totalSavings || '0.00',
      todayRoundUp: user.todayRoundUp || '0.00',
      currentStreak: user.currentStreak || 0,
      memberSince: new Date(),
      profilePicture: user.profilePicture || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.push(newUser);
    
    // Return user without password hash
    const { passwordHash: _, ...userResponse } = newUser;
    return userResponse;
  }

  async updateUser(id, updates) {
    const userIndex = this.users.findIndex(u => u.id === id);
    if (userIndex === -1) return undefined;
    
    this.users[userIndex] = { 
      ...this.users[userIndex], 
      ...updates, 
      updatedAt: new Date() 
    };
    return this.users[userIndex];
  }

  async createTransaction(transaction) {
    const newTransaction = {
      id: this.nextId++,
      userId: transaction.userId,
      type: transaction.type,
      amount: transaction.amount,
      originalAmount: transaction.originalAmount || null,
      roundUpAmount: transaction.roundUpAmount || null,
      payee: transaction.payee || null,
      upiId: transaction.upiId || null,
      note: transaction.note || null,
      status: transaction.status || 'completed',
      createdAt: new Date()
    };
    this.transactions.push(newTransaction);
    return newTransaction;
  }

  async getUserTransactions(userId, limit = 50) {
    return this.transactions
      .filter(t => t.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getUserChallenges(userId) {
    return this.challenges.filter(c => c.userId === userId);
  }

  async createChallenge(challenge) {
    const newChallenge = {
      id: this.nextId++,
      userId: challenge.userId,
      title: challenge.title,
      description: challenge.description || null,
      targetAmount: challenge.targetAmount,
      currentAmount: challenge.currentAmount || '0.00',
      deadline: challenge.deadline || null,
      status: challenge.status || 'active',
      category: challenge.category || null,
      isTemplate: challenge.isTemplate || false,
      createdAt: new Date(),
      completedAt: challenge.completedAt || null
    };
    this.challenges.push(newChallenge);
    return newChallenge;
  }

  async getChallenge(id) {
    return this.challenges.find(c => c.id === id);
  }

  async updateChallenge(id, updates) {
    const challengeIndex = this.challenges.findIndex(c => c.id === id);
    if (challengeIndex === -1) return undefined;
    
    this.challenges[challengeIndex] = { ...this.challenges[challengeIndex], ...updates };
    return this.challenges[challengeIndex];
  }

  async createActivity(activity) {
    const newActivity = {
      id: this.nextId++,
      userId: activity.userId,
      type: activity.type,
      amount: activity.amount || null,
      description: activity.description || null,
      icon: activity.icon || null,
      metadata: activity.metadata || null,
      createdAt: new Date()
    };
    this.activities.push(newActivity);
    return newActivity;
  }

  async getUserActivities(userId, limit = 20) {
    return this.activities
      .filter(a => a.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getUserBadges(userId) {
    return this.userBadges.filter(b => b.userId === userId);
  }

  async updateUserBadge(userId, badgeId, earned) {
    const badgeIndex = this.userBadges.findIndex(b => b.userId === userId && b.badgeId === badgeId);
    if (badgeIndex !== -1) {
      this.userBadges[badgeIndex].earned = earned;
      this.userBadges[badgeIndex].earnedAt = earned ? new Date() : null;
    }
  }

  // Investment Portfolio Methods
  async createPortfolio(portfolio) {
    const newPortfolio = {
      id: this.nextId++,
      userId: portfolio.userId,
      name: portfolio.name,
      type: portfolio.type,
      totalInvested: portfolio.totalInvested || '0.00',
      currentValue: portfolio.currentValue || '0.00',
      returns: portfolio.returns || '0.00',
      returnsPercentage: portfolio.returnsPercentage || '0.00',
      isActive: portfolio.isActive !== false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.portfolios.push(newPortfolio);
    return newPortfolio;
  }

  async getUserPortfolios(userId) {
    return this.portfolios.filter(p => p.userId === userId && p.isActive);
  }

  async getPortfolio(id) {
    return this.portfolios.find(p => p.id === id);
  }

  async updatePortfolio(id, updates) {
    const portfolioIndex = this.portfolios.findIndex(p => p.id === id);
    if (portfolioIndex === -1) return undefined;
    
    this.portfolios[portfolioIndex] = { 
      ...this.portfolios[portfolioIndex], 
      ...updates, 
      updatedAt: new Date() 
    };
    return this.portfolios[portfolioIndex];
  }

  // SIP Plans Methods
  async createSIPPlan(sipPlan) {
    const newSIP = {
      id: this.nextId++,
      userId: sipPlan.userId,
      portfolioId: sipPlan.portfolioId,
      name: sipPlan.name,
      monthlyAmount: sipPlan.monthlyAmount,
      startDate: sipPlan.startDate,
      endDate: sipPlan.endDate || null,
      nextPaymentDate: sipPlan.nextPaymentDate,
      isActive: sipPlan.isActive !== false,
      autoInvestRoundups: sipPlan.autoInvestRoundups || false,
      createdAt: new Date()
    };
    this.sipPlans.push(newSIP);
    return newSIP;
  }

  async getUserSIPPlans(userId) {
    return this.sipPlans.filter(s => s.userId === userId && s.isActive);
  }

  async getSipPlan(id) {
    return this.sipPlans.find(s => s.id === id);
  }

  async updateSIPPlan(id, updates) {
    const sipIndex = this.sipPlans.findIndex(s => s.id === id);
    if (sipIndex === -1) return undefined;
    
    this.sipPlans[sipIndex] = { ...this.sipPlans[sipIndex], ...updates };
    return this.sipPlans[sipIndex];
  }

  // Investment Transactions Methods
  async createInvestment(investment) {
    const newInvestment = {
      id: this.nextId++,
      userId: investment.userId,
      portfolioId: investment.portfolioId,
      type: investment.type,
      amount: investment.amount,
      units: investment.units || null,
      pricePerUnit: investment.pricePerUnit || null,
      transactionDate: investment.transactionDate || new Date(),
      status: investment.status || 'completed',
      createdAt: new Date()
    };
    this.investments.push(newInvestment);
    return newInvestment;
  }

  async getUserInvestments(userId, limit = 50) {
    return this.investments
      .filter(i => i.userId === userId)
      .sort((a, b) => b.transactionDate.getTime() - a.transactionDate.getTime())
      .slice(0, limit);
  }

  async getPortfolioInvestments(portfolioId) {
    return this.investments.filter(i => i.portfolioId === portfolioId);
  }

  // Investment Goals Methods
  async createInvestmentGoal(goal) {
    const newGoal = {
      id: this.nextId++,
      userId: goal.userId,
      portfolioId: goal.portfolioId || null,
      title: goal.title,
      description: goal.description || null,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount || '0.00',
      targetDate: goal.targetDate || null,
      category: goal.category || null,
      isActive: goal.isActive !== false,
      createdAt: new Date(),
      completedAt: goal.completedAt || null
    };
    this.investmentGoals.push(newGoal);
    return newGoal;
  }

  async getUserInvestmentGoals(userId) {
    return this.investmentGoals.filter(g => g.userId === userId && g.isActive);
  }

  async getInvestmentGoal(id) {
    return this.investmentGoals.find(g => g.id === id);
  }

  async updateInvestmentGoal(id, updates) {
    const goalIndex = this.investmentGoals.findIndex(g => g.id === id);
    if (goalIndex === -1) return undefined;
    
    this.investmentGoals[goalIndex] = { ...this.investmentGoals[goalIndex], ...updates };
    return this.investmentGoals[goalIndex];
  }

  // Enhanced Streak Methods
  async createStreak(streak) {
    const newStreak = {
      id: this.nextId++,
      userId: streak.userId,
      type: streak.type,
      currentStreak: streak.currentStreak || 0,
      longestStreak: streak.longestStreak || 0,
      lastActivityDate: streak.lastActivityDate || null,
      streakMultiplier: streak.streakMultiplier || '1.00',
      totalRewardsEarned: streak.totalRewardsEarned || '0.00',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.streaks.push(newStreak);
    return newStreak;
  }

  async getUserStreaks(userId) {
    return this.streaks.filter(s => s.userId === userId);
  }

  async updateStreak(id, updates) {
    const streakIndex = this.streaks.findIndex(s => s.id === id);
    if (streakIndex === -1) return undefined;
    
    this.streaks[streakIndex] = { 
      ...this.streaks[streakIndex], 
      ...updates, 
      updatedAt: new Date() 
    };
    return this.streaks[streakIndex];
  }

  // Seasonal Challenges Methods
  async createSeasonalChallenge(challenge) {
    const newChallenge = {
      id: this.nextId++,
      title: challenge.title,
      description: challenge.description || null,
      type: challenge.type,
      targetAmount: challenge.targetAmount || null,
      targetCount: challenge.targetCount || null,
      startDate: challenge.startDate,
      endDate: challenge.endDate,
      rewardPoints: challenge.rewardPoints || 0,
      rewardBadges: challenge.rewardBadges || null,
      participantLimit: challenge.participantLimit || null,
      isActive: challenge.isActive !== false,
      createdBy: challenge.createdBy || null,
      createdAt: new Date()
    };
    this.seasonalChallenges.push(newChallenge);
    return newChallenge;
  }

  async getActiveSeasonalChallenges() {
    return this.seasonalChallenges.filter(c => c.isActive);
  }

  async joinSeasonalChallenge(challengeId, userId) {
    const participation = {
      id: this.nextId++,
      challengeId: challengeId,
      userId: userId,
      currentProgress: '0.00',
      isCompleted: false,
      completedAt: null,
      rank: null,
      joinedAt: new Date()
    };
    this.challengeParticipants.push(participation);
    return participation;
  }

  async getUserChallengeParticipations(userId) {
    return this.challengeParticipants.filter(cp => cp.userId === userId);
  }

  // Budget Methods
  async createBudget(budget) {
    const newBudget = {
      id: this.nextId++,
      userId: budget.userId,
      category: budget.category,
      monthlyLimit: budget.monthlyLimit,
      currentSpent: budget.currentSpent || '0.00',
      alertThreshold: budget.alertThreshold || '0.80',
      isActive: budget.isActive !== false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.budgets.push(newBudget);
    return newBudget;
  }

  async getUserBudgets(userId) {
    return this.budgets.filter(b => b.userId === userId && b.isActive);
  }

  async updateBudget(id, updates) {
    const budgetIndex = this.budgets.findIndex(b => b.id === id);
    if (budgetIndex === -1) return undefined;
    
    this.budgets[budgetIndex] = { 
      ...this.budgets[budgetIndex], 
      ...updates, 
      updatedAt: new Date() 
    };
    return this.budgets[budgetIndex];
  }

  // Financial Health Methods
  async createOrUpdateFinancialHealth(userId, scores) {
    const existingIndex = this.financialHealth.findIndex(fh => fh.userId === userId);
    const healthData = {
      id: existingIndex >= 0 ? this.financialHealth[existingIndex].id : this.nextId++,
      userId: userId,
      overallScore: scores.overallScore,
      savingsScore: scores.savingsScore,
      spendingScore: scores.spendingScore,
      investmentScore: scores.investmentScore,
      budgetScore: scores.budgetScore,
      streakScore: scores.streakScore,
      calculatedAt: new Date(),
      recommendations: scores.recommendations || null,
      trends: scores.trends || null
    };
    
    if (existingIndex >= 0) {
      this.financialHealth[existingIndex] = healthData;
    } else {
      this.financialHealth.push(healthData);
    }
    
    return healthData;
  }

  async getUserFinancialHealth(userId) {
    return this.financialHealth.find(fh => fh.userId === userId);
  }

  // Reward Store Methods
  async getActiveRewards() {
    return this.rewardStore.filter(r => r.isActive);
  }

  async redeemReward(userId, rewardId, pointsSpent, coinsSpent) {
    const redemption = {
      id: this.nextId++,
      userId: userId,
      rewardId: rewardId,
      pointsSpent: pointsSpent,
      coinsSpent: coinsSpent || 0,
      status: 'active',
      redemptionCode: Math.random().toString(36).substring(2, 15),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      usedAt: null,
      redeemedAt: new Date()
    };
    this.userRewards.push(redemption);
    return redemption;
  }

  async getUserRewards(userId) {
    return this.userRewards.filter(ur => ur.userId === userId);
  }

  // Education Methods
  async getEducationModules() {
    return this.educationModules.filter(em => em.isActive);
  }

  async getUserEducationProgress(userId) {
    return this.userEducation.filter(ue => ue.userId === userId);
  }

  async updateEducationProgress(userId, moduleId, progress) {
    const existingIndex = this.userEducation.findIndex(ue => ue.userId === userId && ue.moduleId === moduleId);
    const progressData = {
      id: existingIndex >= 0 ? this.userEducation[existingIndex].id : this.nextId++,
      userId: userId,
      moduleId: moduleId,
      progress: progress,
      isCompleted: progress >= 100,
      completedAt: progress >= 100 ? new Date() : null,
      lastAccessedAt: new Date(),
      timeSpent: existingIndex >= 0 ? this.userEducation[existingIndex].timeSpent + 1 : 1
    };
    
    if (existingIndex >= 0) {
      this.userEducation[existingIndex] = progressData;
    } else {
      this.userEducation.push(progressData);
    }
    
    return progressData;
  }
}

// Database storage implementation (hybrid with memory fallback)
export class DatabaseStorage {
  constructor() {
    this.db = null;
    this.memoryStorage = new MemoryStorage();
    this.initDatabase();
  }

  async initDatabase() {
    try {
      const { db } = await import('./db.js');
      this.db = db;
      console.log('✅ DatabaseStorage initialized with database connection');
    } catch (error) {
      console.warn('⚠️ Database not available, using memory storage:', error.message);
      this.db = null;
    }
  }

  async getUser(id) {
    if (!this.db) return await this.memoryStorage.getUser(id);
    try {
      const { eq } = await import('drizzle-orm');
      const [user] = await this.db.select().from(users).where(eq(users.id, id));
      return user || undefined;
    } catch (error) {
      console.error('Database error in getUser:', error);
      return await this.memoryStorage.getUser(id);
    }
  }

  async getUserByEmail(email) {
    if (!this.db) return await this.memoryStorage.getUserByEmail(email);
    try {
      const { eq } = await import('drizzle-orm');
      const [user] = await this.db.select().from(users).where(eq(users.email, email));
      return user || undefined;
    } catch (error) {
      console.error('Database error in getUserByEmail:', error);
      return await this.memoryStorage.getUserByEmail(email);
    }
  }

  async verifyUserPassword(user, password) {
    if (!this.db) return await this.memoryStorage.verifyUserPassword(user, password);
    return await bcrypt.compare(password, user.passwordHash);
  }

  async createUser(user) {
    if (!this.db) return await this.memoryStorage.createUser(user);
    try {
      if (!user.password) {
        throw new Error('Password is required');
      }
      
      const passwordHash = await bcrypt.hash(user.password, 10);
      const [newUser] = await this.db
        .insert(users)
        .values({
          email: user.email,
          username: user.username,
          name: user.name,
          passwordHash,
          upiId: user.upiId || null,
          totalSavings: user.totalSavings || '0.00',
          todayRoundUp: user.todayRoundUp || '0.00',
          currentStreak: user.currentStreak || 0,
          profilePicture: user.profilePicture || null
        })
        .returning();
      
      // Return user without password hash
      const { passwordHash: _, ...userResponse } = newUser;
      return userResponse;
    } catch (error) {
      console.error('Database error in createUser:', error);
      return await this.memoryStorage.createUser(user);
    }
  }

  async updateUser(id, updates) {
    if (!this.db) return await this.memoryStorage.updateUser(id, updates);
    try {
      const { eq } = await import('drizzle-orm');
      const [updatedUser] = await this.db
        .update(users)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();
      return updatedUser || undefined;
    } catch (error) {
      console.error('Database error in updateUser:', error);
      return await this.memoryStorage.updateUser(id, updates);
    }
  }

  async createTransaction(transaction) {
    if (!this.db) return await this.memoryStorage.createTransaction(transaction);
    try {
      const [newTransaction] = await this.db
        .insert(transactions)
        .values({
          userId: transaction.userId,
          type: transaction.type,
          amount: transaction.amount,
          originalAmount: transaction.originalAmount || null,
          roundUpAmount: transaction.roundUpAmount || null,
          payee: transaction.payee || null,
          upiId: transaction.upiId || null,
          note: transaction.note || null,
          status: transaction.status || 'completed'
        })
        .returning();
      return newTransaction;
    } catch (error) {
      console.error('Database error in createTransaction:', error);
      return await this.memoryStorage.createTransaction(transaction);
    }
  }

  async getUserTransactions(userId, limit = 50) {
    if (!this.db) return await this.memoryStorage.getUserTransactions(userId, limit);
    try {
      const { eq, desc } = await import('drizzle-orm');
      const userTransactions = await this.db
        .select()
        .from(transactions)
        .where(eq(transactions.userId, userId))
        .orderBy(desc(transactions.createdAt))
        .limit(limit);
      return userTransactions;
    } catch (error) {
      console.error('Database error in getUserTransactions:', error);
      return await this.memoryStorage.getUserTransactions(userId, limit);
    }
  }

  async getUserChallenges(userId) {
    if (!this.db) return await this.memoryStorage.getUserChallenges(userId);
    try {
      const { eq } = await import('drizzle-orm');
      const userChallenges = await this.db
        .select()
        .from(challenges)
        .where(eq(challenges.userId, userId));
      return userChallenges;
    } catch (error) {
      console.error('Database error in getUserChallenges:', error);
      return await this.memoryStorage.getUserChallenges(userId);
    }
  }

  async createChallenge(challenge) {
    if (!this.db) return await this.memoryStorage.createChallenge(challenge);
    try {
      const [newChallenge] = await this.db
        .insert(challenges)
        .values({
          userId: challenge.userId,
          title: challenge.title,
          description: challenge.description || null,
          targetAmount: challenge.targetAmount,
          currentAmount: challenge.currentAmount || '0.00',
          deadline: challenge.deadline || null,
          status: challenge.status || 'active',
          category: challenge.category || null,
          isTemplate: challenge.isTemplate || false,
          completedAt: challenge.completedAt || null
        })
        .returning();
      return newChallenge;
    } catch (error) {
      console.error('Database error in createChallenge:', error);
      return await this.memoryStorage.createChallenge(challenge);
    }
  }

  async updateChallenge(id, updates) {
    if (!this.db) return await this.memoryStorage.updateChallenge(id, updates);
    try {
      const { eq } = await import('drizzle-orm');
      const [updatedChallenge] = await this.db
        .update(challenges)
        .set(updates)
        .where(eq(challenges.id, id))
        .returning();
      return updatedChallenge || undefined;
    } catch (error) {
      console.error('Database error in updateChallenge:', error);
      return await this.memoryStorage.updateChallenge(id, updates);
    }
  }

  async createActivity(activity) {
    if (!this.db) return await this.memoryStorage.createActivity(activity);
    try {
      const [newActivity] = await this.db
        .insert(activities)
        .values({
          userId: activity.userId,
          type: activity.type,
          amount: activity.amount || null,
          description: activity.description || null,
          icon: activity.icon || null,
          metadata: activity.metadata || null
        })
        .returning();
      return newActivity;
    } catch (error) {
      console.error('Database error in createActivity:', error);
      return await this.memoryStorage.createActivity(activity);
    }
  }

  async getUserActivities(userId, limit = 20) {
    if (!this.db) return await this.memoryStorage.getUserActivities(userId, limit);
    try {
      const { eq, desc } = await import('drizzle-orm');
      const userActivities = await this.db
        .select()
        .from(activities)
        .where(eq(activities.userId, userId))
        .orderBy(desc(activities.createdAt))
        .limit(limit);
      return userActivities;
    } catch (error) {
      console.error('Database error in getUserActivities:', error);
      return await this.memoryStorage.getUserActivities(userId, limit);
    }
  }

  async getUserBadges(userId) {
    if (!this.db) return await this.memoryStorage.getUserBadges(userId);
    try {
      const { eq } = await import('drizzle-orm');
      const badges = await this.db
        .select()
        .from(userBadges)
        .where(eq(userBadges.userId, userId));
      return badges;
    } catch (error) {
      console.error('Database error in getUserBadges:', error);
      return await this.memoryStorage.getUserBadges(userId);
    }
  }

  async updateUserBadge(userId, badgeId, earned) {
    if (!this.db) return await this.memoryStorage.updateUserBadge(userId, badgeId, earned);
    try {
      const { eq, and } = await import('drizzle-orm');
      await this.db
        .update(userBadges)
        .set({ 
          earned: earned,
          earnedAt: earned ? new Date() : null
        })
        .where(
          and(
            eq(userBadges.userId, userId),
            eq(userBadges.badgeId, badgeId)
          )
        );
    } catch (error) {
      console.error('Database error in updateUserBadge:', error);
      return await this.memoryStorage.updateUserBadge(userId, badgeId, earned);
    }
  }

  // Investment Portfolio Database Methods
  async createPortfolio(portfolio) {
    if (!this.db) return await this.memoryStorage.createPortfolio(portfolio);
    try {
      const [newPortfolio] = await this.db
        .insert(portfolios)
        .values({
          userId: portfolio.userId,
          name: portfolio.name,
          type: portfolio.type,
          totalInvested: portfolio.totalInvested || '0.00',
          currentValue: portfolio.currentValue || '0.00',
          returns: portfolio.returns || '0.00',
          returnsPercentage: portfolio.returnsPercentage || '0.00',
          isActive: portfolio.isActive !== false
        })
        .returning();
      return newPortfolio;
    } catch (error) {
      console.error('Database error in createPortfolio:', error);
      return await this.memoryStorage.createPortfolio(portfolio);
    }
  }

  async getUserPortfolios(userId) {
    if (!this.db) return await this.memoryStorage.getUserPortfolios(userId);
    try {
      const { eq, and } = await import('drizzle-orm');
      const userPortfolios = await this.db
        .select()
        .from(portfolios)
        .where(and(eq(portfolios.userId, userId), eq(portfolios.isActive, true)));
      return userPortfolios;
    } catch (error) {
      console.error('Database error in getUserPortfolios:', error);
      return await this.memoryStorage.getUserPortfolios(userId);
    }
  }

  async getPortfolio(id) {
    if (!this.db) return await this.memoryStorage.getPortfolio(id);
    try {
      const { eq } = await import('drizzle-orm');
      const [portfolio] = await this.db
        .select()
        .from(portfolios)
        .where(eq(portfolios.id, id));
      return portfolio;
    } catch (error) {
      console.error('Database error in getPortfolio:', error);
      return await this.memoryStorage.getPortfolio(id);
    }
  }

  async updatePortfolio(id, updates) {
    if (!this.db) return await this.memoryStorage.updatePortfolio(id, updates);
    try {
      const { eq } = await import('drizzle-orm');
      const [updatedPortfolio] = await this.db
        .update(portfolios)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(portfolios.id, id))
        .returning();
      return updatedPortfolio || undefined;
    } catch (error) {
      console.error('Database error in updatePortfolio:', error);
      return await this.memoryStorage.updatePortfolio(id, updates);
    }
  }

  // SIP Plans Database Methods
  async createSIPPlan(sipPlan) {
    if (!this.db) return await this.memoryStorage.createSIPPlan(sipPlan);
    try {
      const [newSIP] = await this.db
        .insert(sipPlans)
        .values({
          userId: sipPlan.userId,
          portfolioId: sipPlan.portfolioId,
          name: sipPlan.name,
          monthlyAmount: sipPlan.monthlyAmount,
          startDate: sipPlan.startDate,
          endDate: sipPlan.endDate || null,
          nextPaymentDate: sipPlan.nextPaymentDate,
          isActive: sipPlan.isActive !== false,
          autoInvestRoundups: sipPlan.autoInvestRoundups || false
        })
        .returning();
      return newSIP;
    } catch (error) {
      console.error('Database error in createSIPPlan:', error);
      return await this.memoryStorage.createSIPPlan(sipPlan);
    }
  }

  async getUserSIPPlans(userId) {
    if (!this.db) return await this.memoryStorage.getUserSIPPlans(userId);
    try {
      const { eq, and } = await import('drizzle-orm');
      const userSIPs = await this.db
        .select()
        .from(sipPlans)
        .where(and(eq(sipPlans.userId, userId), eq(sipPlans.isActive, true)));
      return userSIPs;
    } catch (error) {
      console.error('Database error in getUserSIPPlans:', error);
      return await this.memoryStorage.getUserSIPPlans(userId);
    }
  }

  async updateSIPPlan(id, updates) {
    if (!this.db) return await this.memoryStorage.updateSIPPlan(id, updates);
    try {
      const { eq } = await import('drizzle-orm');
      const [updatedSIP] = await this.db
        .update(sipPlans)
        .set(updates)
        .where(eq(sipPlans.id, id))
        .returning();
      return updatedSIP || undefined;
    } catch (error) {
      console.error('Database error in updateSIPPlan:', error);
      return await this.memoryStorage.updateSIPPlan(id, updates);
    }
  }

  // Investment Transactions Database Methods
  async createInvestment(investment) {
    if (!this.db) return await this.memoryStorage.createInvestment(investment);
    try {
      const [newInvestment] = await this.db
        .insert(investments)
        .values({
          userId: investment.userId,
          portfolioId: investment.portfolioId,
          type: investment.type,
          amount: investment.amount,
          units: investment.units || null,
          pricePerUnit: investment.pricePerUnit || null,
          transactionDate: investment.transactionDate || new Date(),
          status: investment.status || 'completed'
        })
        .returning();
      return newInvestment;
    } catch (error) {
      console.error('Database error in createInvestment:', error);
      return await this.memoryStorage.createInvestment(investment);
    }
  }

  async getUserInvestments(userId, limit = 50) {
    if (!this.db) return await this.memoryStorage.getUserInvestments(userId, limit);
    try {
      const { eq, desc } = await import('drizzle-orm');
      const userInvestments = await this.db
        .select()
        .from(investments)
        .where(eq(investments.userId, userId))
        .orderBy(desc(investments.transactionDate))
        .limit(limit);
      return userInvestments;
    } catch (error) {
      console.error('Database error in getUserInvestments:', error);
      return await this.memoryStorage.getUserInvestments(userId, limit);
    }
  }

  async getPortfolioInvestments(portfolioId) {
    if (!this.db) return await this.memoryStorage.getPortfolioInvestments(portfolioId);
    try {
      const { eq } = await import('drizzle-orm');
      const portfolioInvestments = await this.db
        .select()
        .from(investments)
        .where(eq(investments.portfolioId, portfolioId));
      return portfolioInvestments;
    } catch (error) {
      console.error('Database error in getPortfolioInvestments:', error);
      return await this.memoryStorage.getPortfolioInvestments(portfolioId);
    }
  }

  // Investment Goals Database Methods
  async createInvestmentGoal(goal) {
    if (!this.db) return await this.memoryStorage.createInvestmentGoal(goal);
    try {
      const [newGoal] = await this.db
        .insert(investmentGoals)
        .values({
          userId: goal.userId,
          portfolioId: goal.portfolioId || null,
          title: goal.title,
          description: goal.description || null,
          targetAmount: goal.targetAmount,
          currentAmount: goal.currentAmount || '0.00',
          targetDate: goal.targetDate || null,
          category: goal.category || null,
          isActive: goal.isActive !== false,
          completedAt: goal.completedAt || null
        })
        .returning();
      return newGoal;
    } catch (error) {
      console.error('Database error in createInvestmentGoal:', error);
      return await this.memoryStorage.createInvestmentGoal(goal);
    }
  }

  async getUserInvestmentGoals(userId) {
    if (!this.db) return await this.memoryStorage.getUserInvestmentGoals(userId);
    try {
      const { eq, and } = await import('drizzle-orm');
      const userGoals = await this.db
        .select()
        .from(investmentGoals)
        .where(and(eq(investmentGoals.userId, userId), eq(investmentGoals.isActive, true)));
      return userGoals;
    } catch (error) {
      console.error('Database error in getUserInvestmentGoals:', error);
      return await this.memoryStorage.getUserInvestmentGoals(userId);
    }
  }

  async updateInvestmentGoal(id, updates) {
    if (!this.db) return await this.memoryStorage.updateInvestmentGoal(id, updates);
    try {
      const { eq } = await import('drizzle-orm');
      const [updatedGoal] = await this.db
        .update(investmentGoals)
        .set(updates)
        .where(eq(investmentGoals.id, id))
        .returning();
      return updatedGoal || undefined;
    } catch (error) {
      console.error('Database error in updateInvestmentGoal:', error);
      return await this.memoryStorage.updateInvestmentGoal(id, updates);
    }
  }

  // Enhanced Streak Database Methods
  async createStreak(streak) {
    if (!this.db) return await this.memoryStorage.createStreak(streak);
    try {
      const [newStreak] = await this.db
        .insert(streaks)
        .values({
          userId: streak.userId,
          type: streak.type,
          currentStreak: streak.currentStreak || 0,
          longestStreak: streak.longestStreak || 0,
          lastActivityDate: streak.lastActivityDate || null,
          streakMultiplier: streak.streakMultiplier || '1.00',
          totalRewardsEarned: streak.totalRewardsEarned || '0.00'
        })
        .returning();
      return newStreak;
    } catch (error) {
      console.error('Database error in createStreak:', error);
      return await this.memoryStorage.createStreak(streak);
    }
  }

  async getUserStreaks(userId) {
    if (!this.db) return await this.memoryStorage.getUserStreaks(userId);
    try {
      const { eq } = await import('drizzle-orm');
      const userStreaks = await this.db
        .select()
        .from(streaks)
        .where(eq(streaks.userId, userId));
      return userStreaks;
    } catch (error) {
      console.error('Database error in getUserStreaks:', error);
      return await this.memoryStorage.getUserStreaks(userId);
    }
  }

  async updateStreak(id, updates) {
    if (!this.db) return await this.memoryStorage.updateStreak(id, updates);
    try {
      const { eq } = await import('drizzle-orm');
      const [updatedStreak] = await this.db
        .update(streaks)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(streaks.id, id))
        .returning();
      return updatedStreak || undefined;
    } catch (error) {
      console.error('Database error in updateStreak:', error);
      return await this.memoryStorage.updateStreak(id, updates);
    }
  }

  // Budget Database Methods
  async createBudget(budget) {
    if (!this.db) return await this.memoryStorage.createBudget(budget);
    try {
      const [newBudget] = await this.db
        .insert(budgets)
        .values({
          userId: budget.userId,
          category: budget.category,
          monthlyLimit: budget.monthlyLimit,
          currentSpent: budget.currentSpent || '0.00',
          alertThreshold: budget.alertThreshold || '0.80',
          isActive: budget.isActive !== false
        })
        .returning();
      return newBudget;
    } catch (error) {
      console.error('Database error in createBudget:', error);
      return await this.memoryStorage.createBudget(budget);
    }
  }

  async getUserBudgets(userId) {
    if (!this.db) return await this.memoryStorage.getUserBudgets(userId);
    try {
      const { eq, and } = await import('drizzle-orm');
      const userBudgets = await this.db
        .select()
        .from(budgets)
        .where(and(eq(budgets.userId, userId), eq(budgets.isActive, true)));
      return userBudgets;
    } catch (error) {
      console.error('Database error in getUserBudgets:', error);
      return await this.memoryStorage.getUserBudgets(userId);
    }
  }

  async updateBudget(id, updates) {
    if (!this.db) return await this.memoryStorage.updateBudget(id, updates);
    try {
      const { eq } = await import('drizzle-orm');
      const [updatedBudget] = await this.db
        .update(budgets)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(budgets.id, id))
        .returning();
      return updatedBudget || undefined;
    } catch (error) {
      console.error('Database error in updateBudget:', error);
      return await this.memoryStorage.updateBudget(id, updates);
    }
  }

  // Financial Health Database Methods
  async createOrUpdateFinancialHealth(userId, scores) {
    if (!this.db) return await this.memoryStorage.createOrUpdateFinancialHealth(userId, scores);
    try {
      const { eq } = await import('drizzle-orm');
      
      // Check if exists
      const [existing] = await this.db
        .select()
        .from(financialHealth)
        .where(eq(financialHealth.userId, userId));
      
      const healthData = {
        userId: userId,
        overallScore: scores.overallScore,
        savingsScore: scores.savingsScore,
        spendingScore: scores.spendingScore,
        investmentScore: scores.investmentScore,
        budgetScore: scores.budgetScore,
        streakScore: scores.streakScore,
        calculatedAt: new Date(),
        recommendations: scores.recommendations || null,
        trends: scores.trends || null
      };
      
      if (existing) {
        const [updated] = await this.db
          .update(financialHealth)
          .set(healthData)
          .where(eq(financialHealth.userId, userId))
          .returning();
        return updated;
      } else {
        const [created] = await this.db
          .insert(financialHealth)
          .values(healthData)
          .returning();
        return created;
      }
    } catch (error) {
      console.error('Database error in createOrUpdateFinancialHealth:', error);
      return await this.memoryStorage.createOrUpdateFinancialHealth(userId, scores);
    }
  }

  async getUserFinancialHealth(userId) {
    if (!this.db) return await this.memoryStorage.getUserFinancialHealth(userId);
    try {
      const { eq } = await import('drizzle-orm');
      const [health] = await this.db
        .select()
        .from(financialHealth)
        .where(eq(financialHealth.userId, userId));
      return health;
    } catch (error) {
      console.error('Database error in getUserFinancialHealth:', error);
      return await this.memoryStorage.getUserFinancialHealth(userId);
    }
  }

  // Education Database Methods
  async getEducationModules() {
    if (!this.db) return await this.memoryStorage.getEducationModules();
    try {
      const { eq } = await import('drizzle-orm');
      const modules = await this.db
        .select()
        .from(educationModules)
        .where(eq(educationModules.isActive, true));
      return modules;
    } catch (error) {
      console.error('Database error in getEducationModules:', error);
      return await this.memoryStorage.getEducationModules();
    }
  }

  async getUserEducationProgress(userId) {
    if (!this.db) return await this.memoryStorage.getUserEducationProgress(userId);
    try {
      const { eq } = await import('drizzle-orm');
      const progress = await this.db
        .select()
        .from(userEducation)
        .where(eq(userEducation.userId, userId));
      return progress;
    } catch (error) {
      console.error('Database error in getUserEducationProgress:', error);
      return await this.memoryStorage.getUserEducationProgress(userId);
    }
  }

  async updateEducationProgress(userId, moduleId, progress) {
    if (!this.db) return await this.memoryStorage.updateEducationProgress(userId, moduleId, progress);
    try {
      const { eq, and } = await import('drizzle-orm');
      
      // Check if exists
      const [existing] = await this.db
        .select()
        .from(userEducation)
        .where(and(eq(userEducation.userId, userId), eq(userEducation.moduleId, moduleId)));
      
      const progressData = {
        userId: userId,
        moduleId: moduleId,
        progress: progress,
        isCompleted: progress >= 100,
        completedAt: progress >= 100 ? new Date() : null,
        lastAccessedAt: new Date(),
        timeSpent: existing ? existing.timeSpent + 1 : 1
      };
      
      if (existing) {
        const [updated] = await this.db
          .update(userEducation)
          .set(progressData)
          .where(and(eq(userEducation.userId, userId), eq(userEducation.moduleId, moduleId)))
          .returning();
        return updated;
      } else {
        const [created] = await this.db
          .insert(userEducation)
          .values(progressData)
          .returning();
        return created;
      }
    } catch (error) {
      console.error('Database error in updateEducationProgress:', error);
      return await this.memoryStorage.updateEducationProgress(userId, moduleId, progress);
    }
  }
}

// Initialize storage with hybrid approach
export const storage = new DatabaseStorage();

console.log('Storage initialized with DatabaseStorage (with memory fallback)');