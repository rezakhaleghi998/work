/**
 * Test Suite for User Summary Index System
 * Run this in browser console to verify functionality
 */

class SummaryIndexTester {
    constructor() {
        this.testResults = [];
    }

    runAllTests() {
        console.log('🧪 Running User Summary Index Test Suite...');
        console.log('='.repeat(50));

        this.testIndexCalculation();
        this.testHistoryStorage();
        this.testComparisons();
        this.testUIIntegration();

        this.printResults();
    }

    testIndexCalculation() {
        console.log('📊 Testing Index Calculation...');
        
        try {
            // Create test instance
            const summaryIndex = new UserSummaryIndex();
            
            // Test with no data
            const emptyIndex = summaryIndex.calculateCurrentIndex('test_user');
            this.assert(emptyIndex.score === 0, 'Empty index should return 0 score');
            this.assert(emptyIndex.level === 'New User', 'Empty index should return New User level');
            
            // Create mock workout data
            this.createMockWorkoutData();
            
            // Test with data
            const indexWithData = summaryIndex.calculateCurrentIndex('test_user');
            this.assert(indexWithData.score >= 0 && indexWithData.score <= 100, 'Index score should be between 0-100');
            this.assert(indexWithData.components, 'Index should have components breakdown');
            this.assert(indexWithData.insights && indexWithData.insights.length > 0, 'Index should have insights');
            
            console.log('✅ Index calculation tests passed');
        } catch (error) {
            console.error('❌ Index calculation test failed:', error);
            this.testResults.push({ test: 'Index Calculation', status: 'FAILED', error: error.message });
            return;
        }

        this.testResults.push({ test: 'Index Calculation', status: 'PASSED' });
    }

    testHistoryStorage() {
        console.log('💾 Testing History Storage...');
        
        try {
            const summaryIndex = new UserSummaryIndex();
            
            // Test saving index to history
            const testIndex = {
                score: 75,
                level: 'Intermediate',
                components: { consistency: 70, performance: 80 },
                timestamp: new Date().toISOString(),
                totalWorkouts: 5
            };
            
            const saveResult = summaryIndex.saveIndexToHistory('test_user', testIndex);
            this.assert(saveResult, 'Should save index to history successfully');
            
            // Test retrieving history
            const history = summaryIndex.getIndexHistory('test_user', 30);
            this.assert(Array.isArray(history), 'History should return an array');
            
            console.log('✅ History storage tests passed');
        } catch (error) {
            console.error('❌ History storage test failed:', error);
            this.testResults.push({ test: 'History Storage', status: 'FAILED', error: error.message });
            return;
        }

        this.testResults.push({ test: 'History Storage', status: 'PASSED' });
    }

    testComparisons() {
        console.log('📈 Testing Comparisons...');
        
        try {
            const summaryIndex = new UserSummaryIndex();
            
            // Create historical data for comparison
            const now = new Date();
            const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
            
            // Save historical data
            summaryIndex.saveIndexToHistory('test_user', {
                score: 60,
                level: 'Developing',
                timestamp: weekAgo.toISOString()
            });
            
            summaryIndex.saveIndexToHistory('test_user', {
                score: 70,
                level: 'Intermediate',
                timestamp: now.toISOString()
            });
            
            // Test comparison
            const comparison = summaryIndex.compareWithPrevious('test_user', 7);
            if (comparison) {
                this.assert(comparison.hasOwnProperty('difference'), 'Comparison should have difference');
                this.assert(comparison.hasOwnProperty('trend'), 'Comparison should have trend');
            }
            
            // Test trend analysis
            const trendAnalysis = summaryIndex.getTrendAnalysis('test_user', 14);
            this.assert(trendAnalysis.hasOwnProperty('trend'), 'Trend analysis should have trend property');
            
            console.log('✅ Comparison tests passed');
        } catch (error) {
            console.error('❌ Comparison test failed:', error);
            this.testResults.push({ test: 'Comparisons', status: 'FAILED', error: error.message });
            return;
        }

        this.testResults.push({ test: 'Comparisons', status: 'PASSED' });
    }

