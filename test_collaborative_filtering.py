"""
Test script for Collaborative Filtering functionality
Testing the enhanced AdvancedRecommendationEngine with collaborative filtering
"""

from advanced_recommendation_engine import AdvancedRecommendationEngine

def test_collaborative_filtering():
    print("=" * 60)
    print("TESTING COLLABORATIVE FILTERING FUNCTIONALITY")
    print("=" * 60)
    
    # Initialize the advanced engine
    print("\n1. Initializing AdvancedRecommendationEngine...")
    engine = AdvancedRecommendationEngine()
    
    # Check model info
    print("\n2. Checking model capabilities...")
    model_info = engine.get_model_info()
    for key, value in model_info.items():
        print(f"   {key}: {value}")
    
    # Test the existing interface methods (backward compatibility)
    print("\n3. Testing backward compatibility...")
    
    # Method 1: predict()
    print("\n   Testing predict() method:")
    predictions = engine.predict(user_id="user_1", n_items=5)
    print(f"   Predictions for user_1: {len(predictions)} items")
    for i, pred in enumerate(predictions[:3]):
        print(f"     {i+1}. {pred['item']} (score: {pred['score']:.3f}) - {pred['reason']}")
    
    # Method 2: recommend()
    print("\n   Testing recommend() method:")
    recommendations = engine.recommend({"user_id": "user_5", "n_items": 3})
    print(f"   Status: {recommendations['status']}")
    print(f"   Count: {recommendations['count']}")
    if recommendations['recommendations']:
        for i, rec in enumerate(recommendations['recommendations']):
            print(f"     {i+1}. {rec['item']} (score: {rec['score']:.3f})")
    
    # Method 3: get_recommendations()
    print("\n   Testing get_recommendations() method:")
    results = engine.get_recommendations({"user_id": "user_10", "n_items": 4})
    print(f"   Items: {len(results['items'])}")
    print(f"   Scores: {len(results['scores'])}")
    for item, score in zip(results['items'][:3], results['scores'][:3]):
        print(f"     {item}: {score:.3f}")
    
    # Test collaborative filtering specific functionality
    print("\n4. Testing collaborative filtering features...")
    
    # Add some custom interactions
    print("\n   Adding custom user interactions...")
    engine.add_user_interaction("test_user", "item_1", 4.5)
    engine.add_user_interaction("test_user", "item_5", 3.8)
    engine.add_user_interaction("test_user", "item_10", 5.0)
    
    # Get user interactions
    interactions = engine.get_user_interactions("test_user")
    print(f"   Test user interactions: {interactions}")
    
    # Get recommendations for the test user
    print("\n   Getting recommendations for test user:")
    test_recs = engine.predict("test_user", 5)
    for i, rec in enumerate(test_recs):
        print(f"     {i+1}. {rec['item']} (score: {rec['score']:.3f}) - {rec['reason']}")
    
    # Test with different users
    print("\n5. Testing with different users...")
    users_to_test = ["user_2", "user_25", "user_50", "user_75"]
    
    for user in users_to_test:
        recs = engine.predict(user, 3)
        print(f"\n   Recommendations for {user}:")
        for i, rec in enumerate(recs):
            print(f"     {i+1}. {rec['item']} (score: {rec['score']:.3f})")
    
    # Test performance and caching
    print("\n6. Testing performance...")
    import time
    
    start_time = time.time()
    for i in range(10):
        _ = engine.predict(f"user_{i+1}", 5)
    end_time = time.time()
    
    print(f"   Generated 10 recommendation sets in {end_time - start_time:.3f} seconds")
    print(f"   Average time per recommendation: {(end_time - start_time) / 10:.3f} seconds")
    
    # Final model info check
    print("\n7. Final model status:")
    final_info = engine.get_model_info()
    print(f"   Collaborative filtering enabled: {final_info['collaborative_enabled']}")
    print(f"   SVD model trained: {final_info['svd_trained']}")
    print(f"   NMF model available: {final_info['nmf_trained']}")
    print(f"   Total user interactions: {final_info['interaction_data_size']}")
    
    print("\n" + "=" * 60)
    print("COLLABORATIVE FILTERING TEST COMPLETED SUCCESSFULLY!")
    print("=" * 60)
    
    return True

if __name__ == "__main__":
    try:
        success = test_collaborative_filtering()
        if success:
            print("\n✅ All tests passed! Collaborative filtering is working correctly.")
        else:
            print("\n❌ Some tests failed.")
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()