// SaveUp Mobile App JavaScript
class SaveUpMobileApp {
    constructor() {
        this.currentScreen = 'login-screen';
        this.currentTab = 'friends';
        this.isAuthenticated = false;
        this.currentUser = null;
        this.userData = {
            totalSavings: 0,
            todayRoundUp: 0,
            currentStreak: 7,
            streakProgress: 70,
            coins: 0,
            totalCoinsEarned: 0,
            lastLoginDate: new Date().toISOString().split('T')[0],
            lastActivityDate: new Date().toISOString().split('T')[0],
            monthlyGoal: 1500,
            spendingCategories: {
                food: 250,
                transport: 180,
                shopping: 120,
                entertainment: 90,
                bills: 200,
                others: 160
            },
            recentActivity: [],
            leaderboard: {
                friends: [],
                college: [], 
                weekly: []
            },
            upiConnection: {
                isConnected: false,
                upiId: null,
                connectedAt: null,
                transactionCount: 0,
                monthlyVolume: 0
            },
            friends: [],
            achievements: [],
            weeklyChallenge: null,
            streakRewards: {
                lastStreakReward: 0,
                rewardsEarned: []
            },
            badges: [
                { id: 'bronze-streak', name: 'Bronze Streak', icon: 'trophy', color: 'bronze', earned: true },
                { id: 'silver-saver', name: 'Silver Saver', icon: 'shield-alt', color: 'silver', earned: true },
                { id: 'golden-achiever', name: 'Golden Achiever', icon: 'star', color: 'gold', earned: true },
                { id: 'platinum-master', name: 'Platinum Master', icon: 'star', color: 'gold', earned: true },
                { id: 'fire-streak', name: 'Fire Streak', icon: 'fire', color: 'orange', earned: true },
                { id: 'week-warrior', name: 'Week Warrior', icon: 'shield', color: 'purple', earned: false },
                { id: 'month-master', name: 'Month Master', icon: 'crown', color: 'gold', earned: false },
                { id: 'century-saver', name: 'Century Saver', icon: 'gem', color: 'diamond', earned: false },
                { id: 'mcher', name: 'Mcher', icon: 'star', color: 'gray', earned: false }
            ]
        };
        
        this.loadSavedData(); // Load saved data first
        this.initializeMockData(); // Initialize comprehensive mock data
        this.init();
        this.initializeTheme(); // Initialize theme from saved preference
        this.bindEvents();
        this.loadData();
    }

    // API Service Layer
    async apiCall(endpoint, method = 'GET', body = null) {
        try {
            const config = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
            };
            
            if (body) {
                config.body = JSON.stringify(body);
            }
            
            const response = await fetch(`/api${endpoint}`, config);
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API Error: ${response.status} - ${errorText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API Call failed:', endpoint, error);
            throw error;
        }
    }

    async createUser(userData) {
        return await this.apiCall('/users', 'POST', userData);
    }

    async loginUser(email) {
        return await this.apiCall('/users/login', 'POST', { email });
    }

    async getUserById(userId) {
        return await this.apiCall(`/users/${userId}`);
    }

    async updateUser(userId, updates) {
        return await this.apiCall(`/users/${userId}`, 'PUT', updates);
    }

    async createTransaction(transactionData) {
        return await this.apiCall('/transactions', 'POST', transactionData);
    }

    async getUserTransactions(userId, limit = 50) {
        return await this.apiCall(`/users/${userId}/transactions?limit=${limit}`);
    }

    async createChallenge(challengeData) {
        return await this.apiCall('/challenges', 'POST', challengeData);
    }

    async getUserChallenges(userId) {
        return await this.apiCall(`/users/${userId}/challenges`);
    }

    async updateChallenge(challengeId, updates) {
        return await this.apiCall(`/challenges/${challengeId}`, 'PUT', updates);
    }

    async createActivity(activityData) {
        return await this.apiCall('/activities', 'POST', activityData);
    }

    async getUserActivities(userId, limit = 20) {
        return await this.apiCall(`/users/${userId}/activities?limit=${limit}`);
    }

    async getUserBadges(userId) {
        return await this.apiCall(`/users/${userId}/badges`);
    }

    init() {
        // Check for existing authentication first
        this.checkAuthentication();
        
        // Show initial screen
        this.showScreen(this.currentScreen);
        this.updateNavigation();
    }

    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show target screen
        document.getElementById(screenId).classList.add('active');
        this.currentScreen = screenId;
        
