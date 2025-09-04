/**
 * PersonalizedRecommendationEngine
 * Generates instant, specific health and fitness recommendations
 * Based on user data: age, weight, height, workout type, intensity
 */

class PersonalizedRecommendationEngine {
    constructor() {
        this.version = "1.0.0";
        this.initialized = true;
    }

    /**
     * Main method to generate all recommendations
     * @param {Object} userData - User input data from the form
     * @returns {Object} Complete set of recommendations for all 6 categories
     */
    generateRecommendations(userData) {
        // Ensure we have valid user data
        if (!userData || !this.validateUserData(userData)) {
            return this.getDefaultRecommendations();
        }

        const processedData = this.processUserData(userData);
        
        return {
            activity: this.getActivityRecommendations(processedData),
            nutrition: this.getNutritionRecommendations(processedData),
            sleep: this.getSleepRecommendations(processedData),
            mindHealth: this.getMindHealthRecommendations(processedData),
            social: this.getSocialRecommendations(processedData),
            financial: this.getFinancialRecommendations(processedData)
        };
    }

    /**
     * Process and enrich user data with calculated metrics
     */
    processUserData(userData) {
        const bmi = this.calculateBMI(userData.weight, userData.height);
        const ageGroup = this.getAgeGroup(userData.age);
        const activityLevel = this.getActivityLevel(userData.workoutType, userData.duration, userData.intensity);
        const caloriesBurned = userData.calories || 300; // Use calculated calories if available

        return {
            ...userData,
            bmi: bmi,
            bmiCategory: this.getBMICategory(bmi),
            ageGroup: ageGroup,
            activityLevel: activityLevel,
            caloriesBurned: caloriesBurned,
            dailyCalorieNeeds: this.estimateDailyCalories(userData.weight, userData.height, userData.age, userData.gender, activityLevel)
        };
    }

    /**
     * NUTRITION RECOMMENDATIONS
     * Specific food advice based on user metrics
     */
    getNutritionRecommendations(data) {
        const recommendations = [];
        const { ageGroup, bmiCategory, activityLevel, caloriesBurned, dailyCalorieNeeds, workoutType } = data;

        // Post-workout nutrition (within 30 minutes)
        if (caloriesBurned > 250) {
            if (workoutType.toLowerCase().includes('strength') || workoutType.toLowerCase().includes('weight')) {
                recommendations.push("Eat 25g protein within 30 minutes: 1 cup Greek yogurt + 1 banana + 1 tbsp peanut butter");
            } else {
                recommendations.push("Refuel with carbs + protein: 1 slice whole grain toast + 2 eggs + 1/2 avocado");
            }
        } else {
            recommendations.push("Light recovery snack: 1 apple + 10 raw almonds + 1 glass water");
        }

        // Daily protein needs by age and activity
        if (ageGroup === 'young' && activityLevel === 'high') {
            recommendations.push("Get 1.2-1.6g protein per kg body weight daily: add 1 palm-sized chicken breast to lunch");
        } else if (ageGroup === 'middle' || ageGroup === 'senior') {
            recommendations.push("Maintain muscle with protein: eat 2 eggs at breakfast + 1 cup lentils at dinner");
        } else {
            recommendations.push("Balance protein intake: include 1 serving fish, beans, or lean meat with each meal");
        }

        // Hydration based on workout intensity
        if (activityLevel === 'high') {
            recommendations.push("Drink extra water today: 16-20 oz within 2 hours + 1 pinch sea salt for electrolytes");
        } else {
            recommendations.push("Stay hydrated: drink 8 oz water now + 8 oz every 2 hours until bedtime");
        }

        // BMI-specific advice
        if (bmiCategory === 'underweight') {
            recommendations.push("Healthy weight gain: add 1 tbsp olive oil to salads + 1 handful nuts as afternoon snack");
        } else if (bmiCategory === 'overweight') {
            recommendations.push("Smart calorie control: fill half your plate with vegetables + choose grilled over fried foods");
        } else {
            recommendations.push("Maintain balanced nutrition: eat 5 different colored fruits/vegetables today");
        }

        return recommendations.slice(0, 4); // Return max 4 recommendations
    }

