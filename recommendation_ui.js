/**
 * RecommendationUI - Professional UI components for fitness recommendations
 * Integrates with PersonalizedRecommendationEngine to display beautiful recommendation cards
 * Matches the existing app's teal/blue gradient design system
 */

class RecommendationUI {
    constructor() {
        this.version = "1.0.0";
        this.engine = new PersonalizedRecommendationEngine();
        this.categories = [
            {
                id: 'activity',
                title: 'Activity & Workout',
                icon: '🏋️‍♂️',
                color: '#667eea',
                description: 'Optimize your training routine'
            },
            {
                id: 'nutrition',
                title: 'Nutrition & Fuel',
                icon: '🥗',
                color: '#4CAF50',
                description: 'Power your body effectively'
            },
            {
                id: 'sleep',
                title: 'Sleep & Recovery',
                icon: '😴',
                color: '#9C27B0',
                description: 'Maximize rest and recovery'
            },
            {
                id: 'mindHealth',
                title: 'Mind & Wellness',
                icon: '🧘‍♀️',
                color: '#FF5722',
                description: 'Mental health and stress relief'
            },
            {
                id: 'social',
                title: 'Social & Community',
                icon: '👥',
                color: '#2196F3',
                description: 'Build connections and motivation'
            },
            {
                id: 'financial',
                title: 'Budget & Savings',
                icon: '💰',
                color: '#FF9800',
                description: 'Stay healthy without breaking the bank'
            }
        ];
    }

    /**
     * Generate complete HTML structure for Section 3.3
     */
    generateRecommendationSection() {
        return `
        <div class="section-header">
            <h2 style="color: black; font-size: 1.8rem; font-weight: bold; margin: 20px 0; text-align: center; border-bottom: 3px solid #60c4de; padding-bottom: 10px;">
                Section 3.3: Personalized Recommendations
            </h2>
        </div>
        
        <div id="recommendationContainer" class="recommendation-main-container">
            <div class="recommendation-intro">
                <div class="intro-content">
                    <h3>🎯 Your Personal AI Wellness Coach</h3>
                    <p>Get instant, tailored advice based on your workout data, age, and fitness goals. Each recommendation is designed specifically for you!</p>
                </div>
            </div>
            
            <div id="recommendationCards" class="recommendation-cards-grid">
                <!-- Recommendation cards will be populated here -->
            </div>
            
            <div class="recommendation-footer">
                <p class="footer-note">💡 Recommendations update automatically based on your workout data. No training required - instant personalized advice!</p>
            </div>
        </div>
        `;
    }