        // Update screen-specific content
        if (screenId === 'badges-screen') {
            this.updateProfile();
        } else if (screenId === 'settings-screen') {
            this.loadSettingsPreferences();
        } else if (screenId === 'challenges-screen') {
            this.updateChallengesDisplay();
        }
    }

    bindEvents() {
        // Authentication Event Handlers
        this.bindAuthEvents();
        
        // Bottom Navigation - Add null checks
        const homeBtn = document.getElementById('home-btn');
        if (homeBtn) {
            homeBtn.addEventListener('click', () => {
                this.navigateToScreen('savings-screen', 'home-btn');
            });
        }
        
        const savingsNavBtn = document.getElementById('savings-nav-btn');
        if (savingsNavBtn) {
            savingsNavBtn.addEventListener('click', () => {
                this.navigateToScreen('leaderboard-screen', 'savings-nav-btn');
            });
        }
        
        const profileBtn = document.getElementById('profile-btn');
        if (profileBtn) {
            profileBtn.addEventListener('click', () => {
                this.navigateToScreen('badges-screen', 'profile-btn');
            });
        }

        // Back buttons - Add null checks
        const leaderboardBackBtn = document.getElementById('leaderboard-back-btn');
        if (leaderboardBackBtn) {
            leaderboardBackBtn.addEventListener('click', () => {
                this.navigateToScreen('savings-screen', 'home-btn');
            });
        }
        
        const badgesBackBtn = document.getElementById('badges-back-btn');
        if (badgesBackBtn) {
            badgesBackBtn.addEventListener('click', () => {
                this.navigateToScreen('savings-screen', 'home-btn');
            });
        }

        // Logout Button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }


        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.navigateToScreen('settings-screen');
            });
        }

        // Settings screen navigation
        const settingsBackBtn = document.getElementById('settings-back-btn');
        if (settingsBackBtn) {
            settingsBackBtn.addEventListener('click', () => {
                this.navigateToScreen('badges-screen', 'profile-btn');
            });
        }

        // Social Competition View All button
        const viewLeaderboardBtn = document.getElementById('view-leaderboard-btn');
        if (viewLeaderboardBtn) {
            viewLeaderboardBtn.addEventListener('click', () => {
                this.navigateToScreen('leaderboard-screen', 'savings-nav-btn');
                this.showToast('Opening full leaderboard...');
            });
        }

        // Monthly Goal Edit button
        const editMonthlyGoalBtn = document.getElementById('edit-monthly-goal-btn');
        if (editMonthlyGoalBtn) {
            editMonthlyGoalBtn.addEventListener('click', () => {
                this.showMonthlyGoalModal();
            });
        }

        // Theme Toggle button
        const themeToggleBtn = document.getElementById('theme-toggle');
        if (themeToggleBtn) {
            themeToggleBtn.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // Edit profile modal
        const editProfileBtn = document.getElementById('edit-profile-btn');
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', () => {
                this.openEditProfileModal();
            });
        }

        const closeEditProfileBtn = document.getElementById('close-edit-profile-btn');
        if (closeEditProfileBtn) {
            closeEditProfileBtn.addEventListener('click', () => {
                this.closeEditProfileModal();
            });
        }

        const cancelEditBtn = document.getElementById('cancel-edit-btn');
        if (cancelEditBtn) {
            cancelEditBtn.addEventListener('click', () => {
                this.closeEditProfileModal();
            });
        }

        const editProfileForm = document.getElementById('edit-profile-form');
        if (editProfileForm) {
            editProfileForm.addEventListener('submit', (e) => {
                this.handleEditProfile(e);
            });
        }

        // Settings toggles
        this.bindSettingsEvents();

        // Tab switching - Add null checks
        const friendsTab = document.getElementById('friends-tab');
        if (friendsTab) {
            friendsTab.addEventListener('click', () => {
                this.switchTab('friends');
            });
        }
        
        const collegeTab = document.getElementById('college-tab');
        if (collegeTab) {
            collegeTab.addEventListener('click', () => {
                this.switchTab('college');
            });
        }
        
        const weeklyTab = document.getElementById('weekly-tab');
        if (weeklyTab) {
            weeklyTab.addEventListener('click', () => {
                this.switchTab('weekly');
            });
        }

        // UPI Connection Events
        const connectUpiBtn = document.getElementById('connect-upi-btn');
        if (connectUpiBtn) {
            connectUpiBtn.addEventListener('click', () => {
                this.showUpiConnectionDialog();
            });
        }
        
        const changeUpiBtn = document.getElementById('change-upi-btn');
        if (changeUpiBtn) {
            changeUpiBtn.addEventListener('click', () => {
                this.showUpiConnectionDialog();
            });
        }
        
        const inviteFriendsBtn = document.getElementById('invite-friends-btn');
        if (inviteFriendsBtn) {
            inviteFriendsBtn.addEventListener('click', () => {
                this.showInviteFriendsDialog();
            });
        }

        // Challenge modal - Add null checks
        const startChallengeBtn = document.getElementById('start-challenge-btn');
        if (startChallengeBtn) {
            startChallengeBtn.addEventListener('click', () => {
                this.navigateToScreen('challenges-screen', 'challenges-nav-btn');
            });
        }

        // Challenges navigation
        const challengesNavBtn = document.getElementById('challenges-nav-btn');
        if (challengesNavBtn) {
            challengesNavBtn.addEventListener('click', () => {
                this.navigateToScreen('challenges-screen', 'challenges-nav-btn');
            });
        }

        const challengesBackBtn = document.getElementById('challenges-back-btn');
        if (challengesBackBtn) {
            challengesBackBtn.addEventListener('click', () => {
                this.navigateToScreen('savings-screen', 'home-btn');
            });
        }

        const addChallengeBtn = document.getElementById('add-challenge-btn');
        if (addChallengeBtn) {
            addChallengeBtn.addEventListener('click', () => {
                this.openModal('challenge-modal');
            });
        }

        // Challenge templates
        this.bindChallengeTemplates();
        
        const closeModalBtn = document.getElementById('close-modal-btn');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => {
                this.closeModal('challenge-modal');
            });
        }
        
        const cancelBtn = document.getElementById('cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.closeModal('challenge-modal');
            });
        }

        // Challenge form
        const challengeForm = document.getElementById('challenge-form');
        if (challengeForm) {
            challengeForm.addEventListener('submit', (e) => {
                this.handleChallengeSubmit(e);
            });
        }

        // Modal backdrop click
        const challengeModal = document.getElementById('challenge-modal');
        if (challengeModal) {
            challengeModal.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal')) {
                    this.closeModal('challenge-modal');
                }
            });
        }

        // Payment Action Buttons - Add null checks
        const payUpiBtn = document.getElementById('pay-upi-btn');
        if (payUpiBtn) {
            payUpiBtn.addEventListener('click', () => {
                this.navigateToScreen('upi-payment-screen', null);
            });
        }
        
        const scanQrBtn = document.getElementById('scan-qr-btn');
        if (scanQrBtn) {
            scanQrBtn.addEventListener('click', () => {
                this.navigateToScreen('qr-scanner-screen', null);
            });
        }
        
        const receiveMoneyBtn = document.getElementById('receive-money-btn');
        if (receiveMoneyBtn) {
            receiveMoneyBtn.addEventListener('click', () => {
                this.navigateToScreen('receive-money-screen', null);
            });
        }

        // Payment Screen Back Buttons - Add null checks
        const upiBackBtn = document.getElementById('upi-back-btn');
        if (upiBackBtn) {
            upiBackBtn.addEventListener('click', () => {
                this.navigateToScreen('savings-screen', 'home-btn');
            });
        }
        
        const qrBackBtn = document.getElementById('qr-back-btn');
        if (qrBackBtn) {
            qrBackBtn.addEventListener('click', () => {
                this.navigateToScreen('savings-screen', 'home-btn');
            });
        }
        
        const receiveBackBtn = document.getElementById('receive-back-btn');
        if (receiveBackBtn) {
            receiveBackBtn.addEventListener('click', () => {
                this.navigateToScreen('savings-screen', 'home-btn');
            });
        }
        
        const successBackBtn = document.getElementById('success-back-btn');
        if (successBackBtn) {
            successBackBtn.addEventListener('click', () => {
                this.navigateToScreen('savings-screen', 'home-btn');
            });
        }

        // UPI Payment Form - Add null checks
        const payNowBtn = document.getElementById('pay-now-btn');
        if (payNowBtn) {
            payNowBtn.addEventListener('click', (e) => {
                this.handleUPIPayment(e);
            });
        }

        // QR Scanner Actions - Add null checks
        const switchCameraBtn = document.getElementById('switch-camera-btn');
        if (switchCameraBtn) {
            switchCameraBtn.addEventListener('click', () => {
                this.switchCamera();
            });
        }
        
        const flashlightBtn = document.getElementById('flashlight-btn');
        if (flashlightBtn) {
            flashlightBtn.addEventListener('click', () => {
                this.toggleFlashlight();
            });
        }

        // Receive Money Actions - Add null checks
        const generateQrBtn = document.getElementById('generate-qr-btn');
        if (generateQrBtn) {
            generateQrBtn.addEventListener('click', () => {
                this.generatePaymentQR();
            });
        }
        
        const shareQrBtn = document.getElementById('share-qr-btn');
        if (shareQrBtn) {
            shareQrBtn.addEventListener('click', () => {
                this.shareUPIDetails();
            });
        }
        
        const recordPaymentBtn = document.getElementById('record-payment-btn');
        if (recordPaymentBtn) {
            recordPaymentBtn.addEventListener('click', () => {
                this.recordReceivedPayment();
            });
        }

        // Additional payment buttons - Add null checks
        const processPaymentBtn = document.getElementById('process-payment-btn');
        if (processPaymentBtn) {
            processPaymentBtn.addEventListener('click', () => {
                this.processScannedPayment();
            });
        }
        
        
        const backToHomeBtn = document.getElementById('back-to-home-btn');
        if (backToHomeBtn) {
            backToHomeBtn.addEventListener('click', () => {
                this.navigateToScreen('savings-screen', 'home-btn');
            });
        }
        
        const downloadQrBtn = document.getElementById('download-qr-btn');
        if (downloadQrBtn) {
            downloadQrBtn.addEventListener('click', () => {
                this.downloadQRCode();
            });
        }

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardNavigation(e);
        });

        // Real updates only happen during actual payments
        // this.startSimulatedUpdates(); // Removed - savings now update only on real transactions
    }

    // Navigation Methods
    navigateToScreen(screenId, activeNavBtn) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Stop QR scanner if leaving scanner screen
        if (this.currentScreen === 'qr-scanner-screen' && this.qrScanner) {
            this.stopQRScanner();
        }
        
        // Show target screen
        document.getElementById(screenId).classList.add('active');
        this.currentScreen = screenId;
        
        // Handle screen-specific initialization
        this.handleScreenEnter(screenId);
        
        // Update navigation
        this.updateNavigation(activeNavBtn);
        
        // Add animation
        document.getElementById(screenId).classList.add('fade-in');
        setTimeout(() => {
            document.getElementById(screenId).classList.remove('fade-in');
        }, 300);
    }
    
    handleScreenEnter(screenId) {
        switch (screenId) {
            case 'qr-scanner-screen':
                // Auto-start QR scanner
                setTimeout(() => {
                    this.initQRScanner();
                    this.startQRScanner();
                }, 500);
                break;
            case 'receive-money-screen':
                // Clear previous QR code
                const qrDisplay = document.querySelector('.qr-display');
                if (qrDisplay) {
                    qrDisplay.style.display = 'none';
                }
                break;
            case 'upi-payment-screen':
                // Focus first input
                setTimeout(() => {
                    document.getElementById('upi-id').focus();
                }, 300);
                break;
        }
    }

    updateNavigation(activeBtn = null) {
        // Hide/show bottom navigation based on current screen
        const bottomNav = document.querySelector('.bottom-nav');
        const isAuthScreen = this.currentScreen === 'login-screen' || this.currentScreen === 'signup-screen';
        
        if (bottomNav) {
            bottomNav.style.display = isAuthScreen ? 'none' : 'flex';
        }
        
        // Don't update nav buttons if on auth screens
        if (isAuthScreen) {
            return;
        }
        
        // Update bottom navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        if (activeBtn) {
            const btn = document.getElementById(activeBtn);
            if (btn) {
                btn.classList.add('active');
            }
        } else {
            // Set default active button based on current screen
            switch (this.currentScreen) {
                case 'savings-screen':
                    const homeBtn = document.getElementById('home-btn');
                    if (homeBtn) homeBtn.classList.add('active');
                    break;
                case 'leaderboard-screen':
                    const savingsBtn = document.getElementById('savings-nav-btn');
                    if (savingsBtn) savingsBtn.classList.add('active');
                    break;
                case 'badges-screen':
                    const profileBtn = document.getElementById('profile-btn');
                    if (profileBtn) profileBtn.classList.add('active');
                    break;
            }
        }
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');
        
        this.currentTab = tabName;
        this.updateLeaderboard();
        
        // Show notification
        this.showToast(`Switched to ${tabName} leaderboard`);
    }

    // Modal Methods
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Focus first input
        const firstInput = modal.querySelector('input');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('active');
        document.body.style.overflow = '';
        
        // Reset form
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
        }
    }

    // Data Methods
    loadData() {
        this.updateSavingsDisplay();
        this.updateRoundUpDisplay();
        this.updateStreakDisplay();
        this.updateMonthlyGoals();
        this.updateSpendingCategories();
        this.updateRecentActivity();
        this.updateSocialCompetition();
        this.updateLeaderboard();
        this.updateBadges();
        this.checkDailyStreakUpdate();
    }

    updateSavingsDisplay() {
        const savingsAmount = document.querySelector('.savings-amount');
        if (savingsAmount) {
            this.animateCountUp(savingsAmount, this.userData.totalSavings);
        }
    }

    updateRoundUpDisplay() {
        const roundUpText = document.querySelector('.round-up-text');
        if (roundUpText) {
            roundUpText.textContent = `I've rounded up ₹${this.userData.todayRoundUp} so far`;
        }
    }

    // Group transactions by date for session-based display
    groupTransactionsByDate(activities) {
        const sessions = {};
        
        activities.forEach(activity => {
            // Validate timestamp and handle invalid dates
            const validatedTimestamp = this.validateTimestamp(activity.timestamp);
            const date = validatedTimestamp.toDateString();
            
            if (!sessions[date]) {
                sessions[date] = {
                    date: date,
                    transactions: [],
                    total: 0,
                    roundUps: 0,
                    payments: 0
                };
            }
            
            // Validate and sanitize amount
            const amount = parseFloat(activity.amount) || 0;
            sessions[date].transactions.push({
                ...activity,
                timestamp: validatedTimestamp,
                amount: amount
            });
            sessions[date].total += amount;
            
            if (activity.type === 'round-up') {
                sessions[date].roundUps += amount;
            } else if (activity.type === 'payment') {
                sessions[date].payments += amount;
            }
        });
        
        // Convert to array and sort by date (newest first)
        return Object.values(sessions).sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    updateRecentActivity() {
        const activityList = document.querySelector('.activity-list');
        if (!activityList) return;
        
        activityList.innerHTML = '';
        
        // Group transactions into sessions
        const sessions = this.groupTransactionsByDate(this.userData.recentActivity);
        
        if (sessions.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.innerHTML = `
                <div class="empty-icon">💳</div>
                <h3>No transactions yet</h3>
                <p>Start making payments to see your transaction history here!</p>
            `;
            activityList.appendChild(emptyState);
            return;
        }

        // Display each session
        sessions.forEach((session, sessionIndex) => {
            const sessionElement = this.createTransactionSession(session, sessionIndex);
            activityList.appendChild(sessionElement);
        });
    }

    createTransactionSession(session, sessionIndex) {
        const sessionDiv = document.createElement('div');
        sessionDiv.className = 'transaction-session';
        
        const sessionHeader = document.createElement('div');
        sessionHeader.className = 'session-header';
        
        const sessionDate = document.createElement('div');
        sessionDate.className = 'session-date';
        sessionDate.textContent = this.formatSessionDate(session.date);
        
        const sessionTotal = document.createElement('div');
        sessionTotal.className = 'session-total';
        sessionTotal.textContent = `₹${session.total.toFixed(2)}`;
        
        sessionHeader.appendChild(sessionDate);
        sessionHeader.appendChild(sessionTotal);
        
        const transactionsList = document.createElement('div');
        transactionsList.className = 'transactions-list';
        
        // Add toggle functionality for session
        let isExpanded = sessionIndex === 0; // First session expanded by default
        
        if (!isExpanded) {
            transactionsList.style.display = 'none';
        }
        
        sessionHeader.style.cursor = 'pointer';
        sessionHeader.addEventListener('click', () => {
            isExpanded = !isExpanded;
            transactionsList.style.display = isExpanded ? 'block' : 'none';
            sessionHeader.classList.toggle('expanded', isExpanded);
        });
        
        // Create individual transaction items
        session.transactions.forEach(activity => {
            const transactionItem = this.createTransactionItem(activity);
            transactionsList.appendChild(transactionItem);
        });
        
        sessionDiv.appendChild(sessionHeader);
        sessionDiv.appendChild(transactionsList);
        
        return sessionDiv;
    }

    createTransactionItem(activity) {
        const transactionItem = document.createElement('div');
        transactionItem.className = 'transaction-item';
        
        const transactionDetails = document.createElement('div');
        transactionDetails.className = 'transaction-details';
        
        const transactionIcon = document.createElement('div');
        transactionIcon.className = `transaction-icon ${activity.type}`;
        
        // Set icon based on transaction type
        switch (activity.type) {
            case 'round-up':
                transactionIcon.innerHTML = '💰';
                break;
            case 'payment':
                transactionIcon.innerHTML = '💳';
                break;
            case 'received':
                transactionIcon.innerHTML = '📥';
                break;
            case 'challenge':
                transactionIcon.innerHTML = '🎯';
                break;
            case 'auto-save':
                transactionIcon.innerHTML = '💎';
                break;
            default:
                transactionIcon.innerHTML = '💰';
        }
        
        const transactionInfo = document.createElement('div');
        transactionInfo.className = 'transaction-info';
        
        const transactionTitle = document.createElement('h4');
        const transactionDescription = document.createElement('p');
        
        // Set transaction details based on type with XSS protection
        switch (activity.type) {
            case 'round-up':
                transactionTitle.textContent = 'Round Up Savings';
                transactionDescription.textContent = `From ₹${activity.originalAmount || activity.amount} transaction`;
                break;
            case 'auto-save':
                transactionTitle.textContent = 'Weekly Auto-Save';
                transactionDescription.textContent = 'Automated savings deposit';
                break;
            case 'payment':
                transactionTitle.textContent = 'Payment';
                transactionDescription.textContent = `To ${this.sanitizeText(activity.payee || 'merchant')}`;
                break;
            case 'received':
                transactionTitle.textContent = 'Payment Received';
                transactionDescription.textContent = 'Via QR code or UPI';
                break;
            case 'challenge':
                transactionTitle.textContent = 'Challenge Deposit';
                transactionDescription.textContent = this.sanitizeText(activity.description || 'Challenge savings goal');
                break;
            default:
                transactionTitle.textContent = 'Transaction';
                transactionDescription.textContent = this.sanitizeText(activity.description || 'Financial activity');
        }
        
        const timeStamp = document.createElement('small');
        timeStamp.textContent = this.formatTransactionTime(activity.timestamp);
        timeStamp.style.color = 'var(--text-secondary)';
        timeStamp.style.fontSize = '0.8rem';
        
        transactionInfo.appendChild(transactionTitle);
        transactionInfo.appendChild(transactionDescription);
        transactionInfo.appendChild(timeStamp);
        
        const transactionAmount = document.createElement('div');
        transactionAmount.className = `transaction-amount ${activity.type === 'received' ? 'positive' : 'negative'}`;
        transactionAmount.textContent = `${activity.type === 'received' ? '+' : ''}₹${activity.amount}`;
        
        transactionDetails.appendChild(transactionIcon);
        transactionDetails.appendChild(transactionInfo);
        
        transactionItem.appendChild(transactionDetails);
        transactionItem.appendChild(transactionAmount);
        
        return transactionItem;
    }

    formatSessionDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-IN', { 
                weekday: 'long', 
                month: 'short', 
                day: 'numeric' 
            });
        }
    }

    formatTransactionTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-IN', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
    }

    // Update Social Competition display
    updateSocialCompetition() {
        const friendsYourAmount = document.querySelector('.friends-comp .your-amount');
        const collegeYourAmount = document.querySelector('.college-comp .your-amount');
        const weeklyYourAmount = document.querySelector('.weekly-comp .your-amount');
        
        if (friendsYourAmount) friendsYourAmount.textContent = `₹${this.userData.totalSavings}`;
        if (collegeYourAmount) collegeYourAmount.textContent = `₹${this.userData.totalSavings}`;
        if (weeklyYourAmount) weeklyYourAmount.textContent = `₹${Math.round(this.userData.todayRoundUp * 7) || 156}`;
        
        // Update progress based on user's actual data
        const friendsProgress = document.querySelector('.friends-comp .progress-fill');
        const collegeProgress = document.querySelector('.college-comp .progress-fill');
        const weeklyProgress = document.querySelector('.weekly-comp .progress-fill');
        
        if (friendsProgress) {
            const friendsPercentage = Math.min(100, (this.userData.totalSavings / 800) * 100);
            friendsProgress.style.width = `${Math.max(50, friendsPercentage)}%`;
        }
        
        if (collegeProgress) {
            const collegePercentage = Math.min(100, (this.userData.totalSavings / 1245) * 100);
            collegeProgress.style.width = `${Math.max(40, collegePercentage)}%`;
        }
        
        if (weeklyProgress) {
            const weeklyAmount = Math.round(this.userData.todayRoundUp * 7) || 156;
            const weeklyPercentage = Math.max(75, Math.min(100, (weeklyAmount / 150) * 100));
            weeklyProgress.style.width = `${weeklyPercentage}%`;
        }

        // Update rank positions based on user performance
        const friendsRank = document.querySelector('.friends-comp .rank-position');
        const collegeRank = document.querySelector('.college-comp .rank-position');
        const weeklyRank = document.querySelector('.weekly-comp .rank-position');
        
        if (friendsRank) {
            const rank = this.userData.totalSavings > 700 ? '#1' : this.userData.totalSavings > 500 ? '#2' : '#3';
            friendsRank.textContent = `${rank} of 8`;
        }
        
        if (collegeRank) {
            const rank = this.userData.totalSavings > 1000 ? '#3' : this.userData.totalSavings > 500 ? '#5' : '#8';
            collegeRank.textContent = `${rank} of 24`;
        }
        
        if (weeklyRank) {
            weeklyRank.textContent = '#1 of 8';
        }
    }

    // Streak System Implementation
    updateStreakDisplay() {
        const streakCount = document.querySelector('.streak-count');
        const streakProgress = document.querySelector('.streak-progress-fill');
        const streakNext = document.querySelector('.streak-next');
        
        if (streakCount) {
            streakCount.textContent = this.userData.currentStreak;
        }
        
        if (streakProgress) {
            streakProgress.style.width = `${this.userData.streakProgress || 70}%`;
        }
        
        if (streakNext) {
            const nextMilestone = this.getNextStreakMilestone(this.userData.currentStreak);
            const daysToGo = nextMilestone - this.userData.currentStreak;
            streakNext.textContent = `${daysToGo} more days for bonus!`;
        }
    }

    getNextStreakMilestone(currentStreak) {
        const milestones = [7, 14, 30, 50, 100];
        return milestones.find(milestone => milestone > currentStreak) || currentStreak + 10;
    }

    checkDailyStreakUpdate() {
        const today = new Date().toISOString().split('T')[0];
        const lastLogin = this.userData.lastLoginDate;
        
        if (lastLogin !== today) {
            this.updateDailyStreak();
        }
    }

    updateDailyStreak() {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 24*60*60*1000).toISOString().split('T')[0];
        
        // Check if user logged in yesterday to maintain streak
        if (this.userData.lastLoginDate === yesterday) {
            this.userData.currentStreak += 1;
        } else if (this.userData.lastLoginDate !== today) {
            // Streak broken
            this.userData.currentStreak = 1;
        }
        
        this.userData.lastLoginDate = today;
        this.userData.streakProgress = ((this.userData.currentStreak % 10) * 10) || 100;
        
        // Check for streak achievements
        this.checkStreakAchievements();
        
        // Save data
        this.saveDataToLocalStorage();
        
        // Update display
        this.updateStreakDisplay();
    }

    checkStreakAchievements() {
        const streak = this.userData.currentStreak;
        const lastReward = this.userData.streakRewards.lastStreakReward;
        
        // Daily streak rewards (coins for maintaining streak)
        if (streak > lastReward) {
            const dailyCoins = Math.min(streak, 10); // Max 10 coins per day
            this.awardCoins(dailyCoins, `Daily streak reward: Day ${streak}`);
        }
        
        // Weekly achievement (7-day streak)
        if (streak >= 7 && !this.userData.badges.find(b => b.id === 'week-warrior')?.earned) {
            this.unlockAchievementWithRewards('week-warrior', 'Week Warrior', '7 day streak!', {
                coins: 50,
                benefits: ['Streak multiplier: 1.2x round-up savings', 'Priority customer support']
            });
        }
        
        // Monthly achievement (30-day streak)
        if (streak >= 30 && !this.userData.badges.find(b => b.id === 'month-master')?.earned) {
            this.unlockAchievementWithRewards('month-master', 'Month Master', '30 day streak!', {
                coins: 200,
                benefits: ['Streak multiplier: 1.5x round-up savings', '0.5% bonus interest on savings', 'Premium analytics dashboard']
            });
        }
        
        // Century achievement (100-day streak)
        if (streak >= 100 && !this.userData.badges.find(b => b.id === 'century-saver')?.earned) {
            this.unlockAchievementWithRewards('century-saver', 'Century Saver', '100 day streak!', {
                coins: 1000,
                benefits: ['Streak multiplier: 2x round-up savings', '1% bonus interest on savings', 'Exclusive investment opportunities', 'Personal financial advisor chat']
            });
        }
        
        // Special milestone rewards
        if (streak === 50 && lastReward < 50) {
            this.awardCoins(100, 'Halfway to Century milestone!');
            this.showToast('🎉 Halfway to Century! 100 coins bonus!', 'success');
        }
        
        if (streak === 75 && lastReward < 75) {
            this.awardCoins(150, '75-day streak milestone!');
            this.showToast('🔥 75 Days Strong! 150 coins bonus!', 'success');
        }
        
        // Update last reward streak
        this.userData.streakRewards.lastStreakReward = streak;
    }

    awardCoins(amount, reason) {
        this.userData.coins += amount;
        this.userData.totalCoinsEarned += amount;
        
        // Add to rewards history
        this.userData.streakRewards.rewardsEarned.push({
            type: 'coins',
            amount: amount,
            reason: reason,
            timestamp: new Date().toISOString()
        });
        
        // Save data
        this.saveDataToLocalStorage();
        
        console.log(`Awarded ${amount} coins: ${reason}. Total coins: ${this.userData.coins}`);
    }

    unlockAchievementWithRewards(id, name, description, rewards) {
        // Award coins first
        if (rewards.coins) {
            this.awardCoins(rewards.coins, `${name} achievement unlocked`);
        }
        
        // Add badge if not exists
        if (!this.userData.badges.find(b => b.id === id)) {
            this.userData.badges.push({
                id: id,
                name: name,
                icon: 'fire',
                color: 'gold',
                earned: true
            });
        } else {
            const badge = this.userData.badges.find(b => b.id === id);
            badge.earned = true;
        }
        
        // Store benefits
        this.userData.streakRewards.rewardsEarned.push({
            type: 'achievement',
            achievement: name,
            coins: rewards.coins,
            benefits: rewards.benefits,
            timestamp: new Date().toISOString()
        });
        
        // Show enhanced achievement notification
        this.showEnhancedAchievement(name, description, rewards);
        
        // Save data
        this.saveDataToLocalStorage();
    }

    unlockAchievement(id, name, description) {
        // Legacy method for basic achievements
        this.unlockAchievementWithRewards(id, name, description, { coins: 10, benefits: [] });
    }

    showEnhancedAchievement(title, description, rewards) {
        const notification = document.createElement('div');
        notification.className = 'enhanced-achievement-popup';
        
        const benefitsList = rewards.benefits ? 
            rewards.benefits.map(benefit => `<li><i class="fas fa-check"></i> ${benefit}</li>`).join('') : '';
        
        notification.innerHTML = `
            <div class="achievement-content">
                <div class="achievement-header">
                    <i class="fas fa-trophy achievement-icon"></i>
                    <h3>${title}</h3>
                    <p class="achievement-desc">${description}</p>
                </div>
                <div class="achievement-rewards">
                    ${rewards.coins ? `<div class="coin-reward"><i class="fas fa-coins"></i> +${rewards.coins} coins</div>` : ''}
                    ${benefitsList ? `<div class="benefits-list"><h4>Benefits Unlocked:</h4><ul>${benefitsList}</ul></div>` : ''}
                </div>
                <button class="claim-reward-btn" onclick="this.parentElement.parentElement.click()">Claim Rewards</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Click to dismiss
        notification.onclick = () => {
            notification.classList.remove('show');
            setTimeout(() => document.body.removeChild(notification), 300);
        };
        
        // Auto remove after 8 seconds (longer for enhanced)
        setTimeout(() => {
            if (document.body.contains(notification)) {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (document.body.contains(notification)) {
                        document.body.removeChild(notification);
                    }
                }, 300);
            }
        }, 8000);
    }

    showStreakAchievement(title, description) {
        // Legacy method - use enhanced version
        this.showEnhancedAchievement(title, description, { coins: 10, benefits: [] });
    }

    // Monthly Goals System
    updateMonthlyGoals() {
        const currentAmount = document.querySelector('.current-amount');
        const targetAmount = document.querySelector('.target-amount');
        const progressFill = document.querySelector('.goal-progress-fill');
        const progressText = document.querySelector('.progress-text');
        const daysRemaining = document.querySelector('.days-remaining');
        
        if (currentAmount) {
            currentAmount.textContent = `₹${this.userData.totalSavings}`;
        }
        
        if (targetAmount) {
            targetAmount.textContent = `₹${this.userData.monthlyGoal}`;
        }
        
        const percentage = Math.min(100, (this.userData.totalSavings / this.userData.monthlyGoal) * 100);
        
        if (progressFill) {
            progressFill.style.width = `${percentage}%`;
        }
        
        if (progressText) {
            progressText.textContent = `${Math.round(percentage)}% Complete`;
        }
        
        if (daysRemaining) {
            const today = new Date();
            const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            const daysLeft = Math.ceil((endOfMonth - today) / (1000 * 60 * 60 * 24));
            daysRemaining.textContent = `${daysLeft} days left`;
        }
    }

    showMonthlyGoalModal() {
        const modal = document.createElement('div');
        modal.className = 'goal-modal-overlay';
        modal.innerHTML = `
            <div class="goal-modal">
                <div class="goal-modal-header">
                    <h3>Set Monthly Goal</h3>
                    <button class="close-modal-btn">&times;</button>
                </div>
                <div class="goal-modal-content">
                    <p>How much would you like to save this month?</p>
                    <div class="goal-input-section">
                        <label>Monthly Savings Target</label>
                        <div class="goal-input-container">
                            <span class="currency-symbol">₹</span>
                            <input type="number" id="goal-amount-input" value="${this.userData.monthlyGoal}" min="100" max="50000" step="50">
                        </div>
                    </div>
                    <div class="goal-presets">
                        <span>Quick Select:</span>
                        <button class="preset-btn" data-amount="1000">₹1,000</button>
                        <button class="preset-btn" data-amount="2000">₹2,000</button>
                        <button class="preset-btn" data-amount="5000">₹5,000</button>
                    </div>
                </div>
                <div class="goal-modal-actions">
                    <button class="cancel-btn">Cancel</button>
                    <button class="save-goal-btn">Save Goal</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Event listeners
        modal.querySelector('.close-modal-btn').onclick = () => document.body.removeChild(modal);
        modal.querySelector('.cancel-btn').onclick = () => document.body.removeChild(modal);
        modal.onclick = (e) => {
            if (e.target === modal) document.body.removeChild(modal);
        };
        
        // Preset buttons
        modal.querySelectorAll('.preset-btn').forEach(btn => {
            btn.onclick = () => {
                const amount = parseInt(btn.dataset.amount);
                modal.querySelector('#goal-amount-input').value = amount;
            };
        });
        
        // Save button
        modal.querySelector('.save-goal-btn').onclick = () => {
            const newGoal = parseInt(modal.querySelector('#goal-amount-input').value);
            if (newGoal >= 100 && newGoal <= 50000) {
                this.userData.monthlyGoal = newGoal;
                this.updateMonthlyGoals();
                this.saveDataToLocalStorage();
                this.showToast(`Monthly goal updated to ₹${newGoal}!`, 'success');
                document.body.removeChild(modal);
            } else {
                this.showToast('Please enter a goal between ₹100 and ₹50,000', 'error');
            }
        };
        
        // Focus input
        setTimeout(() => modal.querySelector('#goal-amount-input').focus(), 100);
    }

    // Spending Categories System
    updateSpendingCategories() {
        const categories = Object.keys(this.userData.spendingCategories);
        const total = Object.values(this.userData.spendingCategories).reduce((sum, amount) => sum + amount, 0);
        
        categories.forEach((category, index) => {
            const amount = this.userData.spendingCategories[category];
            const percentage = Math.round((amount / total) * 100);
            
            const categoryElement = document.querySelectorAll('.category-item')[index];
            if (categoryElement) {
                const amountElement = categoryElement.querySelector('.category-amount');
                const percentageElement = categoryElement.querySelector('.category-percentage');
                
                if (amountElement) amountElement.textContent = `₹${amount}`;
                if (percentageElement) percentageElement.textContent = `${percentage}%`;
            }
        });
    }

    // Auto-categorize transaction based on keywords and patterns
    categorizeTransaction(description, amount, payee) {
        const keywords = {
            food: ['restaurant', 'cafe', 'swiggy', 'zomato', 'food', 'dining', 'mcdonalds', 'kfc', 'pizza', 'burger'],
            transport: ['uber', 'ola', 'metro', 'bus', 'taxi', 'petrol', 'fuel', 'parking', 'auto'],
            shopping: ['amazon', 'flipkart', 'myntra', 'shopping', 'mall', 'store', 'shop', 'market'],
            entertainment: ['movie', 'cinema', 'netflix', 'spotify', 'gaming', 'party', 'concert', 'show'],
            bills: ['electricity', 'water', 'gas', 'mobile', 'broadband', 'wifi', 'internet', 'recharge', 'bill'],
            others: []
        };
        
        const text = (description + ' ' + payee).toLowerCase();
        
        for (const [category, keywordList] of Object.entries(keywords)) {
            if (category === 'others') continue;
            
            for (const keyword of keywordList) {
                if (text.includes(keyword)) {
                    return category;
                }
            }
        }
        
        return 'others';
    }

    // Update spending category when new transaction is added
    addToSpendingCategory(category, amount) {
        if (this.userData.spendingCategories[category] !== undefined) {
            this.userData.spendingCategories[category] += amount;
        } else {
            this.userData.spendingCategories.others += amount;
        }
        
        // Update display
        this.updateSpendingCategories();
        
        // Save data
        this.saveDataToLocalStorage();
    }

    updateRecentActivityOld() {
        const activityList = document.querySelector('.activity-list');
        if (!activityList) return;
        
        activityList.innerHTML = '';
        
        this.userData.recentActivity.forEach((activity, index) => {
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';
            activityItem.style.cursor = 'pointer';
            
            let activityText = '';
            switch (activity.type) {
                case 'round-up':
                    activityText = `₹${activity.amount} Round up`;
                    break;
                case 'auto-save':
                    activityText = `₹${activity.amount} Weekly auto-save`;
                    break;
                case 'payment':
                    activityText = `₹${activity.amount} Payment to ${activity.payee || 'merchant'}`;
                    break;
                case 'received':
                    activityText = `₹${activity.amount} Payment received`;
                    break;
                case 'challenge':
                    activityText = `₹${activity.amount} Challenge started`;
                    break;
                default:
                    activityText = `₹${activity.amount} ${activity.type}`;
            }
            
            activityItem.innerHTML = `
                <div class="activity-icon ${activity.icon}">
                    <i class="fas fa-${activity.icon}"></i>
                </div>
                <span class="activity-text">${activityText}</span>
                ${activity.timestamp ? `<span class="activity-time">${this.formatTimeAgo(activity.timestamp)}</span>` : ''}
            `;
            
            // Add click handler to show payment details
            activityItem.addEventListener('click', () => {
                this.showPaymentDetails(activity, index);
            });
            
            activityList.appendChild(activityItem);
        });
    }
    
    formatTimeAgo(timestamp) {
        const now = new Date();
        const activityTime = new Date(timestamp);
        const diffMs = now - activityTime;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 30) return `${diffDays}d ago`;
        return activityTime.toLocaleDateString();
    }

    updateLeaderboard() {
        const leaderboardList = document.querySelector('.leaderboard-list');
        if (!leaderboardList) return;
        
        // Update UPI connection status
        this.updateUpiConnectionStatus();
        
        // Update leaderboard stats
        this.updateLeaderboardStats();
        
        // Add session filters if not already present
        this.addLeaderboardSessionFilters();
        
        // Get and sort current data
        const currentData = this.getLeaderboardData(this.currentTab);
        leaderboardList.innerHTML = '';
        
        if (currentData.length === 0) {
            leaderboardList.innerHTML = `
                <div class="empty-leaderboard">
                    <i class="fas fa-users"></i>
                    <h3>No ${this.currentTab} data yet</h3>
                    <p>${this.currentTab === 'friends' ? 'Connect your UPI and invite friends to start competing!' : 'Start making transactions to see weekly rankings!'}</p>
                </div>
            `;
            return;
        }
        
        currentData.forEach((user, index) => {
            const userItem = this.createEnhancedLeaderboardItem(user, index, currentData.length);
            leaderboardList.appendChild(userItem);
        });
    }

    addLeaderboardSessionFilters() {
        const leaderboardScreen = document.getElementById('leaderboard-screen');
        if (!leaderboardScreen) return;
        
        // Check if filters already exist
        let filtersContainer = leaderboardScreen.querySelector('.session-filters');
        if (filtersContainer) return;
        
        // Create filters container
        filtersContainer = document.createElement('div');
        filtersContainer.className = 'session-filters';
        
        const filters = [
            { id: 'today', label: 'Today', active: true },
            { id: 'week', label: 'This Week' },
            { id: 'month', label: 'This Month' },
            { id: 'all', label: 'All Time' }
        ];
        
        filters.forEach(filter => {
            const filterBtn = document.createElement('button');
            filterBtn.className = `filter-btn ${filter.active ? 'active' : ''}`;
            filterBtn.textContent = filter.label;
            filterBtn.dataset.filter = filter.id;
            
            filterBtn.addEventListener('click', () => {
                // Update active filter
                filtersContainer.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
                filterBtn.classList.add('active');
                
                // Update leaderboard with filter
                this.currentFilter = filter.id;
                this.updateLeaderboard();
                this.showToast(`Showing ${filter.label.toLowerCase()} leaderboard`);
            });
            
            filtersContainer.appendChild(filterBtn);
        });
        
        // Insert filters after leaderboard header
        const leaderboardHeader = leaderboardScreen.querySelector('.leaderboard-header');
        if (leaderboardHeader) {
            leaderboardHeader.insertAdjacentElement('afterend', filtersContainer);
        }
        
        // Initialize current filter
        this.currentFilter = 'today';
    }

    createEnhancedLeaderboardItem(user, index, totalUsers) {
        const userItem = document.createElement('div');
        userItem.className = 'leaderboard-item';
        
        // Enhanced rank badge with colors
        const rankElement = document.createElement('div');
        rankElement.className = 'leaderboard-rank';
        
        let rankBadge = '';
        if (index === 0) {
            rankBadge = '<div class="rank-badge first">1</div>';
        } else if (index === 1) {
            rankBadge = '<div class="rank-badge second">2</div>';
        } else if (index === 2) {
            rankBadge = '<div class="rank-badge third">3</div>';
        } else {
            rankBadge = `<div class="rank-badge other">${index + 1}</div>`;
        }
        
        rankElement.innerHTML = rankBadge;
        
        // User avatar with enhanced styling
        const userAvatar = document.createElement('div');
        userAvatar.className = `user-avatar ${user.name.toLowerCase()}`;
        userAvatar.innerHTML = `
            <img src="data:image/svg+xml;base64,${this.generateAvatar(user.name, index)}" alt="${user.name}">
            ${user.isYou ? '<div class="you-badge">You</div>' : ''}
        `;
        
        // Enhanced user info with transaction sessions
        const userInfo = document.createElement('div');
        userInfo.className = 'user-info';
        
        const userName = document.createElement('span');
        userName.className = 'user-name';
        userName.textContent = `${user.name}${user.isYou ? ' (You)' : ''}`;
        
        const userStats = document.createElement('span');
        userStats.className = 'user-stats';
        userStats.textContent = `${user.transactionCount || 0} transactions • ${user.streak || 0} day streak`;
        
        // Add progress bar showing relative performance
        const userProgress = document.createElement('div');
        userProgress.className = 'user-progress';
        
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        
        const progressFill = document.createElement('div');
        progressFill.className = 'progress-fill';
        
        // Calculate progress percentage relative to top performer
        const maxAmount = Math.max(...this.getLeaderboardData(this.currentTab).map(u => u.amount));
        const progressPercent = maxAmount > 0 ? (user.amount / maxAmount) * 100 : 0;
        progressFill.style.width = `${progressPercent}%`;
        
        progressBar.appendChild(progressFill);
        userProgress.appendChild(progressBar);
        
        userInfo.appendChild(userName);
        userInfo.appendChild(userStats);
        userInfo.appendChild(userProgress);
        
        // Enhanced user score with animations
        const userScore = document.createElement('div');
        userScore.className = 'user-score';
        
        const userAmount = document.createElement('div');
        userAmount.className = 'user-amount';
        userAmount.textContent = `₹${user.amount}`;
        
        const scoreChange = document.createElement('div');
        scoreChange.className = `score-change ${user.change >= 0 ? 'positive' : 'negative'}`;
        scoreChange.textContent = `${user.change >= 0 ? '+' : ''}${user.change || 0}`;
        
        userScore.appendChild(userAmount);
        userScore.appendChild(scoreChange);
        
        // Assemble the item
        userItem.appendChild(rankElement);
        userItem.appendChild(userAvatar);
        userItem.appendChild(userInfo);
        userItem.appendChild(userScore);
        
        // Enhanced click handler with transaction session details
        userItem.addEventListener('click', () => {
            this.showEnhancedUserProfile(user, index);
        });
        
        return userItem;
    }

    showEnhancedUserProfile(user, rank) {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.id = 'user-profile-modal';
        
        // Create sessions data for this user (simulated)
        const userSessions = this.generateUserTransactionSessions(user);
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${user.name}'s Profile</h2>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="profile-summary">
                        <div class="profile-rank">Rank #${rank + 1}</div>
                        <div class="profile-amount">₹${user.amount}</div>
                        <div class="profile-stats">
                            <span>${user.transactionCount || 0} transactions</span>
                            <span>${user.streak || 0} day streak</span>
                        </div>
                    </div>
                    
                    <div class="profile-sessions">
                        <h3>Recent Transaction Sessions</h3>
                        <div class="sessions-list">
                            ${userSessions.map(session => `
                                <div class="session-summary">
                                    <div class="session-info">
                                        <strong>${session.date}</strong>
                                        <span>${session.transactions} transactions</span>
                                    </div>
                                    <div class="session-amount">₹${session.amount}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    ${!user.isYou ? `
                        <div class="profile-actions">
                            <button class="action-btn challenge-btn" onclick="saveUpApp.sendMoneyToFriend('${user.name}')">
                                💸 Send Money
                            </button>
                            <button class="action-btn challenge-btn" onclick="saveUpApp.challengeFriend('${user.name}')">
                                🎯 Challenge
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        // Add close functionality
        const closeBtn = modal.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => {
            modal.remove();
            document.body.style.overflow = '';
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                document.body.style.overflow = '';
            }
        });
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
    }

    generateUserTransactionSessions(user) {
        // Generate realistic transaction sessions for the user
        const sessions = [];
        const dates = ['Today', 'Yesterday', '2 days ago', '3 days ago', '4 days ago'];
        
        dates.forEach((date, index) => {
            if (Math.random() > 0.3) { // 70% chance of having transactions on any given day
                const transactionCount = Math.floor(Math.random() * 5) + 1;
                const amount = Math.floor(Math.random() * 200) + 50;
                
                sessions.push({
                    date: date,
                    transactions: transactionCount,
                    amount: amount
                });
            }
        });
        
        return sessions;
    }

    // Security: Text sanitization methods to prevent XSS
    sanitizeText(text) {
        if (!text || typeof text !== 'string') return '';
        return text.replace(/[<>&"']/g, function(match) {
            const escape = {
                '<': '&lt;',
                '>': '&gt;',
                '&': '&amp;',
                '"': '&quot;',
                "'": '&#x27;'
            };
            return escape[match];
        });
    }

    sanitizeForCSS(text) {
        if (!text || typeof text !== 'string') return '';
        return text.toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    // Safe DOM creation helper
    createElementSafe(tag, className, textContent) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (textContent) element.textContent = this.sanitizeText(textContent);
        return element;
    }

    // Enhanced timestamp validation
    validateTimestamp(timestamp) {
        if (!timestamp) return new Date();
        const date = new Date(timestamp);
        return isNaN(date.getTime()) ? new Date() : date;
    }
    
    getLeaderboardData(tab) {
        switch(tab) {
            case 'friends':
                return this.userData.friends.sort((a, b) => b.amount - a.amount);
            case 'college':
                return this.userData.leaderboard.college.sort((a, b) => b.amount - a.amount);
            case 'weekly':
                return this.generateWeeklyLeaderboard();
            default:
                return [];
        }
    }
    
    generateWeeklyLeaderboard() {
        // Generate weekly leaderboard based on recent transactions
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const weeklyData = this.userData.friends.map(friend => {
            const weeklyAmount = this.calculateWeeklyVolume(friend, weekAgo);
            return {
                ...friend,
                amount: weeklyAmount,
                change: weeklyAmount - (friend.lastWeekAmount || 0)
            };
        }).filter(user => user.amount > 0);
        
        return weeklyData.sort((a, b) => b.amount - a.amount);
    }
    
    calculateWeeklyVolume(user, weekAgo) {
        // Calculate weekly transaction volume for a user
        // Use the user's lastWeekAmount and current amount to simulate weekly progress
        if (user.lastWeekAmount !== undefined) {
            return Math.max(0, user.amount - user.lastWeekAmount);
        }
        
        // Fallback calculation based on transaction count and average daily savings
        const dailyAverage = user.amount / 30; // Assume 30 days of data
        return Math.round(dailyAverage * 7); // Weekly amount
    }
    
    updateUpiConnectionStatus() {
        const upiStatus = document.getElementById('upi-status');
        const connectedUpi = document.getElementById('connected-upi');
        const connectedUpiId = document.getElementById('connected-upi-id');
        
        if (this.userData.upiConnection.isConnected) {
            upiStatus.style.display = 'none';
            connectedUpi.style.display = 'block';
            if (connectedUpiId) {
                connectedUpiId.textContent = this.userData.upiConnection.upiId;
            }
        } else {
            upiStatus.style.display = 'block';
            connectedUpi.style.display = 'none';
        }
    }
    
    updateLeaderboardStats() {
        // Update your rank
        const yourRank = document.getElementById('your-rank');
        if (yourRank) {
            const rank = this.getUserRank();
            yourRank.textContent = rank > 0 ? `#${rank}` : '-';
        }
        
        // Update friends count
        const totalFriends = document.getElementById('total-friends');
        if (totalFriends) {
            totalFriends.textContent = this.userData.friends.length;
        }
        
        // Update monthly volume
        const monthlyVolume = document.getElementById('monthly-volume');
        if (monthlyVolume) {
            monthlyVolume.textContent = `₹${this.userData.upiConnection.monthlyVolume || 0}`;
        }
    }
    
    getUserRank() {
        const currentData = this.getLeaderboardData(this.currentTab);
        const yourEntry = currentData.find(user => user.isYou);
        return yourEntry ? currentData.indexOf(yourEntry) + 1 : 0;
    }
    
    showUpiConnectionDialog() {
        // Create UPI connection dialog
        const modal = document.createElement('div');
        modal.className = 'upi-connection-modal';
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-link"></i> Connect Your UPI Account</h3>
                        <button class="modal-close-btn" onclick="this.closest('.upi-connection-modal').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <p class="connection-info">Connect your UPI account to track transactions and compete with friends in real-time!</p>
                        
                        <form id="upi-connection-form">
                            <div class="form-group">
                                <label for="upi-id-input">Your UPI ID</label>
                                <input type="text" id="upi-id-input" placeholder="yourname@paytm" value="${this.userData.upiConnection.upiId || ''}" required>
                                <small>Enter your primary UPI ID for transaction tracking</small>
                            </div>
                            
                            <div class="form-group">
                                <label for="display-name">Display Name</label>
                                <input type="text" id="display-name" placeholder="Your Name" required>
                                <small>This name will be shown to friends in the leaderboard</small>
                            </div>
                            
                            <div class="connection-benefits">
                                <h4>Benefits of connecting:</h4>
                                <ul>
                                    <li><i class="fas fa-chart-line"></i> Track your transaction patterns</li>
                                    <li><i class="fas fa-users"></i> Compete with friends</li>
                                    <li><i class="fas fa-trophy"></i> Earn achievement badges</li>
                                    <li><i class="fas fa-target"></i> Set and achieve savings goals</li>
                                </ul>
                            </div>
                            
                            <div class="form-actions">
                                <button type="button" class="btn-secondary" onclick="this.closest('.upi-connection-modal').remove()">Cancel</button>
                                <button type="submit" class="btn-primary">
                                    <i class="fas fa-link"></i>
                                    ${this.userData.upiConnection.isConnected ? 'Update Connection' : 'Connect UPI'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Handle form submission
        const form = modal.querySelector('#upi-connection-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.connectUpiAccount(modal);
        });
        
        // Focus on UPI ID input
        modal.querySelector('#upi-id-input').focus();
    }
    
    connectUpiAccount(modal) {
        const upiId = modal.querySelector('#upi-id-input').value.trim();
        const displayName = modal.querySelector('#display-name').value.trim();
        
        if (!upiId || !displayName) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }
        
        if (!this.validateUPIId(upiId)) {
            this.showToast('Please enter a valid UPI ID', 'error');
            return;
        }
        
        // Update UPI connection data
        this.userData.upiConnection = {
            isConnected: true,
            upiId: upiId,
            displayName: displayName,
            connectedAt: new Date(),
            transactionCount: 0,
            monthlyVolume: 0
        };
        
        // Add yourself to friends list if not already there
        const existingUser = this.userData.friends.find(friend => friend.isYou);
        if (!existingUser) {
            this.userData.friends.push({
                name: displayName,
                amount: this.userData.totalSavings || 0,
                upiId: upiId,
                isYou: true,
                transactionCount: 0,
                streak: this.userData.currentStreak || 0,
                weeklyTransactions: [],
                achievements: this.userData.achievements || []
            });
        } else {
            // Update existing user data
            existingUser.name = displayName;
            existingUser.upiId = upiId;
        }
        
        // Save data
        this.saveDataToLocalStorage();
        
        // Update UI
        this.updateLeaderboard();
        
        // Close modal and show success
        modal.remove();
        this.showToast(`UPI account connected successfully!`, 'success');
        
        // Track this event
        this.trackAchievement('upi_connected');
    }
    
    showInviteFriendsDialog() {
        const modal = document.createElement('div');
        modal.className = 'invite-friends-modal';
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-user-plus"></i> Invite Friends</h3>
                        <button class="modal-close-btn" onclick="this.closest('.invite-friends-modal').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="invite-options">
                            <div class="invite-option">
                                <div class="invite-icon">
                                    <i class="fas fa-share"></i>
                                </div>
                                <div class="invite-content">
                                    <h4>Share Invite Link</h4>
                                    <p>Send your unique invite link to friends</p>
                                </div>
                                <button class="btn-primary" onclick="window.saveupApp.shareInviteLink()">Share Link</button>
                            </div>
                            
                            <div class="invite-option">
                                <div class="invite-icon">
                                    <i class="fas fa-qrcode"></i>
                                </div>
                                <div class="invite-content">
                                    <h4>QR Code Invite</h4>
                                    <p>Let friends scan your QR code to connect</p>
                                </div>
                                <button class="btn-primary" onclick="window.saveupApp.generateInviteQR()">Show QR</button>
                            </div>
                            
                            <div class="invite-option">
                                <div class="invite-icon">
                                    <i class="fas fa-envelope"></i>
                                </div>
                                <div class="invite-content">
                                    <h4>Direct Invite</h4>
                                    <p>Add friends by their UPI ID directly</p>
                                </div>
                                <button class="btn-primary" onclick="window.saveupApp.showDirectInvite()">Add Friend</button>
                            </div>
                        </div>
                        
                        <div class="current-friends">
                            <h4>Current Friends (${this.userData.friends.filter(f => !f.isYou).length})</h4>
                            <div class="friends-list">
                                ${this.userData.friends.filter(f => !f.isYou).map(friend => `
                                    <div class="friend-item">
                                        <div class="friend-avatar">
                                            <img src="data:image/svg+xml;base64,${this.generateAvatar(friend.name, 0)}" alt="${friend.name}">
                                        </div>
                                        <span class="friend-name">${friend.name}</span>
                                        <span class="friend-status">₹${friend.amount}</span>
                                    </div>
                                `).join('') || '<p class="no-friends">No friends connected yet</p>'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    shareInviteLink() {
        const inviteLink = `${window.location.origin}?invite=${this.userData.upiConnection.upiId}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Join me on SaveUp!',
                text: 'Let\'s compete in saving money together on SaveUp!',
                url: inviteLink
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(inviteLink).then(() => {
                this.showToast('Invite link copied to clipboard!', 'success');
            }).catch(() => {
                // Show link in a text area for manual copying
                const modal = document.createElement('div');
                modal.className = 'share-link-modal';
                modal.innerHTML = `
                    <div class="modal-overlay">
                        <div class="modal-content">
                            <h3>Share Your Invite Link</h3>
                            <textarea readonly onclick="this.select()">${inviteLink}</textarea>
                            <button class="btn-primary" onclick="this.closest('.share-link-modal').remove()">Done</button>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);
            });
        }
    }
    
    showUserProfile(user, rank) {
        const modal = document.createElement('div');
        modal.className = 'user-profile-modal';
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <button class="modal-close-btn" onclick="this.closest('.user-profile-modal').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="profile-header">
                            <div class="profile-avatar">
                                <img src="data:image/svg+xml;base64,${this.generateAvatar(user.name, rank)}" alt="${user.name}">
                                ${rank < 3 ? `<div class="rank-badge-large">${['🥇', '🥈', '🥉'][rank]}</div>` : ''}
                            </div>
                            <h2>${user.name}${user.isYou ? ' (You)' : ''}</h2>
                            <p class="profile-rank">Rank #${rank + 1} • ₹${user.amount} total</p>
                        </div>
                        
                        <div class="profile-stats">
                            <div class="stat-item">
                                <div class="stat-value">${user.transactionCount || 0}</div>
                                <div class="stat-label">Transactions</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">${user.streak || 0}</div>
                                <div class="stat-label">Day Streak</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">${user.achievements?.length || 0}</div>
                                <div class="stat-label">Achievements</div>
                            </div>
                        </div>
                        
                        ${!user.isYou ? `
                            <div class="profile-actions">
                                <button class="btn-primary" onclick="window.saveupApp.challengeFriend('${user.upiId}')">
                                    <i class="fas fa-trophy"></i> Challenge
                                </button>
                                <button class="btn-secondary" onclick="window.saveupApp.sendMoney('${user.upiId}')">
                                    <i class="fas fa-paper-plane"></i> Send Money
                                </button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    trackAchievement(achievementId) {
        // Track achievements and unlock badges
        if (!this.userData.achievements.includes(achievementId)) {
            this.userData.achievements.push(achievementId);
            
            // Show achievement notification
            const achievements = {
                'upi_connected': { name: 'Connected!', icon: 'link', message: 'You connected your UPI account!' },
                'first_friend': { name: 'Social Saver!', icon: 'users', message: 'You added your first friend!' },
                'week_leader': { name: 'Week Champion!', icon: 'crown', message: 'You\'re #1 this week!' }
            };
            
            const achievement = achievements[achievementId];
            if (achievement) {
                setTimeout(() => {
                    this.showAchievementNotification(achievement);
                }, 1000);
            }
        }
    }
    
    showAchievementNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-content">
                <div class="achievement-icon">
                    <i class="fas fa-${achievement.icon}"></i>
                </div>
                <div class="achievement-text">
                    <h4>Achievement Unlocked!</h4>
                    <h3>${achievement.name}</h3>
                    <p>${achievement.message}</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 4 seconds
        setTimeout(() => {
            notification.remove();
        }, 4000);
        
        // Add click to dismiss
        notification.addEventListener('click', () => {
            notification.remove();
        });
    }
    
    validateUPIId(upiId) {
        // UPI ID format: username@bank
        const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
        return upiRegex.test(upiId);
    }
    
    generateInviteQR() {
        const inviteLink = `${window.location.origin}?invite=${this.userData.upiConnection.upiId}`;
        
        const modal = document.createElement('div');
        modal.className = 'qr-invite-modal';
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-qrcode"></i> Your Invite QR Code</h3>
                        <button class="modal-close-btn" onclick="this.closest('.qr-invite-modal').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="qr-container" id="invite-qr-container">
                            <div class="qr-loading">Generating QR code...</div>
                        </div>
                        <p class="qr-instructions">Friends can scan this QR code to connect with you on SaveUp!</p>
                        <div class="invite-actions">
                            <button class="btn-secondary" onclick="window.saveupApp.shareInviteLink()">Share Link Instead</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Generate QR code
        setTimeout(() => {
            const qrContainer = modal.querySelector('#invite-qr-container');
            qrContainer.innerHTML = '';
            
            if (typeof window.QRCode !== 'undefined') {
                const qrCode = new window.QRCode(qrContainer, {
                    text: inviteLink,
                    width: 200,
                    height: 200,
                    colorDark: "#000000",
                    colorLight: "#ffffff"
                });
            } else {
                qrContainer.innerHTML = `
                    <div class="qr-fallback">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>QR code generation unavailable</p>
                        <button class="btn-primary" onclick="window.saveupApp.shareInviteLink()">Share Link</button>
                    </div>
                `;
            }
        }, 100);
    }
    
    showDirectInvite() {
        const modal = document.createElement('div');
        modal.className = 'direct-invite-modal';
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-user-plus"></i> Add Friend Directly</h3>
                        <button class="modal-close-btn" onclick="this.closest('.direct-invite-modal').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="direct-invite-form">
                            <div class="form-group">
                                <label for="friend-upi-id">Friend's UPI ID</label>
                                <input type="text" id="friend-upi-id" placeholder="friend@bank" required>
                                <small>Enter your friend's UPI ID to connect</small>
                            </div>
                            
                            <div class="form-group">
                                <label for="friend-name">Friend's Name</label>
                                <input type="text" id="friend-name" placeholder="Friend's Name" required>
                                <small>This name will appear in your leaderboard</small>
                            </div>
                            
                            <div class="form-actions">
                                <button type="button" class="btn-secondary" onclick="this.closest('.direct-invite-modal').remove()">Cancel</button>
                                <button type="submit" class="btn-primary">
                                    <i class="fas fa-user-plus"></i>
                                    Add Friend
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Handle form submission
        const form = modal.querySelector('#direct-invite-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addFriendDirectly(modal);
        });
    }
    
    addFriendDirectly(modal) {
        const upiId = modal.querySelector('#friend-upi-id').value.trim();
        const name = modal.querySelector('#friend-name').value.trim();
        
        if (!upiId || !name) {
            this.showToast('Please fill in all fields', 'error');
            return;
        }
        
        if (!this.validateUPIId(upiId)) {
            this.showToast('Please enter a valid UPI ID', 'error');
            return;
        }
        
        // Check if friend already exists
        const existingFriend = this.userData.friends.find(f => f.upiId === upiId);
        if (existingFriend) {
            this.showToast('This friend is already in your list!', 'error');
            return;
        }
        
        // Add friend to list
        this.userData.friends.push({
            name: name,
            upiId: upiId,
            amount: Math.floor(Math.random() * 1000), // Random starting amount for demo
            transactionCount: Math.floor(Math.random() * 20),
            streak: Math.floor(Math.random() * 15),
            weeklyTransactions: [],
            achievements: [],
            change: Math.floor(Math.random() * 200) - 100,
            isYou: false
        });
        
        // Save and update
        this.saveDataToLocalStorage();
        this.updateLeaderboard();
        
        // Track achievement if this is first friend
        if (this.userData.friends.filter(f => !f.isYou).length === 1) {
            this.trackAchievement('first_friend');
        }
        
        modal.remove();
        this.showToast(`${name} added to your friends list!`, 'success');
    }
    
    challengeFriend(friendUpiId) {
        const friend = this.userData.friends.find(f => f.upiId === friendUpiId);
        if (!friend) {
            this.showToast('Friend not found!', 'error');
            return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'challenge-friend-modal';
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-trophy"></i> Challenge ${friend.name}</h3>
                        <button class="modal-close-btn" onclick="this.closest('.challenge-friend-modal').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="challenge-info">
                            <p>Challenge ${friend.name} to a savings competition!</p>
                        </div>
                        
                        <form id="challenge-form">
                            <div class="form-group">
                                <label for="challenge-type">Challenge Type</label>
                                <select id="challenge-type" required>
                                    <option value="weekly">Weekly Savings Challenge</option>
                                    <option value="monthly">Monthly Savings Challenge</option>
                                    <option value="transaction">Transaction Count Challenge</option>
                                    <option value="streak">Streak Challenge</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="challenge-target">Target Amount (₹)</label>
                                <input type="number" id="challenge-target" placeholder="1000" min="100" max="10000" required>
                                <small>Set a savings target for the challenge</small>
                            </div>
                            
                            <div class="form-group">
                                <label for="challenge-duration">Duration (days)</label>
                                <input type="number" id="challenge-duration" placeholder="7" min="1" max="30" required>
                                <small>How long should this challenge last?</small>
                            </div>
                            
                            <div class="form-actions">
                                <button type="button" class="btn-secondary" onclick="this.closest('.challenge-friend-modal').remove()">Cancel</button>
                                <button type="submit" class="btn-primary">
                                    <i class="fas fa-trophy"></i>
                                    Send Challenge
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Handle form submission
        const form = modal.querySelector('#challenge-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendChallenge(modal, friend);
        });
    }
    
    async sendChallenge(modal, friend) {
        const challengeType = modal.querySelector('#challenge-type').value;
        const target = parseInt(modal.querySelector('#challenge-target').value);
        const duration = parseInt(modal.querySelector('#challenge-duration').value);
        
        if (!target || !duration) {
            this.showToast('Please fill in all fields', 'error');
            return;
        }
        
        // Create challenge record
        const challenge = {
            id: Date.now().toString(),
            type: challengeType,
            target: target,
            duration: duration,
            friendName: friend.name,
            friendUpiId: friend.upiId,
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString(),
            status: 'pending',
            currentAmount: 0,
            progress: 0
        };
        
        // Add to challenges list
        if (!this.userData.challenges) {
            this.userData.challenges = [];
        }
        this.userData.challenges.push(challenge);
        
        // Save challenge to database if user is logged in
        try {
            if (this.currentUser && this.currentUser.id) {
                await this.createChallenge({
                    userId: this.currentUser.id,
                    type: challengeType,
                    target: target,
                    duration: duration,
                    friendName: friend.name,
                    friendUpiId: friend.upiId,
                    status: 'pending'
                });
                
                console.log('Challenge saved to database:', challenge);
            }
        } catch (error) {
            console.warn('Failed to save challenge to database:', error);
        }
        
        // Save data to database and localStorage
        await this.saveData();
        
        // Close modal and show success
        modal.remove();
        this.showToast(`Challenge sent to ${friend.name}!`, 'success');
        
        // Track achievement
        this.trackAchievement('challenge_sent');
    }
    
    sendMoney(friendUpiId) {
        const friend = this.userData.friends.find(f => f.upiId === friendUpiId);
        if (!friend) {
            this.showToast('Friend not found!', 'error');
            return;
        }
        
        const modal = document.createElement('div');
        modal.className = 'send-money-modal';
        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-paper-plane"></i> Send Money to ${friend.name}</h3>
                        <button class="modal-close-btn" onclick="this.closest('.send-money-modal').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="send-money-info">
                            <div class="friend-preview">
                                <div class="friend-avatar">
                                    <img src="data:image/svg+xml;base64,${this.generateAvatar(friend.name, 0)}" alt="${friend.name}">
                                </div>
                                <div class="friend-details">
                                    <h4>${friend.name}</h4>
                                    <p>${friend.upiId}</p>
                                </div>
                            </div>
                        </div>
                        
                        <form id="send-money-form">
                            <div class="form-group">
                                <label for="money-amount">Amount (₹)</label>
                                <input type="number" id="money-amount" placeholder="100" min="1" max="50000" required>
                                <small>Enter the amount you want to send</small>
                            </div>
                            
                            <div class="form-group">
                                <label for="money-note">Note (optional)</label>
                                <input type="text" id="money-note" placeholder="Thanks for lunch!" maxlength="100">
                                <small>Add a note for your friend</small>
                            </div>
                            
                            <div class="quick-amounts">
                                <h4>Quick Amounts</h4>
                                <div class="amount-buttons">
                                    <button type="button" class="amount-btn" onclick="document.getElementById('money-amount').value=50">₹50</button>
                                    <button type="button" class="amount-btn" onclick="document.getElementById('money-amount').value=100">₹100</button>
                                    <button type="button" class="amount-btn" onclick="document.getElementById('money-amount').value=500">₹500</button>
                                    <button type="button" class="amount-btn" onclick="document.getElementById('money-amount').value=1000">₹1000</button>
                                </div>
                            </div>
                            
                            <div class="form-actions">
                                <button type="button" class="btn-secondary" onclick="this.closest('.send-money-modal').remove()">Cancel</button>
                                <button type="submit" class="btn-primary">
                                    <i class="fas fa-paper-plane"></i>
                                    Send ₹<span id="send-amount-display">0</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Update send button amount display
        const amountInput = modal.querySelector('#money-amount');
        const amountDisplay = modal.querySelector('#send-amount-display');
        amountInput.addEventListener('input', () => {
            amountDisplay.textContent = amountInput.value || '0';
        });
        
        // Handle form submission
        const form = modal.querySelector('#send-money-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.processSendMoney(modal, friend);
        });
    }
    
    async processSendMoney(modal, friend) {
        const amount = parseInt(modal.querySelector('#money-amount').value);
        const note = modal.querySelector('#money-note').value.trim();
        
        if (!amount || amount <= 0) {
            this.showToast('Please enter a valid amount', 'error');
            return;
        }
        
        if (amount > this.userData.totalSavings) {
            this.showToast('Insufficient savings balance!', 'error');
            return;
        }
        
        // Process the transaction
        this.userData.totalSavings -= amount;
        
        // Add to recent activity
        this.userData.recentActivity.unshift({
            type: 'transfer',
            amount: amount,
            payee: friend.name,
            note: note,
            timestamp: new Date().toISOString(),
            icon: 'paper-plane'
        });
        
        // Update transaction tracking
        await this.trackTransaction(amount, 'transfer', `Money sent to ${friend.name}`);
        
        // Update UI
        this.updateSavingsDisplay();
        this.updateRecentActivity();
        
        // Save data to database and localStorage
        await this.saveData();
        
        // Close modal and show success
        modal.remove();
        this.showToast(`₹${amount} sent to ${friend.name} successfully!`, 'success');
        
        // Track achievement
        if (!this.userData.achievements.includes('money_sender')) {
            this.trackAchievement('money_sender');
        }
    }
    

    updateBadges() {
        // Badges are already in HTML, but we could update them dynamically here
        // For now, they match the reference design
    }

    updateProfile() {
        // Update user profile display with actual user data
        if (this.currentUser) {
            const profileName = document.getElementById('profile-name');
            const profileEmail = document.getElementById('profile-email');
            const memberSince = document.getElementById('member-since');
            const totalSavingsStat = document.getElementById('total-savings-stat');
            const currentStreakStat = document.getElementById('current-streak-stat');
            const badgesCountStat = document.getElementById('badges-count-stat');
            const roundupTotalStat = document.getElementById('roundup-total-stat');

            if (profileName) profileName.textContent = this.currentUser.name;
            if (profileEmail) profileEmail.textContent = this.currentUser.email;
            if (memberSince) memberSince.textContent = this.currentUser.memberSince || '2025';
            if (totalSavingsStat) totalSavingsStat.textContent = `₹${this.userData.totalSavings}`;
            if (currentStreakStat) currentStreakStat.textContent = this.userData.currentStreak;
            if (badgesCountStat) badgesCountStat.textContent = this.getUserBadgeCount();
            if (roundupTotalStat) roundupTotalStat.textContent = `₹${this.userData.todayRoundUp}`;
        }
    }

    getUserBadgeCount() {
        // Count earned badges
        const earnedBadges = document.querySelectorAll('.badge-item.earned');
        return earnedBadges.length;
    }

    calculateRoundUp(amount) {
        // Calculate round-up amount to nearest 5 multiples with minimum round-up
        const nearestFive = Math.ceil(amount / 5) * 5;
        const roundUpAmount = nearestFive - amount;
        
        // Return round-up amount (0 if already a multiple of 5)
        return parseFloat(roundUpAmount.toFixed(2));
    }

    // Edit Profile Methods
    openEditProfileModal() {
        const modal = document.getElementById('edit-profile-modal');
        if (modal && this.currentUser) {
            // Populate form with current user data
            document.getElementById('edit-name').value = this.currentUser.name || '';
            document.getElementById('edit-email').value = this.currentUser.email || '';
            document.getElementById('edit-phone').value = this.currentUser.phone || '';
            
            modal.classList.add('active');
        }
    }

    closeEditProfileModal() {
        const modal = document.getElementById('edit-profile-modal');
        if (modal) {
            modal.classList.remove('active');
            // Reset form
            document.getElementById('edit-profile-form').reset();
        }
    }

    handleEditProfile(e) {
        e.preventDefault();
        
        const name = document.getElementById('edit-name').value.trim();
        const email = document.getElementById('edit-email').value.trim();
        const phone = document.getElementById('edit-phone').value.trim();

        // Validation
        if (name.length < 2) {
            this.showToast('Name must be at least 2 characters', 'error');
            return;
        }

        if (!this.validateEmail(email)) {
            this.showToast('Please enter a valid email address', 'error');
            return;
        }

        // Check if email is already taken by another user
        const registeredUsers = JSON.parse(localStorage.getItem('saveup-registered-users') || '[]');
        const emailExists = registeredUsers.find(u => u.email === email && u.email !== this.currentUser.email);
        
        if (emailExists) {
            this.showToast('Email already taken by another user', 'error');
            return;
        }

        // Update current user
        this.currentUser.name = name;
        this.currentUser.email = email;
        this.currentUser.phone = phone;

        // Update in registered users array
        const userIndex = registeredUsers.findIndex(u => u.email === this.currentUser.email);
        if (userIndex !== -1) {
            registeredUsers[userIndex] = { ...registeredUsers[userIndex], ...this.currentUser };
            localStorage.setItem('saveup-registered-users', JSON.stringify(registeredUsers));
        }
        
        // Update current session
        localStorage.setItem('saveup-user', JSON.stringify(this.currentUser));

        // Update profile display
        this.updateProfile();

        // Close modal and show success
        this.closeEditProfileModal();
        this.showToast('Profile updated successfully!', 'success');
    }

    // Settings Methods
    bindSettingsEvents() {
        // Settings toggles
        const settingsToggles = [
            'push-notifications',
            'roundup-notifications', 
            'show-leaderboard',
            'data-analytics'
        ];

        settingsToggles.forEach(toggleId => {
            const toggle = document.getElementById(toggleId);
            if (toggle) {
                // Load saved setting
                const savedValue = localStorage.getItem(`setting-${toggleId}`);
                if (savedValue !== null) {
                    toggle.checked = savedValue === 'true';
                }

                toggle.addEventListener('change', () => {
                    this.handleSettingToggle(toggleId, toggle.checked);
                });
            }
        });

        // Clickable settings
        const themeSettingBtn = document.getElementById('theme-setting');
        if (themeSettingBtn) {
            themeSettingBtn.addEventListener('click', () => {
                this.showToast('Theme options coming soon!', 'info');
            });
        }

        const currencySettingBtn = document.getElementById('currency-setting');
        if (currencySettingBtn) {
            currencySettingBtn.addEventListener('click', () => {
                this.showToast('Currency options coming soon!', 'info');
            });
        }

        const changePasswordBtn = document.getElementById('change-password-setting');
        if (changePasswordBtn) {
            changePasswordBtn.addEventListener('click', () => {
                this.showToast('Change password feature coming soon!', 'info');
            });
        }

        const deleteAccountBtn = document.getElementById('delete-account-setting');
        if (deleteAccountBtn) {
            deleteAccountBtn.addEventListener('click', () => {
                this.handleDeleteAccount();
            });
        }
    }

    handleSettingToggle(settingId, isEnabled) {
        // Save setting to localStorage
        localStorage.setItem(`setting-${settingId}`, isEnabled.toString());

        // Provide feedback for specific settings
        switch (settingId) {
            case 'push-notifications':
                this.showToast(isEnabled ? 'Push notifications enabled' : 'Push notifications disabled', 'info');
                break;
            case 'roundup-notifications':
                this.showToast(isEnabled ? 'Round-up notifications enabled' : 'Round-up notifications disabled', 'info');
                break;
            case 'show-leaderboard':
                this.showToast(isEnabled ? 'Visible on leaderboard' : 'Hidden from leaderboard', 'info');
                break;
            case 'data-analytics':
                this.showToast(isEnabled ? 'Analytics enabled' : 'Analytics disabled', 'info');
                break;
        }
    }

    handleDeleteAccount() {
        if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
            if (confirm('This will permanently delete all your data. Are you absolutely sure?')) {
                // Remove user from registered users
                const registeredUsers = JSON.parse(localStorage.getItem('saveup-registered-users') || '[]');
                const updatedUsers = registeredUsers.filter(u => u.email !== this.currentUser.email);
                localStorage.setItem('saveup-registered-users', JSON.stringify(updatedUsers));

                // Clear all user data and logout
                this.logout();
                this.showToast('Account deleted successfully', 'success');
            }
        }
    }

    loadSettingsPreferences() {
        // Load all saved settings when entering settings screen
        const settingsToggles = [
            'push-notifications',
            'roundup-notifications', 
            'show-leaderboard',
            'data-analytics'
        ];

        settingsToggles.forEach(toggleId => {
            const toggle = document.getElementById(toggleId);
            if (toggle) {
                const savedValue = localStorage.getItem(`setting-${toggleId}`);
                if (savedValue !== null) {
                    toggle.checked = savedValue === 'true';
                }
            }
        });
    }

    // Challenge Methods
    handleChallengeSubmit(e) {
        e.preventDefault();
        
        const goal = document.getElementById('challenge-goal').value;
        const amount = document.getElementById('challenge-amount').value;
        const duration = document.getElementById('challenge-duration').value;
        
        if (!goal || !amount || !duration) {
            this.showToast('Please fill in all fields', 'error');
            return;
        }
        
        // Create new challenge
        const newChallenge = {
            id: Date.now().toString(),
            goal: goal,
            targetAmount: parseInt(amount),
            currentAmount: 0,
            duration: parseInt(duration),
            startDate: new Date().toISOString(),
            status: 'active',
            progress: 0
        };
        
        // Initialize challenges array if it doesn't exist
        if (!this.userData.challenges) {
            this.userData.challenges = [];
        }
        
        this.userData.challenges.unshift(newChallenge);
        
        this.showToast(`Challenge "${goal}" created successfully!`, 'success');
        this.closeModal('challenge-modal');
        
        // Add to recent activity
        this.userData.recentActivity.unshift({
            type: 'challenge',
            amount: parseInt(amount),
            icon: 'trophy',
            timestamp: new Date().toISOString()
        });
        
        this.updateRecentActivity();
        this.updateChallengesDisplay();
        this.saveData();
        
        // Clear form
        document.getElementById('challenge-form').reset();
    }

    bindChallengeTemplates() {
        const templates = document.querySelectorAll('.template-card');
        templates.forEach(template => {
            template.addEventListener('click', () => {
                const goal = template.dataset.goal;
                const amount = template.dataset.amount;
                const duration = template.dataset.duration;
                
                // Pre-fill challenge form with null checks
                const goalInput = document.getElementById('challenge-goal');
                const amountInput = document.getElementById('challenge-amount');
                const durationInput = document.getElementById('challenge-duration');
                
                if (goalInput) goalInput.value = goal;
                if (amountInput) amountInput.value = amount;
                if (durationInput) durationInput.value = duration;
                
                // Open challenge modal
                this.openModal('challenge-modal');
                
                // Add animation feedback
                template.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    template.style.transform = '';
                }, 150);
            });
        });
    }

    updateChallengesDisplay() {
        if (!this.userData.challenges) {
            this.userData.challenges = [];
        }
        
        this.renderActiveChallenges();
        this.renderCompletedChallenges();
    }

    renderActiveChallenges() {
        const container = document.getElementById('active-challenges');
        if (!container) return;
        
        const activeChallenges = this.userData.challenges.filter(c => c.status === 'active');
        
        if (activeChallenges.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-trophy"></i>
                    </div>
                    <h3>No Active Challenges</h3>
                    <p>Start a challenge to reach your savings goals!</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = activeChallenges.map(challenge => {
            const progress = Math.min((challenge.currentAmount / challenge.targetAmount) * 100, 100);
            const daysLeft = this.calculateDaysLeft(challenge.startDate, challenge.duration);
            
            return `
                <div class="challenge-card" data-challenge-id="${challenge.id}">
                    <div class="challenge-header">
                        <h3 class="challenge-title">${challenge.goal}</h3>
                        <span class="challenge-status active">Active</span>
                    </div>
                    <div class="challenge-progress">
                        <div class="progress-info">
                            <span class="progress-amount">₹${challenge.currentAmount.toLocaleString()} / ₹${challenge.targetAmount.toLocaleString()}</span>
                            <span class="progress-percentage">${Math.round(progress)}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                    </div>
                    <div class="challenge-meta">
                        <div class="challenge-duration">
                            <i class="fas fa-calendar-alt"></i>
                            <span>${daysLeft} days left</span>
                        </div>
                        <div class="challenge-target">₹${challenge.targetAmount.toLocaleString()}</div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Add click handlers for challenge cards
        container.querySelectorAll('.challenge-card').forEach(card => {
            card.addEventListener('click', () => {
                const challengeId = card.dataset.challengeId;
                this.showChallengeDetails(challengeId);
            });
        });
    }

    renderCompletedChallenges() {
        const container = document.getElementById('completed-challenges');
        if (!container) return;
        
        const completedChallenges = this.userData.challenges.filter(c => c.status === 'completed');
        
        if (completedChallenges.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-medal"></i>
                    </div>
                    <h3>No Completed Challenges</h3>
                    <p>Complete challenges to see them here!</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = completedChallenges.map(challenge => {
            return `
                <div class="challenge-card completed">
                    <div class="challenge-header">
                        <h3 class="challenge-title">${challenge.goal}</h3>
                        <span class="challenge-status completed">Completed</span>
                    </div>
                    <div class="challenge-progress">
                        <div class="progress-info">
                            <span class="progress-amount">₹${challenge.targetAmount.toLocaleString()}</span>
                            <span class="progress-percentage">100%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 100%"></div>
                        </div>
                    </div>
                    <div class="challenge-meta">
                        <div class="challenge-duration">
                            <i class="fas fa-check-circle"></i>
                            <span>Completed</span>
                        </div>
                        <div class="challenge-target">₹${challenge.targetAmount.toLocaleString()}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    calculateDaysLeft(startDate, duration) {
        const start = new Date(startDate);
        const end = new Date(start.getTime() + duration * 24 * 60 * 60 * 1000);
        const now = new Date();
        const diffTime = end - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(0, diffDays);
    }

    showChallengeDetails(challengeId) {
        const challenge = this.userData.challenges.find(c => c.id === challengeId);
        if (!challenge) return;
        
        // Show challenge details or edit modal
        this.showToast(`Challenge: ${challenge.goal} - ${Math.round((challenge.currentAmount / challenge.targetAmount) * 100)}% complete`, 'info');
    }

    // Animation Methods
    animateCountUp(element, target) {
        const start = 0;
        const duration = 1000;
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const current = Math.floor(start + (target - start) * progress);
            element.textContent = `₹${current}`;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    // Utility Methods
    generateAvatar(name, index) {
        const colors = ['#4B7688', '#AD62A8', '#5478C0', '#4CAF50', '#FF9800'];
        const color = colors[index % colors.length];
        
        const svg = `
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="20" r="20" fill="${color}"/>
                <circle cx="20" cy="16" r="6" fill="white"/>
                <path d="M10 30C10 26 13 24 20 24S30 26 30 30" stroke="white" stroke-width="3" fill="none"/>
            </svg>
        `;
        
        return btoa(svg);
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        // Style the toast
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#F44336' : '#2196F3'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            z-index: 300;
            animation: toastSlideIn 0.3s ease-out;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        document.body.appendChild(toast);
        
        // Auto remove
        setTimeout(() => {
            toast.style.animation = 'toastSlideOut 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Removed startSimulatedUpdates - savings now update only during real payment transactions

    // Initialize comprehensive mock data for the app
    initializeMockData() {
        // Check if we should use mock data (fallback when no real data available)
        const shouldUseMockData = !this.isAuthenticated || !this.currentUser;
        
        if (shouldUseMockData) {
            this.setupMockUserData();
            this.setupMockTransactionData();
            this.setupMockFriendsData();
            this.setupMockCollegeLeaderboard();
            this.setupMockRecentActivity();
        }
    }

    setupMockUserData() {
        // Only set mock data for missing values - preserve saved data
        if (this.userData.totalSavings === undefined || this.userData.totalSavings === 0) {
            this.userData.totalSavings = 2847.50;
        }
        if (this.userData.todayRoundUp === undefined) {
            this.userData.todayRoundUp = 23.75;
        }
        if (this.userData.currentStreak === undefined || this.userData.currentStreak === 7) {
            this.userData.currentStreak = 12;
        }
        
        // Only update UPI connection if not already connected or configured
        if (!this.userData.upiConnection || !this.userData.upiConnection.isConnected) {
            this.userData.upiConnection = {
                isConnected: true,
                upiId: 'yourname@paytm',
                connectedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
                transactionCount: 47,
                monthlyVolume: 8542.30,
                ...this.userData.upiConnection // Preserve any existing settings
            };
        }
        
        // Initialize coins/points system for streaks if not present
        if (this.userData.coins === undefined) {
            this.userData.coins = 150; // Starting coins based on current streak
        }
        if (this.userData.totalCoinsEarned === undefined) {
            this.userData.totalCoinsEarned = 150;
        }
        if (this.userData.streakRewards === undefined) {
            this.userData.streakRewards = {
                lastStreakReward: this.userData.currentStreak || 0,
                rewardsEarned: []
            };
        }
        
        console.log('Mock user data setup completed, preserving saved values');
    }

    setupMockFriendsData() {
        this.userData.friends = [
            { 
                name: 'You', 
                amount: 2847.50, 
                change: 125, 
                isYou: true,
                streak: 12,
                transactionCount: 47,
                lastWeekAmount: 2722.50,
                avatar: 'user',
                joinedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            },
            { 
                name: 'Priya Sharma', 
                amount: 3124.75, 
                change: 89, 
                isYou: false,
                streak: 15,
                transactionCount: 52,
                lastWeekAmount: 3035.75,
                avatar: 'priya',
                joinedDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)
            },
            { 
                name: 'Rahul Kumar', 
                amount: 2976.30, 
                change: 156, 
                isYou: false,
                streak: 8,
                transactionCount: 41,
                lastWeekAmount: 2820.30,
                avatar: 'rahul',
                joinedDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000)
            },
            { 
                name: 'Anita Desai', 
                amount: 2654.80, 
                change: 67, 
                isYou: false,
                streak: 10,
                transactionCount: 38,
                lastWeekAmount: 2587.80,
                avatar: 'anita',
                joinedDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
            },
            { 
                name: 'Vikram Singh', 
                amount: 2401.25, 
                change: -23, 
                isYou: false,
                streak: 5,
                transactionCount: 35,
                lastWeekAmount: 2424.25,
                avatar: 'vikram',
                joinedDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
            },
            { 
                name: 'Sanya Patel', 
                amount: 2198.60, 
                change: 178, 
                isYou: false,
                streak: 18,
                transactionCount: 44,
                lastWeekAmount: 2020.60,
                avatar: 'sanya',
                joinedDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000)
            }
        ];
    }

    setupMockCollegeLeaderboard() {
        this.userData.leaderboard.college = [
            { name: 'Priya Sharma', amount: 3124.75, change: 89, year: '3rd Year', course: 'Computer Science' },
            { name: 'Rahul Kumar', amount: 2976.30, change: 156, year: '2nd Year', course: 'Electronics' },
            { name: 'You', amount: 2847.50, change: 125, isYou: true, year: '3rd Year', course: 'Information Technology' },
            { name: 'Anita Desai', amount: 2654.80, change: 67, year: '4th Year', course: 'Mechanical' },
            { name: 'Arjun Mehta', amount: 2543.20, change: 92, year: '1st Year', course: 'Civil Engineering' },
            { name: 'Neha Agarwal', amount: 2401.90, change: 134, year: '2nd Year', course: 'Computer Science' },
            { name: 'Vikram Singh', amount: 2401.25, change: -23, year: '3rd Year', course: 'Electrical' },
            { name: 'Kavya Reddy', amount: 2356.45, change: 78, year: '4th Year', course: 'Information Technology' },
            { name: 'Sanya Patel', amount: 2198.60, change: 178, year: '1st Year', course: 'Computer Science' },
            { name: 'Rohit Verma', amount: 2087.30, change: 45, year: '2nd Year', course: 'Electronics' }
        ];
    }

    setupMockTransactionData() {
        // Create mock transaction history
        this.mockTransactions = [
            {
                id: 1,
                type: 'round-up',
                amount: 3.50,
                originalAmount: 176.50,
                roundUpAmount: 3.50,
                payee: 'Coffee Bean Cafe',
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
                status: 'completed'
            },
            {
                id: 2,
                type: 'payment',
                amount: 250.00,
                payee: 'Grocery Store',
                upiId: 'grocery@paytm',
                timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
                status: 'completed'
            },
            {
                id: 3,
                type: 'received',
                amount: 150.00,
                payee: 'Friend Payment',
                upiId: 'friend@phonepe',
                timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
                status: 'completed'
            },
            {
                id: 4,
                type: 'round-up',
                amount: 2.25,
                originalAmount: 97.75,
                roundUpAmount: 2.25,
                payee: 'Bus Ticket',
                timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
                status: 'completed'
            },
            {
                id: 5,
                type: 'auto-save',
                amount: 500.00,
                payee: 'Weekly Auto-Save',
                timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
                status: 'completed'
            }
        ];
    }

    setupMockRecentActivity() {
        this.userData.recentActivity = this.mockTransactions.map(transaction => ({
            type: transaction.type,
            amount: transaction.amount,
            payee: transaction.payee,
            timestamp: transaction.timestamp,
            icon: this.getActivityIcon(transaction.type)
        }));
    }

    getActivityIcon(type) {
        const iconMap = {
            'round-up': 'coins',
            'payment': 'arrow-up',
            'received': 'arrow-down',
            'auto-save': 'piggy-bank',
            'challenge': 'trophy'
        };
        return iconMap[type] || 'exchange-alt';
    }

    updateUserLeaderboardData(amount, transactionType) {
        // Update the current user's data in the friends leaderboard
        const userEntry = this.userData.friends.find(friend => friend.isYou);
        if (userEntry) {
            userEntry.amount = parseFloat(this.userData.totalSavings);
            userEntry.transactionCount = this.userData.upiConnection.transactionCount;
            userEntry.streak = this.userData.currentStreak;
            
            // Calculate change from previous week
            if (userEntry.lastWeekAmount !== undefined) {
                userEntry.change = userEntry.amount - userEntry.lastWeekAmount;
            }
        }
        
        // Update college leaderboard data
        const collegeEntry = this.userData.leaderboard.college.find(student => student.isYou);
        if (collegeEntry) {
            collegeEntry.amount = parseFloat(this.userData.totalSavings);
            collegeEntry.change = amount; // Recent change
        }
        
        // Sort friends leaderboard after update
        this.userData.friends.sort((a, b) => b.amount - a.amount);
        this.userData.leaderboard.college.sort((a, b) => b.amount - a.amount);
    }

    // CRITICAL: Restored trackTransaction method for comprehensive transaction tracking
    async trackTransaction(amount, transactionType, description) {
        console.log(`trackTransaction called: amount=${amount}, type=${transactionType}, description=${description}`);
        
        // Update UPI connection stats
        this.userData.upiConnection.transactionCount += 1;
        this.userData.upiConnection.monthlyVolume = parseFloat((this.userData.upiConnection.monthlyVolume + amount).toFixed(2));
        
        // Update user entry in friends leaderboard with weekly transaction tracking
        const userEntry = this.userData.friends.find(friend => friend.isYou);
        if (userEntry) {
            // Initialize weeklyTransactions if not exists
            if (!userEntry.weeklyTransactions) {
                userEntry.weeklyTransactions = [];
            }
            
            // Add transaction to weekly tracking
            const now = new Date();
            const transaction = {
                amount: amount,
                type: transactionType,
                timestamp: now.toISOString(),
                description: description
            };
            userEntry.weeklyTransactions.push(transaction);
            
            // Keep only last 7 days of transactions for performance
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            userEntry.weeklyTransactions = userEntry.weeklyTransactions.filter(
                tx => new Date(tx.timestamp) > oneWeekAgo
            );
            
            // Update transaction count for leaderboard display
            userEntry.transactionCount = this.userData.upiConnection.transactionCount;
        }
        
        // Create database transaction record if user is logged in
        try {
            if (this.currentUser && this.currentUser.id) {
                await this.createTransaction({
                    userId: this.currentUser.id,
                    type: transactionType,
                    amount: amount,
                    description: description,
                    status: 'completed'
                });
                
                await this.createActivity({
                    userId: this.currentUser.id,
                    type: transactionType,
                    amount: amount,
                    description: description,
                    icon: this.getActivityIcon(transactionType)
                });
                
                console.log(`Transaction ${transactionType} saved to database: ₹${amount}`);
            }
        } catch (error) {
            console.warn('Failed to save transaction to database:', error);
        }
        
        // Update leaderboard data to reflect new transaction
        this.updateUserLeaderboardData(amount, transactionType);
        
        // Update UI displays
        this.updateLeaderboard();
        this.updateUpiConnectionStatus();
        
        // Save data to localStorage and database
        await this.saveData();
        
        console.log(`Transaction tracking completed: Total transactions=${this.userData.upiConnection.transactionCount}, Monthly volume=₹${this.userData.upiConnection.monthlyVolume}`);
    }

    // Load saved data from localStorage during initialization
    loadSavedData() {
        try {
            // Try to load general app data first
            const generalData = localStorage.getItem('saveup-general-data');
            if (generalData) {
                const parsedData = JSON.parse(generalData);
                // Merge with existing userData, preserving loaded data
                this.userData = { ...this.userData, ...parsedData };
                console.log('Loaded general data from localStorage:', parsedData);
            }
            
            // If user is authenticated, load user-specific data
            const currentUserEmail = localStorage.getItem('saveup-current-user-email');
            if (currentUserEmail) {
                const userDataKey = `saveup-data-${currentUserEmail}`;
                const userData = localStorage.getItem(userDataKey);
                if (userData) {
                    const parsedUserData = JSON.parse(userData);
                    // Merge with existing userData, giving priority to saved data
                    this.userData = { ...this.userData, ...parsedUserData };
                    console.log('Loaded user-specific data from localStorage:', parsedUserData);
                }
            }
        } catch (error) {
            console.warn('Failed to load saved data from localStorage:', error);
        }
    }

    async loadUserData() {
        // Load user-specific data after login using API
        if (this.currentUser && this.currentUser.id) {
            try {
                // Fetch user data from API
                const userData = await this.getUserById(this.currentUser.id);
                if (userData) {
                    // Update userData with values from database
                    this.userData.totalSavings = parseFloat(userData.totalSavings) || 0;
                    this.userData.todayRoundUp = parseFloat(userData.todayRoundUp) || 0;
                    this.userData.currentStreak = userData.currentStreak || 0;
                }
                
                // Fetch user's recent transactions and activities
                try {
                    const transactions = await this.getUserTransactions(this.currentUser.id, 10);
                    const activities = await this.getUserActivities(this.currentUser.id, 10);
                    
                    // Convert transactions to recent activity format
                    this.userData.recentActivity = activities.map(activity => ({
                        type: activity.type,
                        amount: parseFloat(activity.amount) || 0,
                        description: activity.description,
                        icon: activity.icon,
                        timestamp: activity.createdAt
                    }));
                } catch (activityError) {
                    console.warn('Failed to load activities:', activityError);
                    // Keep existing recentActivity or set empty
                    this.userData.recentActivity = [];
                }
                
            } catch (error) {
                console.warn('Failed to load user data from API, falling back to localStorage:', error);
                
                // Fallback to localStorage
                try {
                    const userDataKey = `saveup-data-${this.currentUser.email}`;
                    const savedData = localStorage.getItem(userDataKey);
                    if (savedData) {
                        const parsedData = JSON.parse(savedData);
                        this.userData = { ...this.userData, ...parsedData };
                    } else {
                        // Reset to default values for new user
                        this.userData = {
                            totalSavings: 0,
                            todayRoundUp: 0,
                            currentStreak: 0,
                            recentActivity: [],
                            leaderboard: this.userData.leaderboard, // Keep leaderboard
                            badges: this.userData.badges // Keep badges
                        };
                    }
                } catch (fallbackError) {
                    console.error('Failed to load from localStorage fallback:', fallbackError);
                }
            }
            
            // Update all displays after loading user data
            this.updateSavingsDisplay();
            this.updateRoundUpDisplay();
            this.updateRecentActivity();
            this.updateProfile();
        }
    }

    async saveData() {
        // Save current user data using API or localStorage fallback
        if (this.currentUser && this.currentUser.id) {
            try {
                // Try to save using API first (send as numbers, not strings)
                await this.updateUser(this.currentUser.id, {
                    totalSavings: parseFloat(this.userData.totalSavings) || 0,
                    todayRoundUp: parseFloat(this.userData.todayRoundUp) || 0,
                    currentStreak: parseInt(this.userData.currentStreak) || 0
                });
                
                // Update local currentUser object
                this.currentUser = {
                    ...this.currentUser,
                    totalSavings: this.userData.totalSavings.toString(),
                    todayRoundUp: this.userData.todayRoundUp.toString(),
                    currentStreak: this.userData.currentStreak
                };
                
                // Keep localStorage updated for session persistence
                localStorage.setItem('saveup-user', JSON.stringify(this.currentUser));
                
            } catch (error) {
                console.warn('Failed to save data to API, using localStorage fallback:', error);
                // Fallback to localStorage if API fails
                if (this.currentUser.email) {
                    const userDataKey = `saveup-data-${this.currentUser.email}`;
                    localStorage.setItem(userDataKey, JSON.stringify(this.userData));
                }
            }
        }
    }


    // QR Scanner Methods
    initQRScanner() {
        this.qrScanner = null;
        this.currentCamera = 'environment'; // Back camera by default
    }

    startQRScanner() {
        const qrReader = document.getElementById('qr-reader');
        if (!qrReader || !window.Html5Qrcode) {
            this.showToast('QR Scanner not available', 'error');
            return;
        }

        // Initialize QR scanner
        this.qrScanner = new Html5Qrcode("qr-reader");
        
        const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
        };

        this.qrScanner.start(
            { facingMode: this.currentCamera },
            config,
            (decodedText, decodedResult) => {
                this.handleQRScanSuccess(decodedText, decodedResult);
            },
            (errorMessage) => {
                // Handle scan failure, usually ignored
            }
        ).catch(err => {
            console.error('QR Scanner initialization failed:', err);
            this.showToast('Camera access denied or unavailable', 'error');
        });

        this.updateScannerControls(true);
    }

    stopQRScanner() {
        if (this.qrScanner) {
            this.qrScanner.stop().then(() => {
                this.qrScanner.clear();
                this.qrScanner = null;
                this.updateScannerControls(false);
            }).catch(err => {
                console.error('Error stopping QR scanner:', err);
            });
        }
    }

    switchCamera() {
        if (!this.qrScanner) return;
        
        this.currentCamera = this.currentCamera === 'environment' ? 'user' : 'environment';
        
        // Restart scanner with new camera
        this.stopQRScanner();
        setTimeout(() => {
            this.startQRScanner();
        }, 500);
        
        this.showToast(`Switched to ${this.currentCamera === 'environment' ? 'back' : 'front'} camera`, 'info');
    }

    updateScannerControls(isScanning) {
        const switchBtn = document.getElementById('switch-camera-btn');
        const stopBtn = document.getElementById('stop-scanner-btn');
        
        if (switchBtn) {
            switchBtn.disabled = !isScanning;
            switchBtn.style.opacity = isScanning ? '1' : '0.5';
        }
        
        if (stopBtn) {
            stopBtn.disabled = !isScanning;
            stopBtn.style.opacity = isScanning ? '1' : '0.5';
        }
    }

    handleQRScanSuccess(decodedText, decodedResult) {
        this.stopQRScanner();
        
        // Parse UPI URL if it's a UPI QR code
        if (decodedText.startsWith('upi://')) {
            this.parseUPIQR(decodedText);
        } else {
            // Show generic scan result
            this.showScanResult(decodedText);
        }
    }

    parseUPIQR(upiUrl) {
        try {
            const url = new URL(upiUrl);
            const params = url.searchParams;
            
            // Navigate to payment screen with pre-filled data
            this.navigateToScreen('upi-payment-screen', null);
            
            // Pre-fill form fields
            setTimeout(() => {
                const upiIdField = document.getElementById('upi-id');
                const payeeNameField = document.getElementById('payee-name');
                const amountField = document.getElementById('amount');
                const noteField = document.getElementById('note');
                
                if (upiIdField) upiIdField.value = params.get('pa') || '';
                if (payeeNameField) payeeNameField.value = params.get('pn') || '';
                if (amountField) amountField.value = params.get('am') || '';
                if (noteField) noteField.value = params.get('tn') || '';
            }, 300);
            
            this.showToast('QR Code scanned successfully!', 'success');
        } catch (error) {
            console.error('Error parsing UPI QR:', error);
            this.showToast('Invalid UPI QR Code', 'error');
        }
    }

    showScanResult(text) {
        const scanResult = document.getElementById('scan-result');
        const resultContent = document.getElementById('result-content');
        
        if (scanResult && resultContent) {
            resultContent.textContent = text;
            scanResult.style.display = 'block';
        }
        
        this.showToast('QR Code scanned!', 'success');
    }

    processScannedPayment() {
        const resultContent = document.getElementById('result-content');
        if (resultContent) {
            const scannedText = resultContent.textContent;
            if (scannedText.startsWith('upi://')) {
                this.parseUPIQR(scannedText);
            } else {
                this.showToast('Not a valid payment QR code', 'error');
            }
        }
    }

    // QR Generation and Sharing Methods

    generateQRCode(data, details) {
        console.log('generateQRCode called with data:', data);
        console.log('Looking for element with ID: qr-canvas');
        const qrCanvas = document.getElementById('qr-canvas');
        console.log('Found qr-canvas element:', qrCanvas);
        console.log('Element exists:', !!qrCanvas);
        console.log('QRCode library available:', !!window.QRCode);
        
        if (!qrCanvas || !window.QRCode) {
            console.error('Failed - qrCanvas exists:', !!qrCanvas, 'QRCode exists:', !!window.QRCode);
            this.showToast('QR Code generator not available', 'error');
            return;
        }

        try {
            // Show QR display first (before generating QR code)
            const qrDisplay = document.querySelector('.qr-display');
            if (qrDisplay) {
                qrDisplay.style.display = 'block';
            }

            // Clear previous QR code
            qrCanvas.innerHTML = '';
            
            // Generate QR code using davidshimjs library (after container is visible)
            new QRCode(qrCanvas, {
                text: data,
                width: 250,
                height: 250,
                colorDark: '#000000',
                colorLight: '#FFFFFF',
                correctLevel: QRCode.CorrectLevel.M
            });

            // Update details text
            const displayText = document.querySelector('.qr-details');
            if (displayText) {
                displayText.innerHTML = `
                    <strong>UPI ID:</strong> ${details.upiId}<br>
                    <strong>Name:</strong> ${details.name}<br>
                    <strong>Amount:</strong> ₹${details.amount}<br>
                    <strong>Note:</strong> ${details.note}
                `;
            }

            this.showToast('QR Code generated successfully!', 'success');
        } catch (error) {
            console.error('QR generation error:', error);
            this.showToast('Failed to generate QR code', 'error');
        }
    }

    shareUPIDetails() {
        const yourUPIId = document.getElementById('my-upi-id');
        const yourName = document.getElementById('your-name');
        const requestAmount = document.getElementById('request-amount');

        if (!yourUPIId || !yourName || !requestAmount) {
            this.showToast('Please generate QR code first', 'error');
            return;
        }

        const upiId = yourUPIId.value.trim();
        const name = yourName.value.trim();
        const amount = requestAmount.value.trim();

        if (!upiId || !name || !amount) {
            this.showToast('Please fill in all required fields first', 'error');
            return;
        }

        // Create share text
        const shareText = `💰 Payment Request\n\n` +
                         `Pay me ₹${amount} via UPI\n` +
                         `UPI ID: ${upiId}\n` +
                         `Name: ${name}\n\n` +
                         `Or scan the QR code above`;

        // Try to use Web Share API if available
        if (navigator.share) {
            navigator.share({
                title: 'UPI Payment Request',
                text: shareText
            }).then(() => {
                this.showToast('Shared successfully!', 'success');
            }).catch((error) => {
                console.error('Error sharing:', error);
                this.fallbackShare(shareText);
            });
        } else {
            this.fallbackShare(shareText);
        }
    }

    fallbackShare(text) {
        // Fallback: copy to clipboard
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                this.showToast('Details copied to clipboard!', 'success');
            }).catch(() => {
                this.showToast('Failed to copy details', 'error');
            });
        } else {
            // Very old browser fallback
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showToast('Details copied to clipboard!', 'success');
        }
    }

    downloadQRCode() {
        const qrCanvas = document.getElementById('qr-canvas');
        if (!qrCanvas) {
            this.showToast('No QR code to download', 'error');
            return;
        }

        // Create download link
        const downloadLink = document.createElement('a');
        downloadLink.download = 'payment-qr-code.png';
        downloadLink.href = qrCanvas.toDataURL('image/png');
        
        // Trigger download
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        this.showToast('QR Code downloaded!', 'success');
    }


    handleKeyboardNavigation(e) {
        if (e.key === 'Escape') {
            // Close any open modals
            document.querySelectorAll('.modal.active').forEach(modal => {
                this.closeModal(modal.id);
            });
        }
        
        if (e.key === 'ArrowLeft' && this.currentScreen === 'leaderboard-screen') {
            this.switchTab('friends');
        }
        
        if (e.key === 'ArrowRight' && this.currentScreen === 'leaderboard-screen') {
            this.switchTab('college');
        }
        
        // Quick navigation
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case '1':
                    e.preventDefault();
                    this.navigateToScreen('savings-screen', 'home-btn');
                    break;
                case '2':
                    e.preventDefault();
                    this.navigateToScreen('leaderboard-screen', 'savings-nav-btn');
                    break;
                case '3':
                    e.preventDefault();
                    this.navigateToScreen('badges-screen', 'profile-btn');
                    break;
            }
        }
    }

    // Payment Methods
    handleUPIPayment(e) {
        e.preventDefault();
        
        const upiId = document.getElementById('upi-id').value.trim();
        const payeeName = document.getElementById('payee-name').value.trim();
        const amount = document.getElementById('amount').value.trim();
        const note = document.getElementById('note').value.trim() || 'Payment from SaveUp';
        
        // Validation
        if (!upiId || !payeeName || !amount) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }
        
        if (!this.validateUPIId(upiId)) {
            this.showToast('Please enter a valid UPI ID', 'error');
            return;
        }
        
        const amountNum = parseFloat(amount);
        if (isNaN(amountNum) || amountNum <= 0) {
            this.showToast('Please enter a valid amount', 'error');
            return;
        }
        
        // Generate UPI deep link
        const upiLink = this.generateUPIDeepLink({
            pa: upiId,
            pn: payeeName,
            am: amountNum,
            tn: note,
            cu: 'INR'
        });
        
        // Try to open UPI app
        this.openUPIApp(upiLink, {
            amount: amountNum,
            payee: payeeName,
            upiId: upiId,
            note: note
        });
    }
    
    generateUPIDeepLink(params) {
        const queryParams = new URLSearchParams();
        queryParams.append('pa', params.pa); // Payee address
        queryParams.append('pn', params.pn); // Payee name  
        queryParams.append('am', params.am); // Amount
        queryParams.append('tn', params.tn); // Transaction note
        queryParams.append('cu', params.cu); // Currency
        
        return `upi://pay?${queryParams.toString()}`;
    }
    
    validateUPIId(upiId) {
        // Basic UPI ID validation
        const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+$/;
        return upiRegex.test(upiId);
    }
    
    openUPIApp(upiLink, paymentData) {
        this.showToast('Opening UPI app...', 'info');
        
        // Try to open UPI app
        window.location.href = upiLink;
        
        // Simulate payment processing after a delay
        setTimeout(() => {
            this.processPaymentSuccess(paymentData);
        }, 3000);
        
        // Show payment processing message
        setTimeout(() => {
            this.showToast('Complete payment in your UPI app', 'info');
        }, 1000);
    }
    
    async processPaymentSuccess(paymentData) {
        // Store original amount for accurate tracking
        const originalAmount = paymentData.amount;
        
        try {
            // Create transaction record in database if user is logged in
            if (this.currentUser && this.currentUser.id) {
                // Create payment transaction
                const paymentTransaction = await this.createTransaction({
                    userId: this.currentUser.id,
                    type: 'payment',
                    amount: originalAmount,
                    originalAmount: originalAmount,
                    payee: paymentData.payee,
                    upiId: paymentData.upiId || null,
                    note: paymentData.note || null,
                    status: 'completed'
                });
                
                // Create payment activity
                await this.createActivity({
                    userId: this.currentUser.id,
                    type: 'payment',
                    amount: originalAmount,
                    description: `Payment to ${paymentData.payee}`,
                    icon: 'credit-card'
                });
                
                console.log('Payment transaction saved to database:', paymentTransaction);
            }
        } catch (error) {
            console.warn('Failed to save payment transaction to database:', error);
        }
        
        // Auto-categorize the transaction and update spending categories
        const category = this.categorizeTransaction(
            paymentData.note || `Payment to ${paymentData.payee}`, 
            originalAmount, 
            paymentData.payee
        );
        
        // Update spending category
        this.addToSpendingCategory(category, originalAmount);
        
        // Add payment to recent activity locally (for immediate UI update)
        this.userData.recentActivity.unshift({
            type: 'payment',
            amount: originalAmount,
            originalAmount: originalAmount,
            icon: 'credit-card',
            payee: paymentData.payee,
            timestamp: new Date().toISOString(),
            note: paymentData.note,
            category: category // Include category for better tracking
        });
        
        // Calculate and add round-up to savings
        const roundUpAmount = this.calculateRoundUp(originalAmount);
        if (roundUpAmount > 0) {
            // Update totals
            this.userData.totalSavings = parseFloat((this.userData.totalSavings + roundUpAmount).toFixed(2));
            this.userData.todayRoundUp = parseFloat((this.userData.todayRoundUp + roundUpAmount).toFixed(2));
            
            try {
                // Create round-up transaction and activity in database
                if (this.currentUser && this.currentUser.id) {
                    // Create round-up transaction
                    const roundUpTransaction = await this.createTransaction({
                        userId: this.currentUser.id,
                        type: 'round-up',
                        amount: roundUpAmount,
                        originalAmount: originalAmount,
                        roundUpAmount: roundUpAmount,
                        note: `Round-up from ₹${originalAmount} payment`,
                        status: 'completed'
                    });
                    
                    // Create round-up activity
                    await this.createActivity({
                        userId: this.currentUser.id,
                        type: 'round-up',
                        amount: roundUpAmount,
                        description: `₹${roundUpAmount.toFixed(2)} saved from ₹${originalAmount} payment`,
                        icon: 'piggy-bank'
                    });
                    
                    console.log('Round-up transaction saved to database:', roundUpTransaction);
                }
            } catch (error) {
                console.warn('Failed to save round-up transaction to database:', error);
            }
            
            // Add round-up activity locally (for immediate UI update)
            this.userData.recentActivity.unshift({
                type: 'round-up',
                amount: roundUpAmount,
                originalAmount: originalAmount,
                icon: 'piggy-bank',
                timestamp: new Date().toISOString(),
                note: `Round-up from ₹${originalAmount} payment`
            });
        }
        
        console.log(`Payment processed: ₹${originalAmount}, Round-up: ₹${roundUpAmount}, Total Savings: ₹${this.userData.totalSavings}`);
        
        // Use trackTransaction for comprehensive transaction tracking and leaderboard updates
        await this.trackTransaction(originalAmount, 'payment', `Payment to ${paymentData.payee}`);
        
        // Save user data (savings totals) to database
        await this.saveData();
        
        // Update UI displays
        this.updateSavingsDisplay();
        this.updateRoundUpDisplay();
        this.updateRecentActivity();
        this.updateLeaderboard();
        
        // Navigate to success screen
        this.showPaymentSuccess(paymentData, roundUpAmount);
    }
    
    showPaymentSuccess(paymentData, roundUpAmount) {
        // Update success screen content
        const successAmount = document.querySelector('#payment-success-screen .success-amount');
        const successPayee = document.querySelector('#payment-success-screen .success-payee');
        const roundUpText = document.querySelector('#payment-success-screen .round-up-success');
        
        if (successAmount) successAmount.textContent = `₹${paymentData.amount}`;
        if (successPayee) successPayee.textContent = `Paid to ${paymentData.payee}`;
        if (roundUpText && roundUpAmount > 0) {
            roundUpText.textContent = `₹${roundUpAmount.toFixed(2)} rounded up and saved!`;
            roundUpText.style.display = 'block';
        } else if (roundUpText) {
            roundUpText.style.display = 'none';
        }
        
        // Navigate to success screen
        this.navigateToScreen('payment-success-screen', null);
        
        // Show toast
        this.showToast('Payment completed successfully!', 'success');
        
        // Update displays
        this.updateSavingsDisplay();
        this.updateRoundUpDisplay();
        this.updateRecentActivity();
    }

    // QR Scanner Methods
    initQRScanner() {
        if (this.qrScanner) {
            return; // Already initialized
        }
        
        const qrReader = document.getElementById('qr-reader');
        if (!qrReader) return;
        
        this.qrScanner = new Html5Qrcode("qr-reader");
        this.currentCamera = 0;
        this.availableCameras = [];
        
        // Get available cameras
        Html5Qrcode.getCameras().then(cameras => {
            this.availableCameras = cameras;
            console.log('Available cameras:', cameras);
        }).catch(err => {
            console.warn('Error getting cameras:', err);
            this.showToast('Camera access not available', 'error');
        });
    }
    
    startQRScanner() {
        // Check if Html5Qrcode library is loaded
        if (typeof Html5Qrcode === 'undefined') {
            console.error('Html5Qrcode library not loaded');
            this.showToast('QR Scanner not available. Please refresh the page.', 'error');
            return;
        }

        if (!this.qrScanner) {
            this.initQRScanner();
        }
        
        const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
        };
        
        // Try to start with back camera first, then front camera
        const cameraId = this.availableCameras.length > 0 ? 
            this.availableCameras[this.currentCamera]?.id || { facingMode: "environment" } :
            { facingMode: "environment" };
        
        this.qrScanner.start(
            cameraId,
            config,
            (decodedText, decodedResult) => {
                this.onQRCodeScanned(decodedText, decodedResult);
            },
            (errorMessage) => {
                // Handle scan failure - usually can ignore
                console.log('QR scan error:', errorMessage);
            }
        ).catch(err => {
            console.error('Error starting QR scanner:', err);
            this.showToast('Unable to start camera. Please check permissions.', 'error');
        });
        
        this.isScanning = true;
        this.updateScannerUI();
    }
    
    stopQRScanner() {
        if (this.qrScanner && this.isScanning) {
            this.qrScanner.stop().then(() => {
                console.log('QR scanner stopped');
                this.isScanning = false;
                this.updateScannerUI();
            }).catch(err => {
                console.error('Error stopping QR scanner:', err);
            });
        }
    }
    
    switchCamera() {
        if (this.availableCameras.length <= 1) {
            this.showToast('Only one camera available', 'info');
            return;
        }
        
        this.stopQRScanner();
        
        setTimeout(() => {
            this.currentCamera = (this.currentCamera + 1) % this.availableCameras.length;
            this.startQRScanner();
            this.showToast('Camera switched', 'success');
        }, 500);
    }
    
    updateScannerUI() {
        const switchBtn = document.getElementById('switch-camera-btn');
        const stopBtn = document.getElementById('stop-scanner-btn');
        
        if (switchBtn) {
            switchBtn.style.display = this.availableCameras.length > 1 ? 'block' : 'none';
        }
        
        if (stopBtn) {
            stopBtn.textContent = this.isScanning ? 'Stop Scanner' : 'Start Scanner';
        }
    }
    
    onQRCodeScanned(decodedText, decodedResult) {
        console.log('QR Code scanned:', decodedText);
        
        // Stop scanner
        this.stopQRScanner();
        
        // Show success animation first
        this.showScanSuccess(decodedText);
        
        // Process the scanned QR code after animation
        setTimeout(() => {
            if (this.isUPIQR(decodedText)) {
                this.processUPIQR(decodedText);
            } else {
                // Generic QR code
                this.showToast('QR Code scanned successfully', 'success');
                this.showGenericQRResult(decodedText);
            }
        }, 2000);
    }
    
    isUPIQR(text) {
        return text.startsWith('upi://') || text.includes('upi://');
    }
    
    processUPIQR(upiText) {
        try {
            // Parse UPI QR code
            const url = new URL(upiText);
            const params = new URLSearchParams(url.search);
            
            // Navigate to payment screen with pre-filled data
            document.getElementById('upi-id').value = params.get('pa') || '';
            document.getElementById('payee-name').value = params.get('pn') || '';
            document.getElementById('amount').value = params.get('am') || '';
            document.getElementById('note').value = params.get('tn') || '';
            
            this.navigateToScreen('upi-payment-screen', null);
            this.showToast('Payment details loaded from QR', 'success');
        } catch (error) {
            console.error('Error parsing UPI QR:', error);
            this.showToast('Invalid UPI QR code', 'error');
        }
    }
    
    showGenericQRResult(text) {
        this.showToast(`QR Content: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`, 'info');
    }

    showScanSuccess(scannedData) {
        const scanResult = document.getElementById('scan-result');
        const resultContent = document.getElementById('result-content');
        
        if (scanResult && resultContent) {
            // Set the scanned data
            resultContent.textContent = scannedData.length > 100 ? 
                scannedData.substring(0, 100) + '...' : scannedData;
            
            // Show success screen
            scanResult.style.display = 'flex';
        }
    }
    
    toggleFlashlight() {
        // Flash functionality would require camera API access
        // For now, just show a message
        this.showToast('Flashlight toggle coming soon!', 'info');
    }
    
    showPaymentDetails(activity, index) {
        // Generate detailed payment information
        let fromAccount = 'Your Account';
        let toAccount = 'Savings';
        let originalAmount = activity.amount;
        let roundupAmount = 0;
        
        // Calculate round-up based on activity type
        if (activity.type === 'payment' && activity.payee) {
            fromAccount = 'Your Account';
            toAccount = activity.payee;
            // Use stored original amount or show N/A
            if (activity.originalAmount) {
                originalAmount = activity.originalAmount;
                roundupAmount = activity.amount - originalAmount;
            } else {
                // For demo purposes, estimate a realistic original amount
                const decimalPart = parseFloat((0.01 + Math.floor(activity.amount) % 0.99).toFixed(2));
                originalAmount = Math.floor(activity.amount) + decimalPart;
                roundupAmount = Math.ceil(originalAmount) - originalAmount;
            }
        } else if (activity.type === 'round-up') {
            if (activity.originalAmount) {
                originalAmount = activity.originalAmount;
            } else {
                // For demo: estimate original based on round-up amount  
                originalAmount = Math.floor(activity.amount * 10) + (activity.amount * 10 % 1);
            }
            roundupAmount = activity.amount;
            toAccount = 'Savings (Round-up)';
            fromAccount = 'Transaction Round-up';
        } else if (activity.type === 'auto-save') {
            toAccount = 'Savings (Auto-save)';
            roundupAmount = 0;
        }
        
        // Remove existing modal if any
        const existingModal = document.getElementById('payment-details-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Create modal structure
        const modal = document.createElement('div');
        modal.className = 'payment-details-modal';
        modal.id = 'payment-details-modal';
        modal.style.display = 'flex';
        
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content payment-modal-content';
        
        // Build modal content safely
        modalContent.innerHTML = `
            <div class="modal-header">
                <h3>Transaction Details</h3>
                <button class="modal-close-btn" id="close-payment-details">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="payment-detail-row">
                    <span class="detail-label">Transaction Type:</span>
                    <span class="detail-value"></span>
                </div>
                <div class="payment-detail-row">
                    <span class="detail-label">From Account:</span>
                    <span class="detail-value"></span>
                </div>
                <div class="payment-detail-row">
                    <span class="detail-label">To Account:</span>
                    <span class="detail-value"></span>
                </div>
                <div class="payment-detail-row">
                    <span class="detail-label">Amount:</span>
                    <span class="detail-value amount-highlight"></span>
                </div>
                <div class="payment-detail-row roundup-row" id="roundup-row" style="display: none;">
                    <span class="detail-label">Round-up Amount:</span>
                    <span class="detail-value roundup-highlight"></span>
                </div>
                <div class="payment-detail-row">
                    <span class="detail-label">Date & Time:</span>
                    <span class="detail-value"></span>
                </div>
                <div class="payment-detail-row">
                    <span class="detail-label">Status:</span>
                    <span class="detail-value status-success">Completed</span>
                </div>
                <div class="payment-detail-row" id="note-row" style="display: none;">
                    <span class="detail-label">Note:</span>
                    <span class="detail-value"></span>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-primary" id="close-payment-modal">Close</button>
            </div>
        `;
        
        // Populate data safely using textContent
        const detailValues = modalContent.querySelectorAll('.detail-value');
        detailValues[0].textContent = this.capitalizeFirst(activity.type.replace('-', ' '));
        detailValues[1].textContent = fromAccount;
        detailValues[2].textContent = toAccount;
        detailValues[3].textContent = `₹${originalAmount.toFixed(2)}`;
        detailValues[5].textContent = activity.timestamp ? new Date(activity.timestamp).toLocaleString() : 'Recent';
        
        // Show roundup row if applicable
        if (roundupAmount > 0) {
            const roundupRow = modalContent.querySelector('#roundup-row');
            if (roundupRow) {
                roundupRow.style.display = 'flex';
                detailValues[4].textContent = `₹${roundupAmount.toFixed(2)}`;
            }
        }
        
        // Show note if available
        if (activity.note) {
            const noteRow = modalContent.querySelector('#note-row');
            if (noteRow) {
                noteRow.style.display = 'flex';
                const noteValueIndex = roundupAmount > 0 ? 7 : 6; // Adjust index based on roundup row
                if (detailValues[noteValueIndex]) {
                    detailValues[noteValueIndex].textContent = activity.note;
                }
            }
        }
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Add event listeners with proper context binding
        const closeBtn1 = modal.querySelector('#close-payment-details');
        const closeBtn2 = modal.querySelector('#close-payment-modal');
        
        if (closeBtn1) {
            closeBtn1.addEventListener('click', () => this.closePaymentDetailsModal());
        }
        if (closeBtn2) {
            closeBtn2.addEventListener('click', () => this.closePaymentDetailsModal());
        }
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closePaymentDetailsModal();
            }
        });
        
        // Add escape key listener
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.closePaymentDetailsModal();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }
    
    closePaymentDetailsModal() {
        const modal = document.getElementById('payment-details-modal');
        if (modal) {
            modal.style.display = 'none';
            modal.remove();
        }
    }
    
    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // Receive Money Methods
    async recordReceivedPayment() {
        // Get the payment details from the form fields
        const yourUPIId = document.getElementById('my-upi-id').value.trim();
        const yourName = document.getElementById('your-name').value.trim();
        const requestAmount = document.getElementById('request-amount').value.trim();
        const requestNote = document.getElementById('request-note').value.trim() || 'Payment received';
        
        if (!yourUPIId || !yourName || !requestAmount) {
            this.showToast('Please fill in all required fields first', 'error');
            return;
        }
        
        const amount = parseFloat(requestAmount);
        if (isNaN(amount) || amount <= 0) {
            this.showToast('Please enter a valid amount', 'error');
            return;
        }
        
        // Record the received payment in recent activity
        const receivedPayment = {
            type: 'received',
            amount: amount,
            payee: `From someone via QR`,
            note: requestNote,
            icon: 'arrow-down',
            timestamp: new Date(),
            upiId: yourUPIId,
            name: yourName
        };
        
        // Add to recent activity (at the beginning)
        this.userData.recentActivity.unshift(receivedPayment);
        
        // Update savings total
        this.userData.totalSavings = parseFloat((parseFloat(this.userData.totalSavings) + amount).toFixed(2));
        
        // Use trackTransaction for proper transaction tracking and leaderboard updates
        await this.trackTransaction(amount, 'received', `Payment received via QR code`);
        
        // Update the UI
        this.updateRecentActivity();
        this.updateSavingsDisplay();
        this.updateLeaderboard();
        
        // Save data to database and localStorage
        await this.saveData();
        
        // Hide the QR display and show success message
        const qrDisplay = document.getElementById('qr-display');
        if (qrDisplay) {
            qrDisplay.style.display = 'none';
        }
        
        this.showToast(`Payment of ₹${amount} recorded successfully!`, 'success');
    }
    
    async recordReceivedPaymentToDB(paymentData) {
        try {
            if (this.currentUser && this.currentUser.id) {
                // Create received payment transaction
                const receivedTransaction = await this.createTransaction({
                    userId: this.currentUser.id,
                    type: 'received',
                    amount: paymentData.amount,
                    payee: paymentData.payee,
                    upiId: paymentData.upiId || null,
                    note: paymentData.note || null,
                    status: 'completed'
                });
                
                // Create received payment activity
                await this.createActivity({
                    userId: this.currentUser.id,
                    type: 'received',
                    amount: paymentData.amount,
                    description: `Received ₹${paymentData.amount} via QR code`,
                    icon: 'arrow-down'
                });
                
                console.log('Received payment saved to database:', receivedTransaction);
            }
        } catch (error) {
            console.warn('Failed to save received payment to database:', error);
        }
    }

    generatePaymentQR() {
        const yourUPIId = document.getElementById('my-upi-id').value.trim();
        const yourName = document.getElementById('your-name').value.trim();
        const requestAmount = document.getElementById('request-amount').value.trim();
        const requestNote = document.getElementById('request-note').value.trim() || 'Payment request';
        
        if (!yourUPIId || !yourName) {
            this.showToast('Please enter your UPI ID and name', 'error');
            return;
        }
        
        if (!this.validateUPIId(yourUPIId)) {
            this.showToast('Please enter a valid UPI ID', 'error');
            return;
        }
        
        const amount = requestAmount ? parseFloat(requestAmount) : null;
        if (requestAmount && (isNaN(amount) || amount <= 0)) {
            this.showToast('Please enter a valid amount', 'error');
            return;
        }
        
        // Generate UPI link for receiving payment
        const upiLink = this.generateUPIDeepLink({
            pa: yourUPIId,
            pn: yourName,
            am: amount || '',
            tn: requestNote,
            cu: 'INR'
        });
        
        // Ensure QR display is visible FIRST, then find the canvas element
        const qrDisplay = document.getElementById('qr-display');
        if (qrDisplay) {
            qrDisplay.style.display = 'block';
        }
        
        // Now find the QR canvas element (after display is visible)
        const qrCanvas = document.getElementById('qr-canvas');
        console.log('QR Canvas element found:', !!qrCanvas);
        console.log('QRCode library available:', typeof window.QRCode);
        
        // Try to generate QR code
        this.tryGenerateQR(qrCanvas, upiLink, yourUPIId, yourName, amount, requestNote);
    }
    
    tryGenerateQR(qrCanvas, upiLink, yourUPIId, yourName, amount, requestNote, attempts = 0) {
        if (qrCanvas && window.QRCode) {
            try {
                // Show the QR display section first (before generating QR code)
                const qrDisplay = document.getElementById('qr-display');
                if (qrDisplay) {
                    qrDisplay.style.display = 'block';
                }
                
                // Clear previous QR code
                qrCanvas.innerHTML = '';
                
                // Generate QR code using davidshimjs library (after container is visible)
                new QRCode(qrCanvas, {
                    text: upiLink,
                    width: 200,
                    height: 200,
                    colorDark: '#000000',
                    colorLight: '#ffffff',
                    correctLevel: QRCode.CorrectLevel.M
                });
                
                console.log('QR code generated successfully');
                this.showToast('QR code generated successfully!', 'success');
                
                // Update display text (create if doesn't exist)
                let displayText = document.querySelector('.qr-details');
                if (!displayText) {
                    displayText = document.createElement('div');
                    displayText.className = 'qr-details';
                    qrDisplay.appendChild(displayText);
                }
                displayText.innerHTML = `
                    <p><strong>UPI ID:</strong> ${yourUPIId}</p>
                    <p><strong>Name:</strong> ${yourName}</p>
                    ${amount ? `<p><strong>Amount:</strong> ₹${amount}</p>` : ''}
                    <p><strong>Note:</strong> ${requestNote}</p>
                `;
            } catch (error) {
                console.error('QRCode library error:', error);
                this.showToast('QR Code library not available', 'error');
            }
        } else if (attempts < 3) {
            // Retry after a short delay if library isn't loaded yet
            console.warn(`QRCode library not ready, attempt ${attempts + 1}/3`);
            setTimeout(() => {
                this.tryGenerateQR(qrCanvas, upiLink, yourUPIId, yourName, amount, requestNote, attempts + 1);
            }, 500);
        } else {
            console.error('QR Canvas or QRCode library not found after retries');
            console.error('Canvas found:', !!qrCanvas);
            console.error('QRCode library found:', !!window.QRCode);
            this.showToast('QR generation not available - please refresh the page', 'error');
        }
    }
    
    shareUPIDetails() {
        const yourUPIId = document.getElementById('my-upi-id').value.trim();
        const yourName = document.getElementById('your-name').value.trim();
        const requestAmount = document.getElementById('request-amount').value.trim();
        
        if (!yourUPIId || !yourName) {
            this.showToast('Please enter your UPI ID and name first', 'error');
            return;
        }
        
        const shareText = `Send me money via UPI:\n\nUPI ID: ${yourUPIId}\nName: ${yourName}${requestAmount ? `\nAmount: ₹${requestAmount}` : ''}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'UPI Payment Request',
                text: shareText
            }).then(() => {
                this.showToast('Shared successfully', 'success');
            }).catch((error) => {
                console.log('Error sharing:', error);
                this.fallbackShare(shareText);
            });
        } else {
            this.fallbackShare(shareText);
        }
    }
    
    fallbackShare(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                this.showToast('UPI details copied to clipboard', 'success');
            }).catch(() => {
                this.showShareModal(text);
            });
        } else {
            this.showShareModal(text);
        }
    }
    
    showShareModal(text) {
        const modal = document.createElement('div');
        modal.className = 'share-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Share UPI Details</h3>
                <textarea readonly>${text}</textarea>
                <button onclick="this.parentElement.parentElement.remove()">Close</button>
            </div>
        `;
        document.body.appendChild(modal);
        
        this.showToast('UPI details ready to share', 'info');
    }

    // Data Persistence Methods
    saveDataToLocalStorage() {
        // Save user data to localStorage for offline access and session persistence
        if (this.currentUser && this.currentUser.email) {
            try {
                // Save user-specific data
                const userDataKey = `saveup-data-${this.currentUser.email}`;
                const dataToSave = {
                    totalSavings: this.userData.totalSavings,
                    todayRoundUp: this.userData.todayRoundUp,
                    currentStreak: this.userData.currentStreak,
                    recentActivity: this.userData.recentActivity,
                    friends: this.userData.friends,
                    leaderboard: this.userData.leaderboard,
                    upiConnection: this.userData.upiConnection,
                    achievements: this.userData.achievements,
                    badges: this.userData.badges,
                    lastSaved: new Date().toISOString()
                };
                
                localStorage.setItem(userDataKey, JSON.stringify(dataToSave));
                
                // Also update the current user object for session persistence
                const updatedUser = {
                    ...this.currentUser,
                    totalSavings: this.userData.totalSavings.toString(),
                    todayRoundUp: this.userData.todayRoundUp.toString(),
                    currentStreak: this.userData.currentStreak
                };
                localStorage.setItem('saveup-user', JSON.stringify(updatedUser));
                
                console.log('User data saved to localStorage successfully');
            } catch (error) {
                console.error('Failed to save data to localStorage:', error);
            }
        } else {
            // Save basic app state even without user login
            try {
                localStorage.setItem('saveup-app-state', JSON.stringify({
                    totalSavings: this.userData.totalSavings,
                    todayRoundUp: this.userData.todayRoundUp,
                    recentActivity: this.userData.recentActivity,
                    lastSaved: new Date().toISOString()
                }));
            } catch (error) {
                console.error('Failed to save app state to localStorage:', error);
            }
        }
    }


    // Password Hashing Utility
    async hashPassword(password) {
        // Simple client-side password hashing using SHA-256
        const encoder = new TextEncoder();
        const data = encoder.encode(password + 'saveup-salt-2025'); // Add salt
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Login attempt rate limiting
    checkRateLimit(email) {
        const key = `login_attempts_${email}`;
        const attempts = JSON.parse(localStorage.getItem(key) || '[]');
        const now = Date.now();
        const recentAttempts = attempts.filter(time => now - time < 900000); // 15 minutes
        
        if (recentAttempts.length >= 5) {
            return false; // Too many attempts
        }
        
        recentAttempts.push(now);
        localStorage.setItem(key, JSON.stringify(recentAttempts));
        return true;
    }

    clearRateLimit(email) {
        const key = `login_attempts_${email}`;
        localStorage.removeItem(key);
    }

    // Authentication Methods
    bindAuthEvents() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                this.handleLogin(e);
            });
        }

        // Signup form
        const signupForm = document.getElementById('signup-form');
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => {
                this.handleSignup(e);
            });
        }

        // Switch between login and signup
        const switchToSignup = document.getElementById('switch-to-signup');
        if (switchToSignup) {
            switchToSignup.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchToSignup();
            });
        }

        const switchToLogin = document.getElementById('switch-to-login');
        if (switchToLogin) {
            switchToLogin.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchToLogin();
            });
        }

        // Auth back button
        const authBackBtn = document.getElementById('auth-back-btn');
        if (authBackBtn) {
            authBackBtn.addEventListener('click', () => {
                this.switchToLogin();
            });
        }

        // Social auth buttons (demo functionality)
        document.querySelectorAll('.auth-btn.social').forEach(btn => {
            btn.addEventListener('click', () => {
                this.handleSocialAuth(btn);
            });
        });
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const rememberMe = document.getElementById('remember-me').checked;

        // Basic validation
        if (!this.validateEmail(email)) {
            this.showAuthError('login-email', 'Please enter a valid email address');
            return;
        }

        if (password.length < 6) {
            this.showAuthError('login-password', 'Password must be at least 6 characters');
            return;
        }

        // Check rate limiting
        if (!this.checkRateLimit(email)) {
            this.showToast('Too many login attempts. Please try again in 15 minutes.', 'error');
            return;
        }

        // Clear any previous errors
        this.clearAuthErrors();

        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        this.setLoadingState(submitBtn, true);

        try {
            // Try to authenticate using database API
            const user = await this.loginUser(email);
            
            if (user) {
                // Clear rate limiting on successful login
                this.clearRateLimit(email);
                
                this.authenticateUser(user, rememberMe);
                this.setLoadingState(submitBtn, false);
                this.showToast(`Welcome back, ${user.name}!`, 'success');
                
                // Navigate to main app
                this.navigateToScreen('savings-screen', 'home-btn');
            } else {
                this.setLoadingState(submitBtn, false);
                this.showToast('User not found. Please check your email or sign up.', 'error');
            }
        } catch (error) {
            this.setLoadingState(submitBtn, false);
            console.error('Login error:', error);
            
            // Fallback to localStorage for existing users during migration
            try {
                const hashedPassword = await this.hashPassword(password);
                const registeredUsers = JSON.parse(localStorage.getItem('saveup-registered-users') || '[]');
                const user = registeredUsers.find(u => u.email === email && u.hashedPassword === hashedPassword);
                
                if (user) {
                    this.clearRateLimit(email);
                    this.authenticateUser(user, rememberMe);
                    this.showToast(`Welcome back, ${user.name}! (Local login)`, 'success');
                    this.navigateToScreen('savings-screen', 'home-btn');
                } else {
                    this.showToast('Invalid email or password. Please check your credentials or sign up.', 'error');
                }
            } catch (fallbackError) {
                this.showToast('Login failed. Please try again.', 'error');
            }
        }
    }

    async handleSignup(e) {
        e.preventDefault();
        
        const name = document.getElementById('signup-name').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm-password').value;
        const termsAgreed = document.getElementById('terms-agreement').checked;

        // Validation
        if (name.length < 2) {
            this.showAuthError('signup-name', 'Name must be at least 2 characters');
            return;
        }

        if (!this.validateEmail(email)) {
            this.showAuthError('signup-email', 'Please enter a valid email address');
            return;
        }

        if (password.length < 8) {
            this.showAuthError('signup-password', 'Password must be at least 8 characters');
            return;
        }

        // Enhanced password validation
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
        if (!passwordRegex.test(password)) {
            this.showAuthError('signup-password', 'Password must contain at least one uppercase letter, one lowercase letter, and one number');
            return;
        }

        if (password !== confirmPassword) {
            this.showAuthError('signup-confirm-password', 'Passwords do not match');
            return;
        }

        if (!termsAgreed) {
            this.showToast('Please agree to the Terms & Conditions', 'error');
            return;
        }

        // Clear any previous errors
        this.clearAuthErrors();

        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        this.setLoadingState(submitBtn, true);

        try {
            // Create user using database API
            const username = email.split('@')[0]; // Generate username from email
            const userData = {
                email: email,
                username: username,
                name: name,
                totalSavings: '0.00',
                todayRoundUp: '0.00',
                currentStreak: 0
            };

            const user = await this.createUser(userData);
            
            this.authenticateUser(user, true);
            this.setLoadingState(submitBtn, false);
            this.showToast('Account created successfully! Welcome to SaveUp.', 'success');
            
            // Navigate to main app
            this.navigateToScreen('savings-screen', 'home-btn');
        } catch (error) {
            this.setLoadingState(submitBtn, false);
            console.error('Signup error:', error);
            
            // Check if error is due to existing user
            if (error.message.includes('already exists') || error.message.includes('unique')) {
                this.showToast('User already exists. Please login instead.', 'error');
                return;
            }
            
            // Fallback to localStorage during migration period
            try {
                const existingUsers = JSON.parse(localStorage.getItem('saveup-registered-users') || '[]');
                if (existingUsers.find(user => user.email === email)) {
                    this.showToast('User already exists. Please login instead.', 'error');
                    return;
                }

                const hashedPassword = await this.hashPassword(password);
                const user = {
                    name: name,
                    email: email,
                    hashedPassword: hashedPassword,
                    memberSince: new Date().getFullYear(),
                    signupTime: new Date().toISOString()
                };

                existingUsers.push(user);
                localStorage.setItem('saveup-registered-users', JSON.stringify(existingUsers));

                this.authenticateUser(user, true);
                this.showToast('Account created successfully! Welcome to SaveUp. (Local signup)', 'success');
                this.navigateToScreen('savings-screen', 'home-btn');
            } catch (fallbackError) {
                this.showToast('Registration failed. Please try again.', 'error');
            }
        }
    }

    handleSocialAuth(button) {
        const provider = button.classList.contains('google') ? 'Google' : 'GitHub';
        
        this.setLoadingState(button, true);
        
        // For demo purposes, show that social auth is not implemented
        setTimeout(() => {
            this.setLoadingState(button, false);
            this.showToast(`${provider} authentication is not yet implemented. Please use email/password login.`, 'info');
        }, 1000);
        
        // In a real application, this would redirect to the OAuth provider:
        // window.location.href = `https://accounts.google.com/oauth/authorize?...`;
        // Or for GitHub: window.location.href = `https://github.com/login/oauth/authorize?...`;
    }

    authenticateUser(user, remember = false) {
        this.isAuthenticated = true;
        this.currentUser = user;
        
        // Load user-specific data after authentication
        this.loadUserData();
        
        // Save to localStorage if remember me is checked
        if (remember) {
            localStorage.setItem('saveup-user', JSON.stringify(user));
            localStorage.setItem('saveup-authenticated', 'true');
        } else {
            sessionStorage.setItem('saveup-user', JSON.stringify(user));
            sessionStorage.setItem('saveup-authenticated', 'true');
        }
    }

    checkAuthentication() {
        // Check if user is already authenticated
        const savedUser = localStorage.getItem('saveup-user') || sessionStorage.getItem('saveup-user');
        const isAuth = localStorage.getItem('saveup-authenticated') || sessionStorage.getItem('saveup-authenticated');
        
        if (savedUser && isAuth === 'true') {
            this.isAuthenticated = true;
            this.currentUser = JSON.parse(savedUser);
            this.currentScreen = 'savings-screen';
            
            // Load user-specific data for authenticated user
            this.loadUserData();
            
            // Don't show toast during initialization
            return true;
        }
        return false;
    }

    logout() {
        this.isAuthenticated = false;
        this.currentUser = null;
        localStorage.removeItem('saveup-user');
        localStorage.removeItem('saveup-authenticated');
        sessionStorage.removeItem('saveup-user');
        sessionStorage.removeItem('saveup-authenticated');
        this.navigateToScreen('login-screen');
        this.showToast('Logged out successfully', 'info');
    }

    switchToSignup() {
        this.navigateToScreen('signup-screen');
        this.clearAuthErrors();
        // Focus first input
        setTimeout(() => {
            document.getElementById('signup-name').focus();
        }, 300);
    }

    switchToLogin() {
        this.navigateToScreen('login-screen');
        this.clearAuthErrors();
        // Focus first input
        setTimeout(() => {
            document.getElementById('login-email').focus();
        }, 300);
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showAuthError(inputId, message) {
        const input = document.getElementById(inputId);
        const formGroup = input.parentElement;
        
        // Remove existing error
        const existingError = formGroup.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Add error class and message
        formGroup.classList.add('error');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        formGroup.appendChild(errorDiv);
        
        // Focus the input
        input.focus();
    }

    clearAuthErrors() {
        document.querySelectorAll('.form-group.error').forEach(group => {
            group.classList.remove('error');
            const errorMsg = group.querySelector('.error-message');
            if (errorMsg) {
                errorMsg.remove();
            }
        });
    }

    setLoadingState(button, loading) {
        if (loading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }

    // Theme Management
    initializeTheme() {
        // Load saved theme preference
        const savedTheme = localStorage.getItem('saveup-theme') || 'light';
        const body = document.body;
        const themeToggleBtn = document.getElementById('theme-toggle');
        
        if (savedTheme === 'dark') {
            body.setAttribute('data-theme', 'dark');
            if (themeToggleBtn) {
                themeToggleBtn.textContent = '☀️';
            }
        } else {
            body.setAttribute('data-theme', 'light');
            if (themeToggleBtn) {
                themeToggleBtn.textContent = '🌙';
            }
        }
    }

    toggleTheme() {
        const body = document.body;
        const themeToggleBtn = document.getElementById('theme-toggle');
        const currentTheme = body.getAttribute('data-theme') || 'light';
        
        if (currentTheme === 'light') {
            body.setAttribute('data-theme', 'dark');
            if (themeToggleBtn) {
                themeToggleBtn.textContent = '☀️';
            }
            localStorage.setItem('saveup-theme', 'dark');
        } else {
            body.setAttribute('data-theme', 'light');
            if (themeToggleBtn) {
                themeToggleBtn.textContent = '🌙';
            }
            localStorage.setItem('saveup-theme', 'light');
        }
        
        // Show theme change confirmation
        this.showToast(`Switched to ${currentTheme === 'light' ? 'dark' : 'light'} theme`, 'info');
    }
}

// Add CSS animations for toast
const toastStyles = document.createElement('style');
toastStyles.textContent = `
    @keyframes toastSlideIn {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
    
    @keyframes toastSlideOut {
        from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        to {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        }
    }
`;
document.head.appendChild(toastStyles);

// Initialize the mobile app
let mobileApp;
document.addEventListener('DOMContentLoaded', () => {
    // Check library availability on initialization
    console.log('Checking libraries on DOM ready:');
    console.log('QRCode library:', typeof window.QRCode);
    console.log('Html5Qrcode library:', typeof window.Html5Qrcode);
    
    mobileApp = new SaveUpMobileApp();
    
    // Make it globally accessible for debugging
    window.saveUpApp = mobileApp;
    
    console.log('SaveUp Mobile App initialized successfully');
    
    // If QRCode library isn't available, try to wait for it
    if (typeof window.QRCode === 'undefined') {
        console.warn('QRCode library not ready, waiting...');
        setTimeout(() => {
            console.log('After delay - QRCode library:', typeof window.QRCode);
        }, 1500);
    }
});