    /**
     * ACTIVITY RECOMMENDATIONS
     * Specific exercise advice based on current workout and user profile
     */
    getActivityRecommendations(data) {
        const recommendations = [];
        const { ageGroup, activityLevel, workoutType, duration, bmiCategory, caloriesBurned } = data;

        // Progressive overload suggestions
        if (workoutType.toLowerCase().includes('strength') || workoutType.toLowerCase().includes('weight')) {
            if (activityLevel === 'low') {
                recommendations.push("Gradually increase: add 2.5kg to your lifts next week OR do 2 more reps per set");
            } else {
                recommendations.push("Progressive challenge: increase weight by 5% OR add 1 extra set to 2 exercises");
            }
        } else if (workoutType.toLowerCase().includes('cardio') || workoutType.toLowerCase().includes('running')) {
            if (duration < 30) {
                recommendations.push("Build endurance: add 5 minutes to your next cardio session OR increase speed by 0.5 mph");
            } else {
                recommendations.push("Cardio progression: add 2-minute high-intensity intervals every 10 minutes");
            }
        }

        // Recovery and complementary activities
        if (activityLevel === 'high' && caloriesBurned > 400) {
            recommendations.push("Active recovery tomorrow: 20-minute gentle walk + 10-minute stretching routine");
        } else if (workoutType.toLowerCase().includes('strength')) {
            recommendations.push("Balance your training: do 15-minute yoga flow on non-strength days");
        } else {
            recommendations.push("Cross-training day: try bodyweight exercises - 20 squats, 15 push-ups, 30-second plank");
        }

        // Age-specific activity advice
        if (ageGroup === 'young') {
            recommendations.push("Challenge yourself: try a new sport this month - rock climbing, martial arts, or dance class");
        } else if (ageGroup === 'middle') {
            recommendations.push("Joint-friendly variety: alternate high-impact days with swimming, cycling, or elliptical");
        } else if (ageGroup === 'senior') {
            recommendations.push("Maintain mobility: do daily balance exercises - stand on one foot for 30 seconds each side");
        }

        // BMI-specific activity modifications
        if (bmiCategory === 'overweight') {
            recommendations.push("Low-impact calorie burn: try 30-minute brisk walking + 10-minute bodyweight circuit");
        } else if (bmiCategory === 'underweight') {
            recommendations.push("Build muscle mass: focus on compound movements - squats, deadlifts, rows twice per week");
        }

        return recommendations.slice(0, 4); // Return max 4 recommendations
    }

