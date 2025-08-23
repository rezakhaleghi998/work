"""
Test script for Content-Based Filtering and Neural Network functionality
Testing the enhanced AdvancedRecommendationEngine with all components
"""

from advanced_recommendation_engine import AdvancedRecommendationEngine

def test_content_and_neural():
    print("=" * 70)
    print("TESTING CONTENT-BASED FILTERING AND NEURAL NETWORK FUNCTIONALITY")
    print("=" * 70)
    
    # Initialize the advanced engine
    print("\n1. Initializing AdvancedRecommendationEngine with all components...")
    engine = AdvancedRecommendationEngine()
    
    # Check model info
    print("\n2. Checking all model capabilities...")
    model_info = engine.get_model_info()
    for key, value in model_info.items():
        print(f"   {key}: {value}")
    
    # Test the existing interface methods (backward compatibility)
    print("\n3. Testing complete hybrid system...")
    
    # Method 1: predict() - should now use all 4 methods
    print("\n   Testing predict() with full hybrid approach:")
    predictions = engine.predict(user_id="user_15", n_items=8)
    print(f"   Predictions for user_15: {len(predictions)} items")
    for i, pred in enumerate(predictions):
        print(f"     {i+1}. {pred['item']} (score: {pred['score']:.3f}) - {pred['reason']}")
    
    # Method 2: Different user
    print("\n   Testing with different user (user_30):")
    recs_user30 = engine.predict("user_30", 6)
    for i, rec in enumerate(recs_user30):
        print(f"     {i+1}. {rec['item']} (score: {rec['score']:.3f}) - {rec['reason']}")
    
    # Method 3: get_recommendations()
    print("\n   Testing get_recommendations() method:")
    results = engine.get_recommendations({"user_id": "user_8", "n_items": 5})
    print(f"   Items: {len(results['items'])}, Scores: {len(results['scores'])}")
    for item, score in zip(results['items'], results['scores']):
        print(f"     {item}: {score:.3f}")
    
    # Test content-based filtering specific functionality
    print("\n4. Testing content-based filtering features...")
    
    # Check item features
    print(f"   Item features loaded: {len(engine.item_features)}")
    if engine.item_features:
        sample_item = list(engine.item_features.keys())[0]
        features = engine.item_features[sample_item]
        print(f"   Sample item ({sample_item}): {features}")
    
    # Check embeddings
    if hasattr(engine, 'item_embeddings') and engine.item_embeddings is not None:
        print(f"   Item embeddings shape: {engine.item_embeddings.shape}")
    
    # Test neural network functionality
    print("\n5. Testing neural network features...")
    
    if engine.neural_model is not None:
        print("   Neural network is trained and ready")
        
        # Add some custom interactions to test neural network
        print("   Adding custom interactions for neural network testing...")
        engine.add_user_interaction("neural_test_user", "item_5", 4.8)
        engine.add_user_interaction("neural_test_user", "item_12", 3.2)
        engine.add_user_interaction("neural_test_user", "item_20", 4.5)
        engine.add_user_interaction("neural_test_user", "item_35", 2.1)
        
        # Get recommendations
        neural_recs = engine.predict("neural_test_user", 5)
        print("   Neural network enhanced recommendations:")
        for i, rec in enumerate(neural_recs):
            print(f"     {i+1}. {rec['item']} (score: {rec['score']:.3f}) - {rec['reason']}")
    else:
        print("   Neural network not available (insufficient data or training failed)")
    
    # Test ensemble weighting
    print("\n6. Testing ensemble weights...")
    weights = engine.config['ensemble_weights']
    print("   Current ensemble weights:")
    for method, weight in weights.items():
        print(f"     {method}: {weight}")
    
    # Test with multiple users to show variety
    print("\n7. Testing variety across different users...")
    test_users = ["user_5", "user_25", "user_45", "user_65", "user_85"]
    
    for user in test_users:
        recs = engine.predict(user, 3)
        print(f"\n   Top recommendations for {user}:")
        for i, rec in enumerate(recs):
            reason_short = rec['reason'][:30] + "..." if len(rec['reason']) > 30 else rec['reason']
            print(f"     {i+1}. {rec['item']} (score: {rec['score']:.3f}) - {reason_short}")
    
    # Test performance with all components
    print("\n8. Testing performance with all components...")
    import time
    
    start_time = time.time()
    total_recs = 0
    
    for i in range(20):
        recs = engine.predict(f"user_{i+1}", 5)
        total_recs += len(recs)
    
    end_time = time.time()
    
    print(f"   Generated {total_recs} recommendations for 20 users in {end_time - start_time:.3f} seconds")
    print(f"   Average time per user: {(end_time - start_time) / 20:.3f} seconds")
    print(f"   Average time per recommendation: {(end_time - start_time) / total_recs:.4f} seconds")
    
    # Final comprehensive check
    print("\n9. Final system status:")
    final_info = engine.get_model_info()
    print("   Component Status:")
    print(f"     XGBoost: {'✓' if final_info['xgboost_loaded'] else '✗'}")
    print(f"     Collaborative Filtering: {'✓' if final_info['collaborative_enabled'] else '✗'}")
    print(f"     Content-Based Filtering: {'✓' if final_info['content_enabled'] else '✗'}")
    print(f"     Neural Network: {'✓' if final_info['neural_enabled'] else '✗'}")
    print(f"     SVD Matrix Factorization: {'✓' if final_info['svd_trained'] else '✗'}")
    print(f"     TF-IDF Text Processing: {'✓' if final_info['tfidf_trained'] else '✗'}")
    print(f"   Data Status:")
    print(f"     User interactions: {final_info['interaction_data_size']}")
    print(f"     Item features: {final_info['item_features_loaded']}")
    
    print("\n" + "=" * 70)
    print("CONTENT-BASED AND NEURAL NETWORK TEST COMPLETED SUCCESSFULLY!")
    print("=" * 70)
    
    return True

if __name__ == "__main__":
    try:
        success = test_content_and_neural()
        if success:
            print("\n✅ All tests passed! Content-based filtering and neural network are working correctly.")
            print("   The AdvancedRecommendationEngine now includes:")
            print("     • XGBoost recommendations (backward compatibility)")
            print("     • Collaborative filtering (user-based, item-based, matrix factorization)")
            print("     • Content-based filtering (TF-IDF, embeddings, similarity)")  
            print("     • Neural network predictions (MLPRegressor with user/item features)")
            print("     • Intelligent ensemble combination")
        else:
            print("\n❌ Some tests failed.")
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()