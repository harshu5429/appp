import { storage } from './storage.js';
import { 
  authenticateUser, 
  authorizeUser, 
  authenticateAndAuthorize,
  authorizeResourceOwnership,
  sendAuthError, 
  sendAuthzError,
  generateToken,
  isPublicEndpoint
} from './auth.js';

// Sanitize user data to prevent sensitive information leakage
function sanitizeUser(user) {
  if (!user) return user;
  const { passwordHash, ...sanitizedUser } = user;
  return sanitizedUser;
}

// API endpoints for the SaveUp app
export const handleAPI = async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  const method = req.method;

  // CORS headers - restricted for security
  const allowedOrigins = [
    'https://saveup-app.replit.dev',
    'https://saveup-app.replit.app',
    'http://localhost:5000',
    'http://localhost:3000'
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  try {
    // Parse request body for POST/PUT requests
    let body = null;
    if (method === 'POST' || method === 'PUT') {
      body = await new Promise((resolve, reject) => {
        let data = '';
        req.on('data', chunk => data += chunk);
        req.on('end', () => {
          try {
            resolve(data ? JSON.parse(data) : {});
          } catch (err) {
            reject(err);
          }
        });
        req.on('error', reject);
      });
    }

    // Check if endpoint is public (doesn't require authentication)
    if (!isPublicEndpoint(method, path)) {
      const authResult = authenticateUser(req);
      if (!authResult.success) {
        sendAuthError(res, authResult);
        return;
      }
      req.authenticatedUser = authResult.user;
    }

    // Route handlers
    if (path === '/api/users' && method === 'POST') {
      const user = await storage.createUser(body);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(user));
    } 
    else if (path === '/api/users/login' && method === 'POST') {
      // Validate required fields
      if (!body.email || !body.password) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Email and password are required' }));
        return;
      }

      const user = await storage.getUserByEmail(body.email);
      if (!user) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid credentials' }));
        return;
      }

      // Verify password
      const isValidPassword = await storage.verifyUserPassword(user, body.password);
      if (!isValidPassword) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid credentials' }));
        return;
      }

      // Generate JWT token for successful login
      const { passwordHash: _, ...userResponse } = user;
      const token = generateToken(userResponse);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ user: userResponse, token }));
    }
    else if (path.match(/^\/api\/users\/(\d+)$/) && method === 'GET') {
      const pathUserId = path.match(/^\/api\/users\/(\d+)$/)[1];
      const authzResult = authorizeUser(req.authenticatedUser.userId, pathUserId);
      if (!authzResult.success) {
        sendAuthzError(res, authzResult);
        return;
      }
      
      const user = await storage.getUser(authzResult.userId);
      if (user) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(sanitizeUser(user)));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'User not found' }));
      }
    }
    else if (path.match(/^\/api\/users\/(\d+)$/) && method === 'PUT') {
      const pathUserId = path.match(/^\/api\/users\/(\d+)$/)[1];
      const authzResult = authorizeUser(req.authenticatedUser.userId, pathUserId);
      if (!authzResult.success) {
        sendAuthzError(res, authzResult);
        return;
      }
      
      const user = await storage.updateUser(authzResult.userId, body);
      if (user) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(sanitizeUser(user)));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'User not found' }));
      }
    }
    else if (path === '/api/transactions' && method === 'POST') {
      // Use authenticated user ID instead of body.userId
      const transactionData = {
        ...body,
        userId: req.authenticatedUser.userId
      };
      const transaction = await storage.createTransaction(transactionData);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(transaction));
    }
    else if (path.match(/^\/api\/users\/(\d+)\/transactions$/) && method === 'GET') {
      const pathUserId = path.match(/^\/api\/users\/(\d+)\/transactions$/)[1];
      const authzResult = authorizeUser(req.authenticatedUser.userId, pathUserId);
      if (!authzResult.success) {
        sendAuthzError(res, authzResult);
        return;
      }
      
      const limit = parseInt(url.searchParams.get('limit')) || 20;
      const transactions = await storage.getUserTransactions(authzResult.userId, limit);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(transactions));
    }
    else if (path === '/api/challenges' && method === 'POST') {
      // Use authenticated user ID instead of body.userId
      const challengeData = {
        ...body,
        userId: req.authenticatedUser.userId
      };
      const challenge = await storage.createChallenge(challengeData);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(challenge));
    }
    else if (path.match(/^\/api\/users\/(\d+)\/challenges$/) && method === 'GET') {
      const pathUserId = path.match(/^\/api\/users\/(\d+)\/challenges$/)[1];
      const authzResult = authorizeUser(req.authenticatedUser.userId, pathUserId);
      if (!authzResult.success) {
        sendAuthzError(res, authzResult);
        return;
      }
      
      const challenges = await storage.getUserChallenges(authzResult.userId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(challenges));
    }
    else if (path.match(/^\/api\/challenges\/(\d+)$/) && method === 'PUT') {
      const challengeId = parseInt(path.match(/^\/api\/challenges\/(\d+)$/)[1]);
      
      // First get the challenge to verify ownership
      const existingChallenge = await storage.getChallenge ? await storage.getChallenge(challengeId) : null;
      if (!existingChallenge) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Challenge not found' }));
        return;
      }
      
      // Verify challenge ownership
      const ownershipResult = authorizeResourceOwnership(req.authenticatedUser.userId, existingChallenge.userId);
      if (!ownershipResult.success) {
        sendAuthzError(res, ownershipResult);
        return;
      }
      
      const challenge = await storage.updateChallenge(challengeId, body);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(challenge));
    }
    else if (path === '/api/activities' && method === 'POST') {
      // Use authenticated user ID instead of body.userId
      const activityData = {
        ...body,
        userId: req.authenticatedUser.userId
      };
      const activity = await storage.createActivity(activityData);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(activity));
    }
    else if (path.match(/^\/api\/users\/(\d+)\/activities$/) && method === 'GET') {
      const pathUserId = path.match(/^\/api\/users\/(\d+)\/activities$/)[1];
      const authzResult = authorizeUser(req.authenticatedUser.userId, pathUserId);
      if (!authzResult.success) {
        sendAuthzError(res, authzResult);
        return;
      }
      
      const limit = parseInt(url.searchParams.get('limit')) || 10;
      const activities = await storage.getUserActivities(authzResult.userId, limit);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(activities));
    }
    else if (path.match(/^\/api\/users\/(\d+)\/badges$/) && method === 'GET') {
      const pathUserId = path.match(/^\/api\/users\/(\d+)\/badges$/)[1];
      const authzResult = authorizeUser(req.authenticatedUser.userId, pathUserId);
      if (!authzResult.success) {
        sendAuthzError(res, authzResult);
        return;
      }
      
      const badges = await storage.getUserBadges(authzResult.userId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(badges));
    }
    else if (path.match(/^\/api\/users\/(\d+)\/badges\/(\w+)$/) && method === 'PUT') {
      const pathUserId = path.match(/^\/api\/users\/(\d+)\/badges\/(\w+)$/)[1];
      const badgeId = path.match(/^\/api\/users\/(\d+)\/badges\/(\w+)$/)[2];
      const authzResult = authorizeUser(req.authenticatedUser.userId, pathUserId);
      if (!authzResult.success) {
        sendAuthzError(res, authzResult);
        return;
      }
      
      await storage.updateUserBadge(authzResult.userId, badgeId, body.earned);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    }
    
    // Investment Portfolio Endpoints
    else if (path === '/api/portfolios' && method === 'POST') {
      // Use authenticated user ID instead of body.userId
      const portfolioData = {
        ...body,
        userId: req.authenticatedUser.userId
      };
      const portfolio = await storage.createPortfolio(portfolioData);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(portfolio));
    }
    else if (path.match(/^\/api\/users\/(\d+)\/portfolios$/) && method === 'GET') {
      const pathUserId = path.match(/^\/api\/users\/(\d+)\/portfolios$/)[1];
      const authzResult = authorizeUser(req.authenticatedUser.userId, pathUserId);
      if (!authzResult.success) {
        sendAuthzError(res, authzResult);
        return;
      }
      
      const portfolios = await storage.getUserPortfolios(authzResult.userId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(portfolios));
    }
    else if (path.match(/^\/api\/portfolios\/(\d+)$/) && method === 'GET') {
      const portfolioId = parseInt(path.match(/^\/api\/portfolios\/(\d+)$/)[1]);
      const portfolio = await storage.getPortfolio(portfolioId);
      if (portfolio) {
        // Verify portfolio ownership
        const ownershipResult = authorizeResourceOwnership(req.authenticatedUser.userId, portfolio.userId);
        if (!ownershipResult.success) {
          sendAuthzError(res, ownershipResult);
          return;
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(portfolio));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Portfolio not found' }));
      }
    }
    else if (path.match(/^\/api\/portfolios\/(\d+)$/) && method === 'PUT') {
      const portfolioId = parseInt(path.match(/^\/api\/portfolios\/(\d+)$/)[1]);
      
      // First get the portfolio to verify ownership
      const existingPortfolio = await storage.getPortfolio(portfolioId);
      if (!existingPortfolio) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Portfolio not found' }));
        return;
      }
      
      // Verify portfolio ownership
      const ownershipResult = authorizeResourceOwnership(req.authenticatedUser.userId, existingPortfolio.userId);
      if (!ownershipResult.success) {
        sendAuthzError(res, ownershipResult);
        return;
      }
      
      const portfolio = await storage.updatePortfolio(portfolioId, body);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(portfolio));
    }
    
    // SIP Plans Endpoints
    else if (path === '/api/sip-plans' && method === 'POST') {
      // Use authenticated user ID instead of body.userId
      const sipPlanData = {
        ...body,
        userId: req.authenticatedUser.userId
      };
      const sipPlan = await storage.createSipPlan(sipPlanData);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(sipPlan));
    }
    else if (path.match(/^\/api\/users\/(\d+)\/sip-plans$/) && method === 'GET') {
      const pathUserId = path.match(/^\/api\/users\/(\d+)\/sip-plans$/)[1];
      const authzResult = authorizeUser(req.authenticatedUser.userId, pathUserId);
      if (!authzResult.success) {
        sendAuthzError(res, authzResult);
        return;
      }
      
      const sipPlans = await storage.getUserSipPlans(authzResult.userId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(sipPlans));
    }
    else if (path.match(/^\/api\/sip-plans\/(\d+)$/) && method === 'PUT') {
      const sipPlanId = parseInt(path.match(/^\/api\/sip-plans\/(\d+)$/)[1]);
      
      // First get the SIP plan to verify ownership
      const existingSipPlan = await storage.getSipPlan ? await storage.getSipPlan(sipPlanId) : null;
      if (!existingSipPlan) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'SIP plan not found' }));
        return;
      }
      
      // Verify SIP plan ownership
      const ownershipResult = authorizeResourceOwnership(req.authenticatedUser.userId, existingSipPlan.userId);
      if (!ownershipResult.success) {
        sendAuthzError(res, ownershipResult);
        return;
      }
      
      const sipPlan = await storage.updateSipPlan(sipPlanId, body);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(sipPlan));
    }
    
    // Investment Transactions Endpoints
    else if (path === '/api/investments' && method === 'POST') {
      // Use authenticated user ID instead of body.userId
      const investmentData = {
        ...body,
        userId: req.authenticatedUser.userId
      };
      const investment = await storage.createInvestment(investmentData);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(investment));
    }
    else if (path.match(/^\/api\/users\/(\d+)\/investments$/) && method === 'GET') {
      const pathUserId = path.match(/^\/api\/users\/(\d+)\/investments$/)[1];
      const authzResult = authorizeUser(req.authenticatedUser.userId, pathUserId);
      if (!authzResult.success) {
        sendAuthzError(res, authzResult);
        return;
      }
      
      const limit = parseInt(url.searchParams.get('limit')) || 20;
      const investments = await storage.getUserInvestments(authzResult.userId, limit);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(investments));
    }
    else if (path.match(/^\/api\/portfolios\/(\d+)\/investments$/) && method === 'GET') {
      const portfolioId = parseInt(path.match(/^\/api\/portfolios\/(\d+)\/investments$/)[1]);
      
      // First get the portfolio to verify ownership
      const portfolio = await storage.getPortfolio(portfolioId);
      if (!portfolio) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Portfolio not found' }));
        return;
      }
      
      // Verify portfolio ownership
      const ownershipResult = authorizeResourceOwnership(req.authenticatedUser.userId, portfolio.userId);
      if (!ownershipResult.success) {
        sendAuthzError(res, ownershipResult);
        return;
      }
      
      const investments = await storage.getPortfolioInvestments(portfolioId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(investments));
    }
    
    // Investment Goals Endpoints
    else if (path === '/api/investment-goals' && method === 'POST') {
      // Use authenticated user ID instead of body.userId
      const goalData = {
        ...body,
        userId: req.authenticatedUser.userId
      };
      const goal = await storage.createInvestmentGoal(goalData);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(goal));
    }
    else if (path.match(/^\/api\/users\/(\d+)\/investment-goals$/) && method === 'GET') {
      const pathUserId = path.match(/^\/api\/users\/(\d+)\/investment-goals$/)[1];
      const authzResult = authorizeUser(req.authenticatedUser.userId, pathUserId);
      if (!authzResult.success) {
        sendAuthzError(res, authzResult);
        return;
      }
      
      const goals = await storage.getUserInvestmentGoals(authzResult.userId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(goals));
    }
    else if (path.match(/^\/api\/investment-goals\/(\d+)$/) && method === 'PUT') {
      const goalId = parseInt(path.match(/^\/api\/investment-goals\/(\d+)$/)[1]);
      
      // First get the investment goal to verify ownership
      const existingGoal = await storage.getInvestmentGoal ? await storage.getInvestmentGoal(goalId) : null;
      if (!existingGoal) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Investment goal not found' }));
        return;
      }
      
      // Verify investment goal ownership
      const ownershipResult = authorizeResourceOwnership(req.authenticatedUser.userId, existingGoal.userId);
      if (!ownershipResult.success) {
        sendAuthzError(res, ownershipResult);
        return;
      }
      
      const goal = await storage.updateInvestmentGoal(goalId, body);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(goal));
    }
    
    // Enhanced Gamification - Streaks Endpoints
    else if (path.match(/^\/api\/users\/(\d+)\/streaks$/) && method === 'GET') {
      const pathUserId = path.match(/^\/api\/users\/(\d+)\/streaks$/)[1];
      const authzResult = authorizeUser(req.authenticatedUser.userId, pathUserId);
      if (!authzResult.success) {
        sendAuthzError(res, authzResult);
        return;
      }
      
      const streaks = await storage.getUserStreaks(authzResult.userId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(streaks));
    }
    else if (path.match(/^\/api\/users\/(\d+)\/streaks\/(\w+)$/) && method === 'PUT') {
      const pathUserId = path.match(/^\/api\/users\/(\d+)\/streaks\/(\w+)$/)[1];
      const streakType = path.match(/^\/api\/users\/(\d+)\/streaks\/(\w+)$/)[2];
      const authzResult = authorizeUser(req.authenticatedUser.userId, pathUserId);
      if (!authzResult.success) {
        sendAuthzError(res, authzResult);
        return;
      }
      
      const streak = await storage.updateStreak(authzResult.userId, streakType, body);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(streak));
    }
    
    // Seasonal Challenges Endpoints
    else if (path === '/api/seasonal-challenges' && method === 'POST') {
      const challenge = await storage.createSeasonalChallenge(body);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(challenge));
    }
    else if (path === '/api/seasonal-challenges' && method === 'GET') {
      const isActive = url.searchParams.get('active') === 'true';
      const challenges = await storage.getSeasonalChallenges(isActive);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(challenges));
    }
    else if (path.match(/^\/api\/seasonal-challenges\/(\d+)\/join$/) && method === 'POST') {
      const challengeId = parseInt(path.match(/^\/api\/seasonal-challenges\/(\d+)\/join$/)[1]);
      // Use authenticated user ID instead of body.userId
      const participation = await storage.joinSeasonalChallenge(challengeId, req.authenticatedUser.userId);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(participation));
    }
    else if (path.match(/^\/api\/users\/(\d+)\/seasonal-challenges$/) && method === 'GET') {
      const pathUserId = path.match(/^\/api\/users\/(\d+)\/seasonal-challenges$/)[1];
      const authzResult = authorizeUser(req.authenticatedUser.userId, pathUserId);
      if (!authzResult.success) {
        sendAuthzError(res, authzResult);
        return;
      }
      
      const challenges = await storage.getUserSeasonalChallenges(authzResult.userId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(challenges));
    }
    else if (path.match(/^\/api\/seasonal-challenges\/(\d+)\/progress$/) && method === 'PUT') {
      const challengeId = parseInt(path.match(/^\/api\/seasonal-challenges\/(\d+)\/progress$/)[1]);
      // Use authenticated user ID instead of body.userId to prevent privilege escalation
      const progress = await storage.updateChallengeProgress(challengeId, req.authenticatedUser.userId, body.progress);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(progress));
    }
    
    // Achievement System Endpoints
    else if (path === '/api/achievements' && method === 'GET') {
      const category = url.searchParams.get('category');
      const achievements = await storage.getAchievements(category);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(achievements));
    }
    else if (path.match(/^\/api\/users\/(\d+)\/achievements$/) && method === 'GET') {
      const pathUserId = path.match(/^\/api\/users\/(\d+)\/achievements$/)[1];
      const authzResult = authorizeUser(req.authenticatedUser.userId, pathUserId);
      if (!authzResult.success) {
        sendAuthzError(res, authzResult);
        return;
      }
      
      const achievements = await storage.getUserAchievements(authzResult.userId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(achievements));
    }
    else if (path.match(/^\/api\/users\/(\d+)\/achievements$/) && method === 'POST') {
      const pathUserId = path.match(/^\/api\/users\/(\d+)\/achievements$/)[1];
      const authzResult = authorizeUser(req.authenticatedUser.userId, pathUserId);
      if (!authzResult.success) {
        sendAuthzError(res, authzResult);
        return;
      }
      
      const achievement = await storage.awardAchievement(authzResult.userId, body.achievementId);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(achievement));
    }
    
    // Reward Store Endpoints
    else if (path === '/api/rewards' && method === 'GET') {
      const category = url.searchParams.get('category');
      const rewards = await storage.getRewards(category);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(rewards));
    }
    else if (path.match(/^\/api\/users\/(\d+)\/rewards$/) && method === 'GET') {
      const pathUserId = path.match(/^\/api\/users\/(\d+)\/rewards$/)[1];
      const authzResult = authorizeUser(req.authenticatedUser.userId, pathUserId);
      if (!authzResult.success) {
        sendAuthzError(res, authzResult);
        return;
      }
      
      const rewards = await storage.getUserRewards(authzResult.userId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(rewards));
    }
    else if (path.match(/^\/api\/users\/(\d+)\/rewards\/redeem$/) && method === 'POST') {
      const pathUserId = path.match(/^\/api\/users\/(\d+)\/rewards\/redeem$/)[1];
      const authzResult = authorizeUser(req.authenticatedUser.userId, pathUserId);
      if (!authzResult.success) {
        sendAuthzError(res, authzResult);
        return;
      }
      
      const redemption = await storage.redeemReward(authzResult.userId, body.rewardId, body.pointsSpent, body.coinsSpent);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(redemption));
    }
    
    // Social Features - Teams Endpoints
    else if (path === '/api/teams' && method === 'POST') {
      const team = await storage.createTeam(body);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(team));
    }
    else if (path === '/api/teams' && method === 'GET') {
      const type = url.searchParams.get('type');
      const teams = await storage.getTeams(type);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(teams));
    }
    else if (path.match(/^\/api\/teams\/(\d+)\/join$/) && method === 'POST') {
      const teamId = parseInt(path.match(/^\/api\/teams\/(\d+)\/join$/)[1]);
      // Use authenticated user ID instead of body.userId
      const membership = await storage.joinTeam(teamId, req.authenticatedUser.userId);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(membership));
    }
    else if (path.match(/^\/api\/users\/(\d+)\/teams$/) && method === 'GET') {
      const pathUserId = path.match(/^\/api\/users\/(\d+)\/teams$/)[1];
      const authzResult = authorizeUser(req.authenticatedUser.userId, pathUserId);
      if (!authzResult.success) {
        sendAuthzError(res, authzResult);
        return;
      }
      
      const teams = await storage.getUserTeams(authzResult.userId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(teams));
    }
    
    // Communities Endpoints  
    else if (path === '/api/communities' && method === 'POST') {
      const community = await storage.createCommunity(body);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(community));
    }
    else if (path === '/api/communities' && method === 'GET') {
      const category = url.searchParams.get('category');
      const isPublic = url.searchParams.get('public') === 'true';
      const communities = await storage.getCommunities(category, isPublic);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(communities));
    }
    else if (path.match(/^\/api\/communities\/(\d+)\/join$/) && method === 'POST') {
      const communityId = parseInt(path.match(/^\/api\/communities\/(\d+)\/join$/)[1]);
      // Use authenticated user ID instead of body.userId
      const membership = await storage.joinCommunity(communityId, req.authenticatedUser.userId);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(membership));
    }
    
    // Group Goals Endpoints
    else if (path === '/api/group-goals' && method === 'POST') {
      const goal = await storage.createGroupGoal(body);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(goal));
    }
    else if (path === '/api/group-goals' && method === 'GET') {
      const category = url.searchParams.get('category');
      const isPublic = url.searchParams.get('public') === 'true';
      const goals = await storage.getGroupGoals(category, isPublic);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(goals));
    }
    else if (path.match(/^\/api\/group-goals\/(\d+)\/join$/) && method === 'POST') {
      const goalId = parseInt(path.match(/^\/api\/group-goals\/(\d+)\/join$/)[1]);
      // Use authenticated user ID instead of body.userId
      const membership = await storage.joinGroupGoal(goalId, req.authenticatedUser.userId, body.contributedAmount);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(membership));
    }
    else if (path.match(/^\/api\/users\/(\d+)\/group-goals$/) && method === 'GET') {
      const pathUserId = path.match(/^\/api\/users\/(\d+)\/group-goals$/)[1];
      const authzResult = authorizeUser(req.authenticatedUser.userId, pathUserId);
      if (!authzResult.success) {
        sendAuthzError(res, authzResult);
        return;
      }
      
      const goals = await storage.getUserGroupGoals(authzResult.userId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(goals));
    }
    
    // Financial Insights Endpoints
    else if (path.match(/^\/api\/users\/(\d+)\/budgets$/) && method === 'GET') {
      const pathUserId = path.match(/^\/api\/users\/(\d+)\/budgets$/)[1];
      const authzResult = authorizeUser(req.authenticatedUser.userId, pathUserId);
      if (!authzResult.success) {
        sendAuthzError(res, authzResult);
        return;
      }
      
      const budgets = await storage.getUserBudgets(authzResult.userId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(budgets));
    }
    else if (path === '/api/budgets' && method === 'POST') {
      // Use authenticated user ID instead of body.userId
      const budgetData = {
        ...body,
        userId: req.authenticatedUser.userId
      };
      const budget = await storage.createBudget(budgetData);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(budget));
    }
    else if (path.match(/^\/api\/users\/(\d+)\/financial-health$/) && method === 'GET') {
      const pathUserId = path.match(/^\/api\/users\/(\d+)\/financial-health$/)[1];
      const authzResult = authorizeUser(req.authenticatedUser.userId, pathUserId);
      if (!authzResult.success) {
        sendAuthzError(res, authzResult);
        return;
      }
      
      const health = await storage.getUserFinancialHealth(authzResult.userId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(health));
    }
    
    // Education Endpoints (public endpoint)
    else if (path === '/api/education/modules' && method === 'GET') {
      const category = url.searchParams.get('category');
      const modules = await storage.getEducationModules(category);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(modules));
    }
    else if (path.match(/^\/api\/users\/(\d+)\/education\/progress$/) && method === 'GET') {
      const pathUserId = path.match(/^\/api\/users\/(\d+)\/education\/progress$/)[1];
      const authzResult = authorizeUser(req.authenticatedUser.userId, pathUserId);
      if (!authzResult.success) {
        sendAuthzError(res, authzResult);
        return;
      }
      
      const progress = await storage.getUserEducationProgress(authzResult.userId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(progress));
    }
    else if (path.match(/^\/api\/users\/(\d+)\/education\/progress$/) && method === 'PUT') {
      const pathUserId = path.match(/^\/api\/users\/(\d+)\/education\/progress$/)[1];
      const authzResult = authorizeUser(req.authenticatedUser.userId, pathUserId);
      if (!authzResult.success) {
        sendAuthzError(res, authzResult);
        return;
      }
      
      const progress = await storage.updateEducationProgress(authzResult.userId, body.moduleId, body.progress);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(progress));
    }
    
    // Banking Features - Bank Accounts Endpoints
    else if (path.match(/^\/api\/users\/(\d+)\/bank-accounts$/) && method === 'GET') {
      const authResult = authenticateUser(req);
      if (!authResult.success) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: authResult.error }));
        return;
      }
      const userId = parseInt(path.match(/^\/api\/users\/(\d+)\/bank-accounts$/)[1]);
      if (!authorizeUser(authResult.userId, userId)) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Access forbidden' }));
        return;
      }
      const accounts = await storage.getUserBankAccounts(userId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(accounts));
    }
    else if (path === '/api/bank-accounts' && method === 'POST') {
      const authResult = authenticateUser(req);
      if (!authResult.success) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: authResult.error }));
        return;
      }
      const account = await storage.createBankAccount({ ...body, userId: authResult.userId });
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(account));
    }
    
    // Bill Splitting Endpoints
    else if (path === '/api/bill-splits' && method === 'POST') {
      const authResult = authenticateUser(req);
      if (!authResult.success) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: authResult.error }));
        return;
      }
      const billSplit = await storage.createBillSplit({ ...body, createdBy: authResult.userId });
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(billSplit));
    }
    else if (path.match(/^\/api\/users\/(\d+)\/bill-splits$/) && method === 'GET') {
      const authResult = authenticateUser(req);
      if (!authResult.success) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: authResult.error }));
        return;
      }
      const userId = parseInt(path.match(/^\/api\/users\/(\d+)\/bill-splits$/)[1]);
      if (!authorizeUser(authResult.userId, userId)) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Access forbidden' }));
        return;
      }
      const billSplits = await storage.getUserBillSplits(userId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(billSplits));
    }
    else if (path.match(/^\/api\/bill-splits\/(\d+)\/join$/) && method === 'POST') {
      const authResult = authenticateUser(req);
      if (!authResult.success) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: authResult.error }));
        return;
      }
      const billSplitId = parseInt(path.match(/^\/api\/bill-splits\/(\d+)\/join$/)[1]);
      const membership = await storage.joinBillSplit(billSplitId, authResult.userId, body.shareAmount);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(membership));
    }
    
    // Scheduled Payments Endpoints
    else if (path.match(/^\/api\/users\/(\d+)\/scheduled-payments$/) && method === 'GET') {
      const authResult = authenticateUser(req);
      if (!authResult.success) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: authResult.error }));
        return;
      }
      const userId = parseInt(path.match(/^\/api\/users\/(\d+)\/scheduled-payments$/)[1]);
      if (!authorizeUser(authResult.userId, userId)) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Access forbidden' }));
        return;
      }
      const payments = await storage.getUserScheduledPayments(userId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(payments));
    }
    else if (path === '/api/scheduled-payments' && method === 'POST') {
      const authResult = authenticateUser(req);
      if (!authResult.success) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: authResult.error }));
        return;
      }
      const payment = await storage.createScheduledPayment({ ...body, userId: authResult.userId });
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(payment));
    }
    
    // Mentorship System Endpoints
    else if (path === '/api/mentorships' && method === 'POST') {
      const authResult = authenticateUser(req);
      if (!authResult.success) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: authResult.error }));
        return;
      }
      const mentorship = await storage.createMentorship({ ...body, mentorId: authResult.userId });
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(mentorship));
    }
    else if (path === '/api/mentorships' && method === 'GET') {
      const authResult = authenticateUser(req);
      if (!authResult.success) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: authResult.error }));
        return;
      }
      const status = url.searchParams.get('status');
      const mentorships = await storage.getMentorships(status);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(mentorships));
    }
    else if (path.match(/^\/api\/users\/(\d+)\/mentorships$/) && method === 'GET') {
      const authResult = authenticateUser(req);
      if (!authResult.success) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: authResult.error }));
        return;
      }
      const userId = parseInt(path.match(/^\/api\/users\/(\d+)\/mentorships$/)[1]);
      if (!authorizeUser(authResult.userId, userId)) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Access forbidden' }));
        return;
      }
      const role = url.searchParams.get('role'); // 'mentor' or 'mentee'
      const mentorships = await storage.getUserMentorships(userId, role);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(mentorships));
    }
    else if (path.match(/^\/api\/mentorships\/(\d+)\/accept$/) && method === 'POST') {
      const authResult = authenticateUser(req);
      if (!authResult.success) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: authResult.error }));
        return;
      }
      const mentorshipId = parseInt(path.match(/^\/api\/mentorships\/(\d+)\/accept$/)[1]);
      const mentorship = await storage.acceptMentorship(mentorshipId, authResult.userId);
      if (mentorship) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(mentorship));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Mentorship not found or unauthorized' }));
      }
    }
    else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Endpoint not found' }));
    }

  } catch (error) {
    console.error('API Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal server error' }));
  }
};