    /**
     * Generate individual recommendation card HTML
     */
    generateRecommendationCard(category, recommendations) {
        const priorityClass = this.getPriorityClass(category.id);
        const visibleRecs = recommendations.slice(0, 2); // Show first 2 by default
        const hiddenRecs = recommendations.slice(2); // Hide remaining
        
        return `
        <div class="recommendation-card ${priorityClass}" data-category="${category.id}">
            <div class="card-header">
                <div class="card-icon" style="background: linear-gradient(135deg, ${category.color} 0%, ${this.darkenColor(category.color)} 100%)">
                    <span class="icon-emoji">${category.icon}</span>
                </div>
                <div class="card-title-section">
                    <h4 class="card-title">${category.title}</h4>
                    <p class="card-description">${category.description}</p>
                </div>
                <div class="priority-badge ${priorityClass}">
                    ${this.getPriorityText(category.id)}
                </div>
            </div>
            
            <div class="card-content">
                <div class="recommendations-list">
                    ${visibleRecs.map((rec, index) => `
                        <div class="recommendation-item visible" data-index="${index}">
                            <div class="rec-bullet"></div>
                            <div class="rec-text">${rec}</div>
                        </div>
                    `).join('')}
                    
                    ${hiddenRecs.length > 0 ? `
                        <div class="hidden-recommendations" style="display: none;">
                            ${hiddenRecs.map((rec, index) => `
                                <div class="recommendation-item hidden" data-index="${index + 2}">
                                    <div class="rec-bullet"></div>
                                    <div class="rec-text">${rec}</div>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                
                ${hiddenRecs.length > 0 ? `
                    <button class="show-more-btn" onclick="recommendationUI.toggleMoreRecommendations('${category.id}')">
                        <span class="btn-text">Show ${hiddenRecs.length} More</span>
                        <span class="btn-icon">▼</span>
                    </button>
                ` : ''}
            </div>
            
            <div class="card-footer">
                <div class="last-updated">Updated just now</div>
                <div class="category-stats">${recommendations.length} tips available</div>
            </div>
        </div>
        `;
    }

    /**
     * Main integration function - call this from the main app
     */
    displayRecommendations(userData) {
        try {
            // Generate recommendations using the engine
            const recommendations = this.engine.generateRecommendations(userData);
            
            // Get the cards container
            const cardsContainer = document.getElementById('recommendationCards');
            if (!cardsContainer) {
                console.error('Recommendation cards container not found');
                return;
            }

            // Generate HTML for all cards
            let cardsHTML = '';
            this.categories.forEach(category => {
                const categoryRecs = recommendations[category.id];
                if (categoryRecs && categoryRecs.length > 0) {
                    cardsHTML += this.generateRecommendationCard(category, categoryRecs);
                }
            });

            // Update the DOM
            cardsContainer.innerHTML = cardsHTML;

            // Add entrance animations
            this.animateCardsIn();

            // Show success message
            this.showUpdateNotification();

        } catch (error) {
            console.error('Error displaying recommendations:', error);
            this.showErrorMessage();
        }
    }

    /**
     * Toggle show/hide more recommendations
     */
    toggleMoreRecommendations(categoryId) {
        const card = document.querySelector(`[data-category="${categoryId}"]`);
        const hiddenContainer = card.querySelector('.hidden-recommendations');
        const button = card.querySelector('.show-more-btn');
        const buttonText = button.querySelector('.btn-text');
        const buttonIcon = button.querySelector('.btn-icon');

        if (hiddenContainer.style.display === 'none') {
            // Show more recommendations
            hiddenContainer.style.display = 'block';
            hiddenContainer.style.animation = 'slideDown 0.3s ease-out';
            buttonText.textContent = 'Show Less';
            buttonIcon.textContent = '▲';
            buttonIcon.style.transform = 'rotate(180deg)';
        } else {
            // Hide recommendations
            hiddenContainer.style.animation = 'slideUp 0.3s ease-out';
            setTimeout(() => {
                hiddenContainer.style.display = 'none';
                const hiddenCount = hiddenContainer.children.length;
                buttonText.textContent = `Show ${hiddenCount} More`;
                buttonIcon.textContent = '▼';
                buttonIcon.style.transform = 'rotate(0deg)';
            }, 300);
        }
    }

    /**
     * Animate cards entrance
     */
    animateCardsIn() {
        const cards = document.querySelectorAll('.recommendation-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            
            setTimeout(() => {
                card.style.transition = 'all 0.6s ease-out';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    /**
     * Show update notification
     */
    showUpdateNotification() {
        const notification = document.createElement('div');
        notification.className = 'update-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">✨</span>
                <span class="notification-text">Recommendations updated based on your workout!</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        }, 100);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-100%)';
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 3000);
    }

    /**
     * Show error message
     */
    showErrorMessage() {
        const cardsContainer = document.getElementById('recommendationCards');
        cardsContainer.innerHTML = `
            <div class="error-message">
                <div class="error-icon">⚠️</div>
                <h3>Unable to load recommendations</h3>
                <p>Please ensure you've filled out the workout form completely.</p>
                <button onclick="location.reload()" class="retry-btn">Try Again</button>
            </div>
        `;
    }

    /**
     * Helper functions
     */
    getPriorityClass(categoryId) {
        const priorities = {
            'nutrition': 'high-priority',
            'activity': 'high-priority',
            'sleep': 'medium-priority',
            'mindHealth': 'medium-priority',
            'social': 'low-priority',
            'financial': 'low-priority'
        };
        return priorities[categoryId] || 'medium-priority';
    }

    getPriorityText(categoryId) {
        const priorities = {
            'nutrition': 'Essential',
            'activity': 'Essential',
            'sleep': 'Important',
            'mindHealth': 'Important',
            'social': 'Helpful',
            'financial': 'Helpful'
        };
        return priorities[categoryId] || 'Important';
    }

    darkenColor(color) {
        // Simple color darkening for gradients
        const colorMap = {
            '#667eea': '#5a6fd8',
            '#4CAF50': '#45a049',
            '#9C27B0': '#8e24aa',
            '#FF5722': '#e64a19',
            '#2196F3': '#1976d2',
            '#FF9800': '#f57c00'
        };
        return colorMap[color] || color;
    }

    /**
     * Initialize the UI system
     */
    init() {
        // Add CSS styles to the page
        this.injectStyles();
        console.log('RecommendationUI initialized successfully');
    }

    /**
     * Inject CSS styles
     */
    injectStyles() {
        const styles = `
        <style id="recommendation-ui-styles">
        /* Main Container */
        .recommendation-main-container {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            border-radius: 24px;
            padding: 32px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            margin: 20px 0;
        }

        /* Intro Section */
        .recommendation-intro {
            text-align: center;
            margin-bottom: 32px;
            padding: 24px;
            background: linear-gradient(135deg, rgba(96, 196, 222, 0.1) 0%, rgba(102, 126, 234, 0.1) 100%);
            border-radius: 16px;
        }

        .recommendation-intro h3 {
            color: black;
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 12px;
        }

        .recommendation-intro p {
            color: rgba(0, 0, 0, 0.8);
            font-size: 1rem;
            line-height: 1.5;
        }

        /* Cards Grid */
        .recommendation-cards-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
            gap: 24px;
            margin: 32px 0;
        }

        @media (max-width: 768px) {
            .recommendation-cards-grid {
                grid-template-columns: 1fr;
                gap: 16px;
            }
        }

        /* Individual Cards */
        .recommendation-card {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 16px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.3);
            overflow: hidden;
            transition: all 0.3s ease;
            position: relative;
        }

        .recommendation-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
        }

        .recommendation-card.high-priority {
            border-left: 4px solid #4CAF50;
        }

        .recommendation-card.medium-priority {
            border-left: 4px solid #2196F3;
        }

        .recommendation-card.low-priority {
            border-left: 4px solid #FF9800;
        }

        /* Card Header */
        .card-header {
            display: flex;
            align-items: center;
            padding: 20px;
            background: linear-gradient(135deg, rgba(96, 196, 222, 0.05) 0%, rgba(102, 126, 234, 0.05) 100%);
            border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }

        .card-icon {
            width: 50px;
            height: 50px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 16px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .icon-emoji {
            font-size: 1.5rem;
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
        }

        .card-title-section {
            flex: 1;
        }

        .card-title {
            color: black;
            font-size: 1.1rem;
            font-weight: 700;
            margin: 0 0 4px 0;
        }

        .card-description {
            color: rgba(0, 0, 0, 0.6);
            font-size: 0.85rem;
            margin: 0;
        }

        .priority-badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.7rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .priority-badge.high-priority {
            background: rgba(76, 175, 80, 0.1);
            color: #2E7D32;
        }

        .priority-badge.medium-priority {
            background: rgba(33, 150, 243, 0.1);
            color: #1565C0;
        }

        .priority-badge.low-priority {
            background: rgba(255, 152, 0, 0.1);
            color: #E65100;
        }

        /* Card Content */
        .card-content {
            padding: 20px;
        }

        .recommendations-list {
            margin-bottom: 16px;
        }

        .recommendation-item {
            display: flex;
            align-items: flex-start;
            margin-bottom: 16px;
            padding: 12px;
            background: rgba(96, 196, 222, 0.03);
            border-radius: 8px;
            border-left: 3px solid #60c4de;
        }

        .rec-bullet {
            width: 6px;
            height: 6px;
            background: #60c4de;
            border-radius: 50%;
            margin-top: 8px;
            margin-right: 12px;
            flex-shrink: 0;
        }

        .rec-text {
            color: rgba(0, 0, 0, 0.85);
            font-size: 0.9rem;
            line-height: 1.5;
            font-weight: 500;
        }

        /* Show More Button */
        .show-more-btn {
            width: 100%;
            padding: 12px;
            background: linear-gradient(135deg, #60c4de 0%, #667eea 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 0.85rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        .show-more-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .btn-icon {
            transition: transform 0.3s ease;
            font-size: 0.7rem;
        }

        /* Card Footer */
        .card-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 20px;
            background: rgba(0, 0, 0, 0.02);
            border-top: 1px solid rgba(0, 0, 0, 0.05);
            font-size: 0.75rem;
            color: rgba(0, 0, 0, 0.6);
        }

        /* Footer */
        .recommendation-footer {
            text-align: center;
            padding: 24px;
            border-top: 1px solid rgba(255, 255, 255, 0.2);
            margin-top: 24px;
        }

        .footer-note {
            color: rgba(0, 0, 0, 0.7);
            font-size: 0.9rem;
            font-style: italic;
        }

        /* Animations */
        @keyframes slideDown {
            from { opacity: 0; max-height: 0; }
            to { opacity: 1; max-height: 500px; }
        }

        @keyframes slideUp {
            from { opacity: 1; max-height: 500px; }
            to { opacity: 0; max-height: 0; }
        }

        /* Update Notification */
        .update-notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(76, 175, 80, 0.3);
            z-index: 1000;
            opacity: 0;
            transform: translateY(-100%);
            transition: all 0.3s ease;
        }

        .notification-content {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .notification-icon {
            font-size: 1.2rem;
        }

        .notification-text {
            font-weight: 600;
            font-size: 0.9rem;
        }

        /* Error Message */
        .error-message {
            text-align: center;
            padding: 40px 20px;
            background: rgba(255, 255, 255, 0.9);
            border-radius: 16px;
            border: 2px dashed rgba(255, 87, 34, 0.3);
        }

        .error-icon {
            font-size: 3rem;
            margin-bottom: 16px;
        }

        .error-message h3 {
            color: #FF5722;
            margin-bottom: 8px;
        }

        .error-message p {
            color: rgba(0, 0, 0, 0.7);
            margin-bottom: 20px;
        }

        .retry-btn {
            background: #FF5722;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .retry-btn:hover {
            background: #e64a19;
            transform: translateY(-1px);
        }
        </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }
}

// Initialize global instance
const recommendationUI = new RecommendationUI();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => recommendationUI.init());
} else {
    recommendationUI.init();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RecommendationUI;
}

// Make available globally
window.RecommendationUI = RecommendationUI;
window.recommendationUI = recommendationUI;