    /**
     * SLEEP RECOMMENDATIONS
     * Age-specific sleep duration and recovery optimization
     */
    getSleepRecommendations(data) {
        const recommendations = [];
        const { ageGroup, activityLevel, caloriesBurned, age } = data;
        
        // Calculate optimal bedtime based on age and activity
        let baseSleepHours;
        let optimalBedtime = "10:30 PM";
        
        if (ageGroup === 'young') {
            baseSleepHours = age <= 18 ? 9 : 8.5; // Teens need more sleep
            optimalBedtime = age <= 18 ? "10:00 PM" : "10:30 PM";
        } else if (ageGroup === 'middle') {
            baseSleepHours = 8;
            optimalBedtime = "10:30 PM";
        } else if (ageGroup === 'mature') {
            baseSleepHours = 7.5;
            optimalBedtime = "10:00 PM";
        } else { // senior
            baseSleepHours = 7;
            optimalBedtime = "9:30 PM";
        }
        
        // Adjust for workout intensity
        let adjustedSleepHours = baseSleepHours;
        if (activityLevel === 'high' || caloriesBurned > 400) {
            adjustedSleepHours += 0.5;
            recommendations.push(`Get ${adjustedSleepHours} hours of sleep tonight for muscle recovery - your intense workout needs extra rest`);
        } else {
            recommendations.push(`Target ${baseSleepHours} hours of sleep tonight - go to bed by ${optimalBedtime} and wake up naturally`);
        }

        // Age-specific bedtime routines
        if (ageGroup === 'young') {
            recommendations.push("Wind down routine: no phones after 9:30 PM, try reading for 20 minutes or gentle stretching");
        } else if (ageGroup === 'middle') {
            recommendations.push("Create sleep ritual: dim lights at 9:00 PM, take warm shower, write 3 gratitudes in a journal");
        } else if (ageGroup === 'mature' || ageGroup === 'senior') {
            recommendations.push("Evening routine: herbal tea at 8:30 PM, light reading, avoid news/screens 2 hours before bed");
        }

        // Sleep environment optimization
        recommendations.push("Optimize sleep environment: bedroom at 65-68°F (18-20°C), blackout curtains, white noise or earplugs");

        // Recovery-specific sleep advice
        if (activityLevel === 'high') {
            recommendations.push("Post-workout sleep boost: take 10-minute cool shower 1 hour before bed, elevate legs for 5 minutes");
        } else {
            recommendations.push("Sleep quality tip: no caffeine after 2 PM, finish eating 3 hours before bedtime");
        }

        return recommendations.slice(0, 4);
    }

    /**
     * MIND/STRESS/HEALTH RECOMMENDATIONS
     * Mental wellness and stress management based on workout intensity and age
     */
    getMindHealthRecommendations(data) {
        const recommendations = [];
        const { ageGroup, activityLevel, caloriesBurned, workoutType } = data;

        // Immediate stress relief based on workout intensity
        if (activityLevel === 'high' || caloriesBurned > 350) {
            recommendations.push("Cool down mentally: do 4-7-8 breathing (inhale 4, hold 7, exhale 8) for 5 cycles to activate recovery mode");
        } else {
            recommendations.push("Mindful moment: take 10 deep belly breaths right now - inhale for 4 seconds, exhale for 6 seconds");
        }

        // Age-appropriate meditation and mindfulness
        if (ageGroup === 'young') {
            recommendations.push("Quick stress reset: try 5-minute guided meditation on YouTube or use Headspace app for focus");
        } else if (ageGroup === 'middle') {
            recommendations.push("Midday mindfulness: practice 10-minute body scan meditation or progressive muscle relaxation");
        } else if (ageGroup === 'mature' || ageGroup === 'senior') {
            recommendations.push("Gentle mindfulness: sit quietly for 15 minutes, focus on gratitude, or try gentle tai chi movements");
        }

        // Workout-specific mental recovery
        if (workoutType.toLowerCase().includes('strength') || workoutType.toLowerCase().includes('weight')) {
            recommendations.push("Mental strength recovery: visualize your next workout success for 3 minutes, imagine perfect form and confidence");
        } else if (workoutType.toLowerCase().includes('cardio') || workoutType.toLowerCase().includes('running')) {
            recommendations.push("Cardio mind reset: practice walking meditation for 10 minutes - focus on each step and breath");
        } else {
            recommendations.push("Mind-body connection: spend 5 minutes doing gentle neck rolls and shoulder stretches while focusing on the sensations");
        }

        // Daily mental health practices by age group
        if (ageGroup === 'young') {
            recommendations.push("Digital detox: set phone to airplane mode for 1 hour today, spend time in nature or with friends face-to-face");
        } else if (ageGroup === 'middle') {
            recommendations.push("Stress management: write down 3 things you're grateful for today + schedule 15 minutes of 'me time' tomorrow");
        } else {
            recommendations.push("Mental wellness: call a friend or family member today, social connection reduces stress by 40%");
        }

        return recommendations.slice(0, 4);
    }

