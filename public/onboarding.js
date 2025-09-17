// CryptoCrowe - Interactive Onboarding Flow

class OnboardingTour {
    constructor() {
        this.currentStep = 0;
        this.steps = [
            {
                element: '.logo',
                title: 'Welcome to CryptoCrowe! 🚀',
                content: 'Your automated crypto trading platform. Let me show you around.',
                position: 'bottom'
            },
            {
                element: '#connectWallet',
                title: 'Connect Your Wallet',
                content: 'Start by connecting your wallet using MetaMask, WalletConnect, or Web3Auth.',
                position: 'bottom',
                action: 'pulse'
            },
            {
                element: '.stats-grid',
                title: 'Portfolio Overview',
                content: 'Track your portfolio value, P&L, active trades, and win rate in real-time.',
                position: 'top'
            },
            {
                element: '.market-list',
                title: 'Market Data',
                content: 'View live prices from multiple exchanges. Click any pair to start trading.',
                position: 'right'
            },
            {
                element: '#priceChart',
                title: 'Professional Charts',
                content: 'Analyze price movements with TradingView charts and technical indicators.',
                position: 'left'
            },
            {
                element: '.order-form',
                title: 'Place Orders',
                content: 'Execute market, limit, and stop-loss orders across multiple exchanges.',
                position: 'left'
            },
            {
                element: '.btn-outline',
                title: 'Automated Trading',
                content: 'Configure the bot to trade 24/7 using proven strategies.',
                position: 'top',
                action: 'glow'
            },
            {
                element: '.activity-feed',
                title: 'Activity Monitor',
                content: 'Track all your trades and bot actions in real-time.',
                position: 'top'
            }
        ];

        this.overlay = null;
        this.tooltip = null;
        this.isActive = false;

        // Check if user is new
        this.checkNewUser();
    }

    checkNewUser() {
        const hasSeenTour = localStorage.getItem('cryptocrowe_tour_completed');
        const skipTour = localStorage.getItem('cryptocrowe_skip_tour');

        if (!hasSeenTour && !skipTour) {
            // Delay tour start for page load
            setTimeout(() => {
                this.showWelcome();
            }, 2000);
        }
    }

