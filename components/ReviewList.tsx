'use client';

import React, { useState, useEffect } from 'react';
import { Star, ThumbsUp, MessageCircle, Image as ImageIcon, Filter, ChevronDown, Check } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import ReviewModal from './ReviewModal';

interface ReviewListProps {
  productId: number;
  productName: string;
  productImage?: string;
}

const ReviewList: React.FC<ReviewListProps> = ({ productId, productName, productImage }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, 5, 4, 3, 2, 1
  const [sort, setSort] = useState('recent'); // recent, helpful, highest, lowest
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [editingReview, setEditingReview] = useState<any>(null);

  useEffect(() => {
    fetchReviews();
    fetchStats();
  }, [productId, filter, sort, page]);

  const fetchReviews = async () => {
  try {
    setLoading(true);
    // Use api.reviews.getAll with product_id parameter
    const response = await api.reviews.getAll({
      product_id: productId,
      rating: filter !== 'all' ? filter : undefined,
      sort,
      page,
      per_page: 10,
    });
    
    if (page === 1) {
      setReviews(response.data.data || response.data);
    } else {
      setReviews(prev => [...prev, ...(response.data.data || response.data)]);
    }
    
    setHasMore(response.data.next_page_url ? true : false);
  } catch (error) {
    console.error('Failed to fetch reviews:', error);
  } finally {
    setLoading(false);
  }
};

  const fetchStats = async () => {
    try {
      const response = await api.products.getReviewStats(productId);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch review stats:', error);
    }
  };

  const handleHelpful = async (reviewId: number) => {
    try {
      // You need to add this endpoint to your backend
      await api.post(`/reviews/${reviewId}/helpful`);
      
      // Update local state
      setReviews(prev => prev.map(review => 
        review.id === reviewId 
          ? { ...review, upvotes: review.upvotes + 1, user_has_upvoted: true }
          : review
      ));
    } catch (error) {
      console.error('Failed to mark as helpful:', error);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    
    try {
      await api.reviews.delete(reviewId);
      setReviews(prev => prev.filter(review => review.id !== reviewId));
      fetchStats(); // Refresh stats
    } catch (error) {
      console.error('Failed to delete review:', error);
    }
  };

  const averageRating = stats?.average_rating || 0;
  const totalReviews = stats?.total_reviews || 0;

  const RatingSummary = () => (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div className="mb-4 md:mb-0">
          <div className="text-4xl font-bold text-gray-900 mb-1">
            {averageRating.toFixed(1)}
            <span className="text-lg text-gray-500">/5</span>
          </div>
          <div className="flex items-center mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={20}
                className={
                  star <= Math.floor(averageRating)
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300'
                }
              />
            ))}
          </div>
          <p className="text-gray-600">{totalReviews} reviews</p>
        </div>
        
        <button
          onClick={() => setShowReviewModal(true)}
          className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors flex items-center"
        >
          <Star size={18} className="mr-2" />
          Write a Review
        </button>
      </div>

      {/* Rating Distribution */}
      {stats?.rating_distribution && (
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = stats.rating_distribution[star] || 0;
            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            
            return (
              <div key={star} className="flex items-center">
                <div className="flex items-center w-16">
                  <span className="text-sm text-gray-600 w-4">{star}</span>
                  <Star size={16} className="text-yellow-400 fill-yellow-400 ml-1" />
                </div>
                <div className="flex-1 mx-3">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-400 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm text-gray-600 w-12 text-right">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const ReviewFilters = () => (
    <div className="flex flex-wrap items-center justify-between mb-6">
      <div className="flex flex-wrap gap-2 mb-4 md:mb-0">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium ${
            filter === 'all'
              ? 'bg-primary-100 text-primary-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({totalReviews})
        </button>
        {[5, 4, 3, 2, 1].map((rating) => (
          <button
            key={rating}
            onClick={() => setFilter(rating.toString())}
            className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center ${
              filter === rating.toString()
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Star size={14} className="mr-1" />
            {rating} ({stats?.rating_distribution?.[rating] || 0})
          </button>
        ))}
      </div>

      <div className="relative">
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="pl-3 pr-8 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none"
        >
          <option value="recent">Most Recent</option>
          <option value="helpful">Most Helpful</option>
          <option value="highest">Highest Rated</option>
          <option value="lowest">Lowest Rated</option>
        </select>
        <ChevronDown size={16} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
      </div>
    </div>
  );

  return (
    <div className="py-8">
      <RatingSummary />
      <ReviewFilters />

      {/* Reviews List */}
      {loading && page === 1 ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-md p-6 animate-pulse">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="ml-3">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <Star size={48} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No reviews yet</h3>
          <p className="text-gray-500 mb-4">Be the first to share your thoughts about this product!</p>
          <button
            onClick={() => setShowReviewModal(true)}
            className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
          >
            Write the First Review
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-primary-100 to-primary-200 rounded-full flex items-center justify-center">
                    <span className="font-semibold text-primary-700">
                      {review.user?.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="ml-3">
                    <h4 className="font-medium text-gray-900">
                      {review.user?.name || 'Anonymous'}
                    </h4>
                    <div className="flex items-center mt-1">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={14}
                            className={
                              star <= review.rating
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300'
                            }
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500 ml-2">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                      {review.order_id && (
                        <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          Verified Purchase
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {user?.id === review.user_id && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setEditingReview(review);
                        setShowReviewModal(true);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteReview(review.id)}
                      className="text-xs text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>

              <p className="text-gray-700 mb-4">{review.comment}</p>

              {/* Review Images */}
              {review.images && review.images.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {review.images.map((image: string, index: number) => (
                    <img
                      key={index}
                      src={` https://api.hypermarket.co.ke/storage/${image}`}
                      alt={`Review image ${index + 1}`}
                      className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-90"
                      onClick={() => {
                        // You can implement a lightbox here
                        window.open(` https://api.hypermarket.co.ke/storage/${image}`, '_blank');
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Review Actions */}
              <div className="flex items-center justify-between pt-4 border-t">
                <button
                  onClick={() => handleHelpful(review.id)}
                  className="flex items-center text-sm text-gray-600 hover:text-primary-600"
                  disabled={review.user_has_upvoted}
                >
                  <ThumbsUp size={16} className="mr-1" />
                  Helpful ({review.upvotes || 0})
                </button>
                
                <button className="flex items-center text-sm text-gray-600 hover:text-primary-600">
                  <MessageCircle size={16} className="mr-1" />
                  Report
                </button>
              </div>
            </div>
          ))}

          {/* Load More */}
          {hasMore && (
            <div className="text-center mt-6">
              <button
                onClick={() => setPage(prev => prev + 1)}
                disabled={loading}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Load More Reviews'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Review Modal */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => {
          setShowReviewModal(false);
          setEditingReview(null);
        }}
        productId={productId}
        productName={productName}
        productImage={productImage}
        existingReview={editingReview}
        onSuccess={() => {
          setPage(1);
          fetchReviews();
          fetchStats();
        }}
      />
    </div>
  );
};

export default ReviewList;