    /**
     * SOCIAL RECOMMENDATIONS
     * Community and social fitness engagement based on workout type and age
     */
    getSocialRecommendations(data) {
        const recommendations = [];
        const { ageGroup, workoutType, activityLevel, bmiCategory } = data;

        // Workout buddy suggestions based on activity type
        if (workoutType.toLowerCase().includes('strength') || workoutType.toLowerCase().includes('weight')) {
            recommendations.push("Find a gym buddy: ask someone to spot you during lifts - having a partner increases performance by 200%");
        } else if (workoutType.toLowerCase().includes('running') || workoutType.toLowerCase().includes('cardio')) {
            recommendations.push("Join a running group: find local runners on apps like Meetup or Strava - group runs are 40% more motivating");
        } else if (workoutType.toLowerCase().includes('yoga')) {
            recommendations.push("Yoga community: attend 1 group class this week - practicing with others deepens your experience");
        } else {
            recommendations.push("Workout accountability: text 1 friend your workout plan today - social commitment increases follow-through by 65%");
        }

        // Age-appropriate social fitness activities
        if (ageGroup === 'young') {
            recommendations.push("Active social life: organize a hiking trip with friends or join an intramural sports league at school/work");
        } else if (ageGroup === 'middle') {
            recommendations.push("Family fitness: plan active weekends - bike rides with kids, family walks after dinner, backyard games");
        } else if (ageGroup === 'mature') {
            recommendations.push("Community engagement: join a walking club, tennis group, or volunteer for active charity events in your area");
        } else { // senior
            recommendations.push("Senior fitness groups: find local senior center activities - water aerobics, tai chi, or walking clubs");
        }

        // Social support based on fitness level
        if (activityLevel === 'low' || bmiCategory === 'overweight') {
            recommendations.push("Beginner-friendly groups: look for 'all levels welcome' fitness classes or beginner walking groups - no judgment zones");
        } else if (activityLevel === 'high') {
            recommendations.push("Challenge groups: join advanced fitness communities or competition training groups to push your limits");
        } else {
            recommendations.push("Supportive fitness community: join online groups like MyFitnessPal friends or local Facebook fitness groups");
        }

        // Digital and real-world social connection
        if (ageGroup === 'young' || ageGroup === 'middle') {
            recommendations.push("Share progress online: post 1 workout photo this week on Instagram/TikTok with fitness hashtags - inspire others!");
        } else {
            recommendations.push("Real-world connections: invite a neighbor for a daily walk or ask a colleague to take stairs together");
        }

        return recommendations.slice(0, 4);
    }

    /**
     * FINANCIAL RECOMMENDATIONS
     * Budget-conscious fitness and nutrition alternatives
     */
    getFinancialRecommendations(data) {
        const recommendations = [];
        const { workoutType, ageGroup, activityLevel, bmiCategory } = data;

        // Workout-specific budget alternatives
        if (workoutType.toLowerCase().includes('strength') || workoutType.toLowerCase().includes('weight')) {
            recommendations.push("DIY home gym: use 2 water jugs (8lbs each) as weights, do push-ups on stairs for incline, resistance bands cost $15");
        } else if (workoutType.toLowerCase().includes('running') || workoutType.toLowerCase().includes('cardio')) {
            recommendations.push("Free cardio alternatives: run outdoors (free!), climb stairs in buildings, try YouTube HIIT videos (Fitness Blender)");
        } else if (workoutType.toLowerCase().includes('yoga')) {
            recommendations.push("Free yoga practice: YouTube channels (Yoga with Adriene, DoYogaWithMe), use towels instead of $60 yoga mats");
        } else {
            recommendations.push("Budget fitness: bodyweight exercises cost $0 - push-ups, squats, planks, jumping jacks work anywhere");
        }

        // Age-appropriate budget fitness solutions
        if (ageGroup === 'young') {
            recommendations.push("Student savings: use school gym (often free), walk/bike instead of driving, pack homemade protein bars ($2 vs $8)");
        } else if (ageGroup === 'middle') {
            recommendations.push("Family budget fitness: buy bulk oats ($3/month breakfast), family bike rides, playground workouts while kids play");
        } else {
            recommendations.push("Senior discounts: many gyms offer 50+ discounts, community centers have low-cost classes, walking is always free");
        }

        // Nutrition on a budget
        if (bmiCategory === 'underweight') {
            recommendations.push("Budget muscle building: buy eggs in bulk ($3/dozen), dried beans ($1/lb), peanut butter ($4) - cheap protein sources");
        } else if (bmiCategory === 'overweight') {
            recommendations.push("Budget weight loss: buy frozen vegetables ($1/bag), chicken thighs ($2/lb), cook at home to save $200/month");
        } else {
            recommendations.push("Healthy on a budget: seasonal fruits, canned tuna ($1/can), oatmeal ($3/month) - nutritious and affordable");
        }

        // Equipment and subscription alternatives
        if (activityLevel === 'high') {
            recommendations.push("Skip expensive gear: use smartphone apps (MyFitnessPal free), run in old sneakers, bodyweight > $200 equipment");
        } else {
            recommendations.push("Free fitness resources: library workout DVDs, community park equipment, walking trails cost nothing");
        }

        return recommendations.slice(0, 4);
    }