    testUIIntegration() {
        console.log('🎨 Testing UI Integration...');
        
        try {
            // Check if UI classes are available
            this.assert(typeof UserSummaryIndex !== 'undefined', 'UserSummaryIndex class should be available');
            this.assert(typeof SummaryIndexUI !== 'undefined', 'SummaryIndexUI class should be available');
            
            // Check if instances are created
            this.assert(window.summaryIndexInstance, 'Global summaryIndexInstance should exist');
            this.assert(window.summaryIndexUI, 'Global summaryIndexUI should exist');
            
            // Check if panel is added to DOM
            const summaryPanel = document.getElementById('summaryIndexPanel');
            this.assert(summaryPanel !== null, 'Summary panel should be added to DOM');
            
            console.log('✅ UI integration tests passed');
        } catch (error) {
            console.error('❌ UI integration test failed:', error);
            this.testResults.push({ test: 'UI Integration', status: 'FAILED', error: error.message });
            return;
        }

        this.testResults.push({ test: 'UI Integration', status: 'PASSED' });
    }

    createMockWorkoutData() {
        // Create realistic workout history for testing
        const mockWorkouts = [
            {
                calories: 350, duration: 30, workoutType: 'Running', intensity: 'Medium',
                heartRate: 140, age: 25, efficiency: 75, timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                calories: 420, duration: 45, workoutType: 'Cycling', intensity: 'High',
                heartRate: 160, age: 25, efficiency: 82, timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                calories: 280, duration: 25, workoutType: 'Boxing', intensity: 'High',
                heartRate: 155, age: 25, efficiency: 78, timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];

        // Save mock workouts to localStorage
        localStorage.setItem('workoutHistory', JSON.stringify(mockWorkouts));
    }

    assert(condition, message) {
        if (!condition) {
            throw new Error(`Assertion failed: ${message}`);
        }
    }

    printResults() {
        console.log('='.repeat(50));
        console.log('📋 Test Results Summary:');
        console.log('='.repeat(50));

        this.testResults.forEach(result => {
            const icon = result.status === 'PASSED' ? '✅' : '❌';
            console.log(`${icon} ${result.test}: ${result.status}`);
            if (result.error) {
                console.log(`   Error: ${result.error}`);
            }
        });

        const passedTests = this.testResults.filter(r => r.status === 'PASSED').length;
        const totalTests = this.testResults.length;
        
        console.log('='.repeat(50));
        console.log(`🎯 Tests Passed: ${passedTests}/${totalTests}`);
        
        if (passedTests === totalTests) {
            console.log('🎉 All tests passed! User Summary Index system is working correctly.');
        } else {
            console.log('⚠️  Some tests failed. Please check the errors above.');
        }
    }

    // Quick demo function
    demonstrateFeatures() {
        console.log('🎪 Demonstrating User Summary Index Features...');
        console.log('='.repeat(50));

        try {
            const summaryIndex = new UserSummaryIndex();
            
            // Create demo data
            this.createMockWorkoutData();
            
            // Calculate and show current index
            const currentIndex = summaryIndex.calculateCurrentIndex('demo_user');
            console.log('📊 Current Index:', currentIndex);
            
            // Show comparison
            const comparison = summaryIndex.compareWithPrevious('demo_user', 7);
            if (comparison) {
                console.log('📈 Weekly Comparison:', comparison);
            }
            
            // Show trend analysis
            const trend = summaryIndex.getTrendAnalysis('demo_user', 14);
            console.log('📉 Trend Analysis:', trend);
            
            // Update UI if available
            if (window.summaryIndexUI) {
                window.summaryIndexUI.updateSummaryPanel();
                console.log('🎨 UI Updated successfully');
            }
            
        } catch (error) {
            console.error('❌ Demo failed:', error);
        }
    }
}

// Make tester available globally
window.SummaryIndexTester = SummaryIndexTester;

// Auto-run basic functionality check
setTimeout(() => {
    if (typeof window.summaryIndexInstance !== 'undefined' && window.summaryIndexInstance) {
        console.log('🔍 User Summary Index System detected - running quick validation...');
        const tester = new SummaryIndexTester();
        tester.demonstrateFeatures();
    }
}, 3000); // Wait 3 seconds for system to initialize