    showWelcome() {
        // Check if modal already exists
        if (document.querySelector('.onboarding-welcome')) {
            return;
        }

        const welcomeModal = document.createElement('div');
        welcomeModal.className = 'onboarding-welcome';

        // Add ESC key listener
        welcomeModal.addEventListener('click', (e) => {
            if (e.target === welcomeModal) {
                this.skip();
            }
        });

        welcomeModal.innerHTML = `
            <div class="welcome-content">
                <div class="welcome-icon">
                    <img src="logo.svg" alt="CryptoCrowe" style="width: 80px; height: 80px;">
                </div>
                <h2>Welcome to CryptoCrowe! 🎉</h2>
                <p>Ready to start automated crypto trading?</p>
                <p class="welcome-subtitle">Let us show you how to get started in just 2 minutes.</p>

                <div class="welcome-features">
                    <div class="feature-item">
                        <i class="fas fa-chart-line"></i>
                        <span>Real-time Trading</span>
                    </div>
                    <div class="feature-item">
                        <i class="fas fa-robot"></i>
                        <span>AI-Powered Bot</span>
                    </div>
                    <div class="feature-item">
                        <i class="fas fa-exchange-alt"></i>
                        <span>Multi-Exchange</span>
                    </div>
                </div>

                <div class="welcome-actions">
                    <button class="btn btn-primary" id="startTourBtn">
                        <i class="fas fa-play"></i> Start Tour
                    </button>
                    <button class="btn btn-outline" id="skipTourBtn">
                        Skip for now
                    </button>
                </div>
                <button class="close-welcome" id="closeWelcomeBtn" aria-label="Close">
                    <i class="fas fa-times"></i>
                </button>

                <div class="welcome-footer">
                    <label>
                        <input type="checkbox" id="dontShowAgain">
                        Don't show this again
                    </label>
                </div>
            </div>
        `;

        document.body.appendChild(welcomeModal);

        // Add event listeners to buttons
        const startBtn = document.getElementById('startTourBtn');
        const skipBtn = document.getElementById('skipTourBtn');
        const closeBtn = document.getElementById('closeWelcomeBtn');

        if (startBtn) {
            startBtn.addEventListener('click', () => this.start());
        }
        if (skipBtn) {
            skipBtn.addEventListener('click', () => this.skip());
        }
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.skip());
        }

        // Add entrance animation
        setTimeout(() => {
            welcomeModal.classList.add('show');
        }, 100);
    }

    start() {
        this.isActive = true;
        this.currentStep = 0;

        // Remove welcome modal
        const welcomeModal = document.querySelector('.onboarding-welcome');
        if (welcomeModal) {
            welcomeModal.remove();
        }

        // Create overlay
        this.createOverlay();

        // Start first step
        this.showStep(this.currentStep);

        // Add keyboard navigation
        this.addKeyboardListeners();
    }

    skip() {
        const dontShow = document.getElementById('dontShowAgain');
        if (dontShow && dontShow.checked) {
            localStorage.setItem('cryptocrowe_skip_tour', 'true');
        } else {
            localStorage.setItem('cryptocrowe_tour_skipped_once', 'true');
        }

        const welcomeModal = document.querySelector('.onboarding-welcome');
        if (welcomeModal) {
            welcomeModal.classList.remove('show');
            setTimeout(() => {
                welcomeModal.remove();
            }, 300);
        }

        this.cleanup();
    }

    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'onboarding-overlay';
        document.body.appendChild(this.overlay);

        // Add click handler to skip
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.next();
            }
        });
    }

    showStep(index) {
        if (index >= this.steps.length) {
            this.complete();
            return;
        }

        const step = this.steps[index];
        const element = document.querySelector(step.element);

        if (!element) {
            this.next();
            return;
        }

        // Highlight element
        this.highlightElement(element, step.action);

        // Show tooltip
        this.showTooltip(element, step);

        // Update progress
        this.updateProgress();
    }

    highlightElement(element, action) {
        // Remove previous highlights
        document.querySelectorAll('.onboarding-highlight').forEach(el => {
            el.classList.remove('onboarding-highlight', 'pulse-highlight', 'glow-highlight');
        });

        // Add new highlight
        element.classList.add('onboarding-highlight');

        if (action === 'pulse') {
            element.classList.add('pulse-highlight');
        } else if (action === 'glow') {
            element.classList.add('glow-highlight');
        }

        // Scroll to element
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }

    showTooltip(element, step) {
        // Remove existing tooltip
        if (this.tooltip) {
            this.tooltip.remove();
        }

        // Create new tooltip
        this.tooltip = document.createElement('div');
        this.tooltip.className = `onboarding-tooltip ${step.position}`;
        this.tooltip.innerHTML = `
            <div class="tooltip-header">
                <h4>${step.title}</h4>
                <button class="tooltip-close" onclick="onboardingTour.end()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="tooltip-content">
                ${step.content}
            </div>
            <div class="tooltip-footer">
                <div class="tooltip-progress">
                    Step ${this.currentStep + 1} of ${this.steps.length}
                </div>
                <div class="tooltip-actions">
                    ${this.currentStep > 0 ? '<button class="btn btn-sm" onclick="onboardingTour.previous()">Previous</button>' : ''}
                    <button class="btn btn-primary btn-sm" onclick="onboardingTour.next()">
                        ${this.currentStep === this.steps.length - 1 ? 'Finish' : 'Next'}
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(this.tooltip);

        // Position tooltip
        this.positionTooltip(element, step.position);

        // Add entrance animation
        setTimeout(() => {
            this.tooltip.classList.add('show');
        }, 100);
    }

    positionTooltip(element, position) {
        const rect = element.getBoundingClientRect();
        const tooltipRect = this.tooltip.getBoundingClientRect();

        let top, left;

        switch (position) {
            case 'top':
                top = rect.top - tooltipRect.height - 20;
                left = rect.left + (rect.width - tooltipRect.width) / 2;
                break;
            case 'bottom':
                top = rect.bottom + 20;
                left = rect.left + (rect.width - tooltipRect.width) / 2;
                break;
            case 'left':
                top = rect.top + (rect.height - tooltipRect.height) / 2;
                left = rect.left - tooltipRect.width - 20;
                break;
            case 'right':
                top = rect.top + (rect.height - tooltipRect.height) / 2;
                left = rect.right + 20;
                break;
        }

        // Ensure tooltip stays within viewport
        top = Math.max(20, Math.min(top, window.innerHeight - tooltipRect.height - 20));
        left = Math.max(20, Math.min(left, window.innerWidth - tooltipRect.width - 20));

        this.tooltip.style.top = `${top}px`;
        this.tooltip.style.left = `${left}px`;
    }

    updateProgress() {
        const progress = ((this.currentStep + 1) / this.steps.length) * 100;

        // Update progress bar if exists
        const progressBar = document.querySelector('.onboarding-progress-bar');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
    }

    next() {
        this.currentStep++;
        this.showStep(this.currentStep);
    }

    previous() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.showStep(this.currentStep);
        }
    }

    end() {
        this.cleanup();
        this.showEndMessage('Tour ended. You can restart it from the help menu.');
    }

    complete() {
        this.cleanup();
        localStorage.setItem('cryptocrowe_tour_completed', 'true');
        this.showEndMessage('🎉 Tour complete! You\'re ready to start trading.');

        // Show quick actions
        this.showQuickActions();
    }

    cleanup() {
        this.isActive = false;

        // Remove overlay
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }

        // Remove tooltip
        if (this.tooltip) {
            this.tooltip.remove();
            this.tooltip = null;
        }

        // Remove highlights
        document.querySelectorAll('.onboarding-highlight').forEach(el => {
            el.classList.remove('onboarding-highlight', 'pulse-highlight', 'glow-highlight');
        });

        // Remove keyboard listeners
        this.removeKeyboardListeners();
    }

    showEndMessage(message) {
        const toast = document.createElement('div');
        toast.className = 'toast success';
        toast.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;

        const container = document.getElementById('toastContainer') || document.body;
        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        setTimeout(() => {
            toast.remove();
        }, 5000);
    }

    showQuickActions() {
        const quickActions = document.createElement('div');
        quickActions.className = 'quick-actions-popup';
        quickActions.innerHTML = `
            <div class="quick-actions-content">
                <h3>Quick Start Actions</h3>
                <div class="quick-actions-grid">
                    <button class="quick-action" onclick="document.getElementById('connectWallet').click()">
                        <i class="fas fa-wallet"></i>
                        <span>Connect Wallet</span>
                    </button>
                    <button class="quick-action" onclick="window.location.href='#settings'">
                        <i class="fas fa-key"></i>
                        <span>Add API Keys</span>
                    </button>
                    <button class="quick-action" onclick="showAutomationSettings()">
                        <i class="fas fa-robot"></i>
                        <span>Configure Bot</span>
                    </button>
                    <button class="quick-action" onclick="window.location.href='#help'">
                        <i class="fas fa-question-circle"></i>
                        <span>Get Help</span>
                    </button>
                </div>
                <button class="btn btn-primary" onclick="this.parentElement.parentElement.remove()">
                    Get Started
                </button>
            </div>
        `;

        document.body.appendChild(quickActions);

        setTimeout(() => {
            quickActions.classList.add('show');
        }, 100);
    }

    addKeyboardListeners() {
        this.keyHandler = (e) => {
            if (!this.isActive) return;

            switch(e.key) {
                case 'ArrowRight':
                case 'Enter':
                    this.next();
                    break;
                case 'ArrowLeft':
                    this.previous();
                    break;
                case 'Escape':
                    this.end();
                    break;
            }
        };

        document.addEventListener('keydown', this.keyHandler);
    }

    removeKeyboardListeners() {
        if (this.keyHandler) {
            document.removeEventListener('keydown', this.keyHandler);
        }
    }

    // Restart tour from help menu
    restart() {
        this.start();
    }
}

// Initialize onboarding when page loads
let onboardingTour;
document.addEventListener('DOMContentLoaded', () => {
    // Create global instance
    window.onboardingTour = new OnboardingTour();
    onboardingTour = window.onboardingTour;

    // Add global ESC key handler
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const welcomeModal = document.querySelector('.onboarding-welcome');
            if (welcomeModal && onboardingTour) {
                onboardingTour.skip();
            }
        }
    });
});

// Add styles for onboarding
const onboardingStyles = `
<style>
/* Onboarding Styles */
.onboarding-welcome {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: all;
}

.onboarding-welcome.show {
    opacity: 1;
}

.welcome-content {
    background: linear-gradient(135deg, #1e3a5f, #0a1628);
    border: 2px solid rgba(77, 208, 225, 0.3);
    border-radius: 20px;
    padding: 40px;
    max-width: 500px;
    text-align: center;
    animation: scaleIn 0.3s ease;
    position: relative;
}

.close-welcome {
    position: absolute;
    top: 15px;
    right: 15px;
    background: transparent;
    border: none;
    color: #94a3b8;
    font-size: 24px;
    cursor: pointer;
    transition: color 0.3s;
    z-index: 10001;
}

.close-welcome:hover {
    color: #ef4444;
}

.welcome-icon {
    margin-bottom: 20px;
}

.welcome-content h2 {
    color: #4dd0e1;
    margin-bottom: 10px;
    font-size: 28px;
}

.welcome-subtitle {
    color: #94a3b8;
    margin-bottom: 30px;
}

.welcome-features {
    display: flex;
    justify-content: space-around;
    margin: 30px 0;
}

.feature-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
}

.feature-item i {
    font-size: 24px;
    color: #4dd0e1;
}

.welcome-actions {
    display: flex;
    gap: 15px;
    justify-content: center;
    margin: 30px 0;
}

.welcome-footer {
    margin-top: 20px;
    color: #64748b;
}

.onboarding-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    z-index: 9998;
}

