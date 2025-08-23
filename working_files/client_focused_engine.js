/**
 * Client-side Focused Recommendation Engine
 * Provides the 4 specific features without needing a server
 */

class ClientFocusedRecommendationEngine {
    constructor() {
        this.name = "Client-side Focused Recommendation Engine";
        this.version = "1.0";
    }

    calculateBMR(weight, height, age, gender) {
        // Mifflin-St Jeor equation
        if (gender.toLowerCase() === 'male') {
            return (10 * weight) + (6.25 * height) - (5 * age) + 5;
        } else {
            return (10 * weight) + (6.25 * height) - (5 * age) - 161;
        }
    }

    getActivityMultiplier(activityLevel) {
        const multipliers = {
            'sedentary': 1.2,
            'light': 1.375,
            'moderate': 1.55,
            'active': 1.725,
            'very_active': 1.9
        };
        return multipliers[activityLevel.toLowerCase()] || 1.55;
    }

    calculateHydrationNeeds(weight, workoutDuration, workoutIntensity) {
        // Base water need: 35ml per kg body weight
        const baseWater = weight * 35;
        
        // Exercise hydration based on intensity
        let exerciseWater;
        if (workoutIntensity.toLowerCase() === 'high') {
            exerciseWater = workoutDuration * 15; // 15ml per minute
        } else if (workoutIntensity.toLowerCase() === 'moderate') {
            exerciseWater = workoutDuration * 12; // 12ml per minute
        } else {
            exerciseWater = workoutDuration * 8; // 8ml per minute
        }
        
        const preWorkout = 500;
        const duringWorkout = Math.round((workoutDuration / 15) * 200);
        const postWorkout = Math.round(exerciseWater * 1.5);
        
        return {
            dailyTotal: Math.round(baseWater + exerciseWater),
            preWorkout: preWorkout,
            duringWorkout: duringWorkout,
            postWorkout: postWorkout,
            timing: {
                pre: '2-3 hours before exercise',
                during: 'Every 15-20 minutes during exercise',
                post: 'Within 30 minutes after exercise'
            }
        };
    }

    calculateNutritionNeeds(weight, height, age, gender, activityLevel, fitnessGoal) {
        const bmr = this.calculateBMR(weight, height, age, gender);
        const activityMultiplier = this.getActivityMultiplier(activityLevel);
        const tdee = Math.round(bmr * activityMultiplier);
        
        // Adjust calories based on fitness goal
        let targetCalories;
        if (fitnessGoal.toLowerCase() === 'weight_loss') {
            targetCalories = Math.round(tdee * 0.85); // 15% deficit
        } else if (fitnessGoal.toLowerCase() === 'weight_gain') {
            targetCalories = Math.round(tdee * 1.15); // 15% surplus
        } else {
            targetCalories = tdee; // Maintenance
        }
        
        // Calculate macros
        const proteinGrams = Math.round(weight * 2.2); // 2.2g per kg
        const proteinCalories = proteinGrams * 4;
        
        const fatCalories = Math.round(targetCalories * 0.25); // 25% from fat
        const fatGrams = Math.round(fatCalories / 9);
        
        const carbCalories = targetCalories - proteinCalories - fatCalories;
        const carbGrams = Math.round(carbCalories / 4);
        
        return {
            bmr: Math.round(bmr),
            tdee: tdee,
            targetCalories: targetCalories,
            proteinGrams: proteinGrams,
            carbGrams: carbGrams,
            fatGrams: fatGrams,
            mealTiming: {
                preWorkout: 'Light carbs 30-60 min before',
                postWorkout: 'Protein + carbs within 30 min',
                dailyMeals: '3 main meals + 2 snacks'
            }
        };
    }

    analyzeWorkoutBenefits(workoutType, workoutDuration, workoutIntensity) {
        const workoutData = {
            'cardio': {
                muscleGroups: ['Heart', 'Legs', 'Core'],
                primaryBenefits: ['Cardiovascular health', 'Fat burning', 'Endurance'],
                calorieRate: {'light': 8, 'moderate': 12, 'high': 16},
                recoveryHours: 24
            },
            'strength': {
                muscleGroups: ['Full body', 'Upper body', 'Lower body'],
                primaryBenefits: ['Muscle building', 'Strength gains', 'Bone density'],
                calorieRate: {'light': 6, 'moderate': 8, 'high': 10},
                recoveryHours: 48
            },
            'hiit': {
                muscleGroups: ['Full body', 'Core', 'Legs'],
                primaryBenefits: ['Fat burning', 'Metabolic boost', 'Time efficient'],
                calorieRate: {'light': 12, 'moderate': 16, 'high': 20},
                recoveryHours: 36
            },
            'yoga': {
                muscleGroups: ['Core', 'Flexibility', 'Balance'],
                primaryBenefits: ['Flexibility', 'Stress relief', 'Mind-body connection'],
                calorieRate: {'light': 3, 'moderate': 5, 'high': 7},
                recoveryHours: 12
            }
        };
        
        const workoutInfo = workoutData[workoutType.toLowerCase()] || workoutData['cardio'];
        const calorieRate = workoutInfo.calorieRate[workoutIntensity.toLowerCase()] || 10;
        
        const estimatedCalories = workoutDuration * calorieRate;
        const calorieRange = `${Math.round(estimatedCalories * 0.9)}-${Math.round(estimatedCalories * 1.1)}`;
        
        return {
            muscleGroups: workoutInfo.muscleGroups,
            primaryBenefits: workoutInfo.primaryBenefits,
            calorieBurnRange: calorieRange,
            recoveryTime: `${workoutInfo.recoveryHours} hours`,
            metabolicEffect: `Elevated metabolism for ${Math.round(workoutInfo.recoveryHours/2)} hours`
        };
    }

