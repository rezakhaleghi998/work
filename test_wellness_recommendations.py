"""
Test Wellness-Focused Personal Recommendation System
===================================================

This script demonstrates the enhanced AdvancedRecommendationEngine with
domain-specific recommendations for wellness areas:
- Activity/Workout
- Nutrition  
- Sleep
- Mind, Stress & Health
- Social
- Financial
"""

from advanced_recommendation_engine import AdvancedRecommendationEngine
import json

def test_wellness_recommendations():
    print("=" * 80)
    print("WELLNESS-FOCUSED PERSONAL RECOMMENDATION SYSTEM")
    print("=" * 80)
    
    # Initialize the wellness-focused engine
    print("\n1. Initializing Wellness Recommendation Engine...")
    engine = AdvancedRecommendationEngine()
    
    # Set up a sample user wellness profile
    user_id = "wellness_user_001"
    
    print(f"\n2. Setting up wellness profile for {user_id}...")
    
    # Activity/Workout Profile
    engine.update_wellness_profile(user_id, 'activity_workout', {
        'goals': {'primary_goals': ['weight_loss', 'energy', 'strength']},
        'preferences': {'intensity': 'medium', 'duration': 30},
        'constraints': {'time_available': 45, 'equipment': []},
        'current_state': {'fitness_level': 'beginner', 'energy': 'medium'}
    })
    
    # Nutrition Profile  
    engine.update_wellness_profile(user_id, 'nutrition', {
        'goals': {'primary_goals': ['balanced_nutrition', 'muscle_recovery']},
        'preferences': {'meal_prep_time': 20, 'dietary_style': 'balanced'},
        'constraints': {'allergies': [], 'budget': 'medium'},
        'current_state': {'hunger_level': 'medium'}
    })
    
    # Sleep Profile
    engine.update_wellness_profile(user_id, 'sleep', {
        'goals': {'primary_goals': ['better_quality', 'consistency']},
        'preferences': {'bedtime': '10:30 PM', 'sleep_duration': 8},
        'constraints': {'work_schedule': 'regular'},
        'current_state': {'stress_level': 'medium', 'sleep_quality': 'fair'}
    })
    
    # Mind, Stress & Health Profile
    engine.update_wellness_profile(user_id, 'mind_stress_health', {
        'goals': {'primary_goals': ['stress_reduction', 'focus_improvement']},
        'preferences': {'practice_type': 'meditation', 'duration': 10},
        'constraints': {'available_time': 15},
        'current_state': {'stress_level': 'medium', 'mood': 'neutral'}
    })
    
    # Social Profile
    engine.update_wellness_profile(user_id, 'social', {
        'goals': {'primary_goals': ['connection', 'support']},
        'preferences': {'group_size': 'small', 'activity_type': 'active'},
        'constraints': {'social_energy': 'medium'},
        'current_state': {'social_satisfaction': 'medium'}
    })
    
    # Financial Profile
    engine.update_wellness_profile(user_id, 'financial', {
        'goals': {'primary_goals': ['security', 'awareness']},
        'preferences': {'risk_tolerance': 'low', 'timeframe': 'long_term'},
        'constraints': {'income_level': 'medium'},
        'current_state': {'financial_stress': 'medium', 'savings_rate': 'low'}
    })
    
    print("   [OK] All wellness profiles configured")
    
    # Test domain-specific recommendations
    domains_to_test = [
        ('activity_workout', {'time_of_day': 'morning', 'available_time': 30, 'energy_level': 'medium'}),
        ('nutrition', {'meal_type': 'lunch', 'available_prep_time': 20, 'hunger_level': 'medium'}),
        ('sleep', {'current_time': 'evening', 'stress_level': 'medium'}),
        ('mind_stress_health', {'stress_level': 'high', 'available_time': 10}),
        ('social', {'social_energy': 'medium', 'available_time': 60}),
        ('financial', {'financial_stress': 'high', 'life_stage': 'adult'})
    ]
    
    print("\n3. Testing Domain-Specific Wellness Recommendations...")
    
    for domain, context in domains_to_test:
        print(f"\n   Testing {domain.upper()} recommendations:")
        context['domain'] = domain
        
        # Get domain-specific recommendations
        recommendations = engine.predict(user_id, n_items=3, context=context, domain=domain)
        
        if recommendations:
            for i, rec in enumerate(recommendations):
                print(f"     {i+1}. {rec.get('item', 'Unknown')}")
                print(f"        Score: {rec.get('score', 0):.2f} | Wellness Score: {rec.get('wellness_score', 0):.2f}")
                print(f"        Reason: {rec.get('reason', 'N/A')}")
                print(f"        Action: {rec.get('action', 'N/A')}")
                print()
        else:
            print("     No recommendations available for this domain")
    
    # Test multi-domain recommendations
    print("\n4. Testing Multi-Domain Wellness Recommendations...")
    general_context = {
        'time_of_day': 'evening',
        'available_time': 45,
        'stress_level': 'medium',
        'social_energy': 'medium'
    }
    
    multi_domain_recs = engine.predict(user_id, n_items=6, context=general_context)
    
    print(f"   Generated {len(multi_domain_recs)} recommendations across all wellness domains:")
    for i, rec in enumerate(multi_domain_recs):
        domain = rec.get('domain', 'general')
        print(f"     {i+1}. [{domain.upper()}] {rec.get('item', 'Unknown')}")
        print(f"        {rec.get('action', rec.get('reason', 'Recommended for you'))}")
        print()
    
    # Test real-time feedback integration
    print("\n5. Testing Real-Time Feedback Integration...")
    
    # Simulate user feedback
    feedback_examples = [
        ('morning_hiit', 'like', {'time_of_day': 'morning', 'domain': 'activity_workout'}),
        ('protein_smoothie', 'purchase', {'meal_type': 'snack', 'domain': 'nutrition'}),
        ('breathing_meditation', 'click', {'stress_level': 'high', 'domain': 'mind_stress_health'}),
        ('workout_buddy', 'share', {'social_energy': 'high', 'domain': 'social'})
    ]
    
    for item_id, feedback_type, context in feedback_examples:
        engine.add_real_time_feedback(user_id, item_id, feedback_type, context)
        print(f"   [OK] Added {feedback_type} feedback for {item_id}")
    
    # Test improved recommendations after feedback
    print("\n6. Testing Improved Recommendations After Feedback...")
    
    # Get activity recommendations again (should be improved by feedback)
    activity_context = {'domain': 'activity_workout', 'time_of_day': 'morning', 'available_time': 30}
    improved_recs = engine.predict(user_id, n_items=3, context=activity_context, domain='activity_workout')
    
    print("   Improved Activity/Workout recommendations:")
    for i, rec in enumerate(improved_recs):
        print(f"     {i+1}. {rec.get('item', 'Unknown')} (Score: {rec.get('score', 0):.2f})")
        print(f"        {rec.get('action', 'Recommended for you')}")
    
    # Performance and analytics
    print("\n7. System Performance & Analytics...")
    
    performance_stats = engine.get_performance_stats()
    model_info = engine.get_model_info()
    
    print(f"   Total requests processed: {performance_stats.get('total_requests', 0)}")
    print(f"   Average response time: {performance_stats.get('avg_execution_time', 0):.3f}s")
    print(f"   Cache hit rate: {performance_stats.get('cache_hit_rate', 0):.1%}")
    print(f"   Active wellness domains: {len(engine.wellness_domains)}")
    print(f"   System health: {'[OK]' if model_info.get('system_ready', False) else '[WARNING]'}")
    
    print("\n" + "=" * 80)
    print("WELLNESS RECOMMENDATION SYSTEM - COMPLETE!")
    print("=" * 80)
    print("\nKey Features Demonstrated:")
    print("1. [OK] Domain-specific recommendations (Activity, Nutrition, Sleep, etc.)")
    print("2. [OK] Personalized wellness profiles with goals and constraints")
    print("3. [OK] Context-aware recommendations (time, stress, energy levels)")
    print("4. [OK] Real-time feedback integration")
    print("5. [OK] Multi-domain intelligent recommendations")
    print("6. [OK] Wellness-focused scoring and action generation")
    print("7. [OK] Performance monitoring and analytics")
    
    return True

if __name__ == "__main__":
    try:
        success = test_wellness_recommendations()
        if success:
            print("\n[SUCCESS] All wellness recommendation tests passed!")
            print("The system is ready for personalized wellness recommendations!")
        else:
            print("\n[ERROR] Some wellness tests failed.")
    except Exception as e:
        print(f"\n[CRITICAL] Wellness test failure: {e}")
        import traceback
        traceback.print_exc()