.onboarding-highlight {
    position: relative;
    z-index: 9999;
    box-shadow: 0 0 0 4px rgba(77, 208, 225, 0.4);
    border-radius: 8px;
}

.pulse-highlight {
    animation: pulse 2s infinite;
}

.glow-highlight {
    animation: glow 2s ease-in-out infinite alternate;
}

.onboarding-tooltip {
    position: fixed;
    background: linear-gradient(135deg, #1e3a5f, #0a1628);
    border: 2px solid rgba(77, 208, 225, 0.3);
    border-radius: 12px;
    padding: 20px;
    max-width: 350px;
    z-index: 10001;
    opacity: 0;
    transform: translateY(10px);
    transition: all 0.3s ease;
}

.onboarding-tooltip.show {
    opacity: 1;
    transform: translateY(0);
}

.onboarding-tooltip::before {
    content: '';
    position: absolute;
    width: 12px;
    height: 12px;
    background: #1e3a5f;
    border: 2px solid rgba(77, 208, 225, 0.3);
    transform: rotate(45deg);
}

.onboarding-tooltip.top::before {
    bottom: -8px;
    left: 50%;
    transform: translateX(-50%) rotate(45deg);
}

.onboarding-tooltip.bottom::before {
    top: -8px;
    left: 50%;
    transform: translateX(-50%) rotate(45deg);
}

.onboarding-tooltip.left::before {
    right: -8px;
    top: 50%;
    transform: translateY(-50%) rotate(45deg);
}

.onboarding-tooltip.right::before {
    left: -8px;
    top: 50%;
    transform: translateY(-50%) rotate(45deg);
}

.tooltip-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}