    calculateHeartRateZones(age) {
        const maxHR = 220 - age;
        
        return {
            resting: "60-100 bpm",
            fatBurn: `${Math.round(maxHR * 0.6)}-${Math.round(maxHR * 0.7)} bpm`,
            cardio: `${Math.round(maxHR * 0.7)}-${Math.round(maxHR * 0.85)} bpm`,
            peak: `${Math.round(maxHR * 0.85)}-${Math.round(maxHR * 0.95)} bpm`,
            maxHR: `${maxHR} bpm`
        };
    }

    generateRecommendations(userData) {
        // Extract user data with defaults
        const age = userData.age || 25;
        const height = userData.height || 175;
        const weight = userData.weight || 70;
        const gender = userData.gender || 'male';
        const activityLevel = userData.activity_level || 'moderate';
        const workoutType = userData.workout_type || 'cardio';
        const workoutDuration = userData.workout_duration || 30;
        const workoutIntensity = userData.workout_intensity || 'moderate';
        const fitnessGoal = userData.fitness_goal || 'maintenance';
        
        // Generate recommendations
        const hydration = this.calculateHydrationNeeds(weight, workoutDuration, workoutIntensity);
        const nutrition = this.calculateNutritionNeeds(weight, height, age, gender, activityLevel, fitnessGoal);
        const workoutBenefits = this.analyzeWorkoutBenefits(workoutType, workoutDuration, workoutIntensity);
        const heartRateZones = this.calculateHeartRateZones(age);
        
        return {
            success: true,
            engine_type: 'client_focused_recommendations',
            smart_recommendations: {
                hydration_strategy: {
                    title: '💧 Specific Hydration Protocol',
                    daily_total: `${hydration.dailyTotal}ml daily`,
                    pre_workout: `${hydration.preWorkout}ml - ${hydration.timing.pre}`,
                    during_workout: `${hydration.duringWorkout}ml total - ${hydration.timing.during}`,
                    post_workout: `${hydration.postWorkout}ml - ${hydration.timing.post}`,
                    recommendations: [
                        `Pre-workout: Drink ${hydration.preWorkout}ml water 2-3 hours before exercise`,
                        `During workout: Drink ${hydration.duringWorkout}ml total during exercise`,
                        `Post-workout: Drink ${hydration.postWorkout}ml within 30 minutes after`,
                        `Daily target: ${hydration.dailyTotal}ml total water intake`
                    ]
                },
                nutrition_strategy: {
                    title: '🍎 Personalized Nutrition Plan',
                    bmr: `BMR: ${nutrition.bmr} calories`,
                    daily_calories: `Daily target: ${nutrition.targetCalories} calories`,
                    macros: {
                        protein: `${nutrition.proteinGrams}g protein`,
                        carbs: `${nutrition.carbGrams}g carbohydrates`,
                        fat: `${nutrition.fatGrams}g fat`
                    },
                    meal_timing: nutrition.mealTiming,
                    daily_targets: {
                        calories: nutrition.targetCalories,
                        protein: `${nutrition.proteinGrams}g`,
                        carbohydrates: `${nutrition.carbGrams}g`,
                        fat: `${nutrition.fatGrams}g`
                    }
                },
                workout_benefits: {
                    title: '🎯 Workout Benefits Analysis',
                    muscle_groups: workoutBenefits.muscleGroups,
                    primary_benefits: workoutBenefits.primaryBenefits,
                    calorie_burn_range: workoutBenefits.calorieBurnRange,
                    recovery_time: workoutBenefits.recoveryTime,
                    metabolic_effect: workoutBenefits.metabolicEffect
                },
                heart_rate_zones: {
                    title: '❤️ Personalized Heart Rate Zones',
                    fat_burn_zone: heartRateZones.fatBurn,
                    cardio_zone: heartRateZones.cardio,
                    peak_zone: heartRateZones.peak,
                    max_heart_rate: heartRateZones.maxHR,
                    zones: heartRateZones
                }
            }
        };
    }
}

// Create global instance
window.clientFocusedEngine = new ClientFocusedRecommendationEngine();