    /**
     * HELPER METHODS
     */

    validateUserData(userData) {
        return userData.age && userData.weight && userData.height && userData.workoutType;
    }

    calculateBMI(weight, height) {
        // Assume weight in kg and height in cm
        const heightInMeters = height / 100;
        return weight / (heightInMeters * heightInMeters);
    }

    getBMICategory(bmi) {
        if (bmi < 18.5) return 'underweight';
        if (bmi >= 18.5 && bmi < 25) return 'normal';
        if (bmi >= 25 && bmi < 30) return 'overweight';
        return 'obese';
    }

    getAgeGroup(age) {
        if (age >= 15 && age <= 29) return 'young';
        if (age >= 30 && age <= 49) return 'middle';
        if (age >= 50 && age <= 69) return 'mature';
        if (age >= 70) return 'senior';
        return 'middle'; // default
    }

    getActivityLevel(workoutType, duration, intensity) {
        const durationScore = duration > 45 ? 2 : duration > 30 ? 1 : 0;
        const intensityScore = intensity > 7 ? 2 : intensity > 5 ? 1 : 0;
        const total = durationScore + intensityScore;
        
        if (total >= 3) return 'high';
        if (total >= 2) return 'moderate';
        return 'low';
    }

    estimateDailyCalories(weight, height, age, gender, activityLevel) {
        // Basic BMR calculation using Mifflin-St Jeor Equation
        let bmr;
        if (gender.toLowerCase() === 'male') {
            bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
        } else {
            bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
        }

        // Activity multipliers
        const multipliers = {
            'low': 1.375,
            'moderate': 1.55,
            'high': 1.725
        };

        return Math.round(bmr * (multipliers[activityLevel] || 1.55));
    }

    getDefaultRecommendations() {
        return {
            activity: ["Take a 10-minute walk outside", "Try 20 bodyweight squats", "Stretch for 5 minutes"],
            nutrition: ["Drink 16 oz of water now", "Eat 1 apple with 1 tbsp almond butter", "Include a vegetable with your next meal"],
            sleep: ["Get 7-9 hours of sleep tonight", "No screens 1 hour before bed", "Keep bedroom cool and dark"],
            mindHealth: ["Take 3 deep breaths", "Practice 5 minutes of gratitude", "Step outside for fresh air"],
            social: ["Call or text a friend today", "Smile at 3 people", "Join an online fitness community"],
            financial: ["Use free YouTube workouts", "Walk instead of driving short distances", "Prepare meals at home"]
        };
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PersonalizedRecommendationEngine;
}

// Global instance for browser use
window.PersonalizedRecommendationEngine = PersonalizedRecommendationEngine;