.tooltip-header h4 {
    color: #4dd0e1;
    margin: 0;
}

.tooltip-close {
    background: none;
    border: none;
    color: #64748b;
    cursor: pointer;
    font-size: 18px;
}

.tooltip-close:hover {
    color: #ef4444;
}

.tooltip-content {
    color: #e2e8f0;
    margin-bottom: 20px;
    line-height: 1.5;
}

.tooltip-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.tooltip-progress {
    color: #64748b;
    font-size: 14px;
}

.tooltip-actions {
    display: flex;
    gap: 10px;
}

.quick-actions-popup {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0.9);
    background: linear-gradient(135deg, #1e3a5f, #0a1628);
    border: 2px solid rgba(77, 208, 225, 0.3);
    border-radius: 20px;
    padding: 30px;
    z-index: 10000;
    opacity: 0;
    transition: all 0.3s ease;
}

.quick-actions-popup.show {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
}

.quick-actions-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
    margin: 20px 0;
}

.quick-action {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 20px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.quick-action:hover {
    background: rgba(77, 208, 225, 0.1);
    border-color: rgba(77, 208, 225, 0.3);
    transform: translateY(-2px);
}

.quick-action i {
    font-size: 24px;
    color: #4dd0e1;
}

.quick-action span {
    color: #e2e8f0;
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', onboardingStyles);