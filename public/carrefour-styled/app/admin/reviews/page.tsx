// app/admin/reviews/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Star, CheckCircle, XCircle, Filter, Search, ThumbsUp, ThumbsDown } from 'lucide-react';

interface Review {
  id: number;
  rating: number;
  comment: string;
  is_approved: boolean;
  created_at: string;
  user: {
    name: string;
    email: string;
  };
  product: {
    name: string;
    id: number;
  };
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingReviews, setPendingReviews] = useState<Review[]>([]);
  const [filters, setFilters] = useState({
    status: '',
    min_rating: '',
    search: '',
  });

  useEffect(() => {
    fetchReviews();
    fetchPendingReviews();
  }, [filters]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await api.reviews.getAll(filters);
      setReviews(response.data);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingReviews = async () => {
    try {
      const response = await api.admin.getPendingReviews();
      setPendingReviews(response.data);
    } catch (error) {
      console.error('Failed to fetch pending reviews:', error);
    }
  };

  const handleReviewAction = async (reviewId: number, action: 'approve' | 'reject') => {
    try {
      if (action === 'approve') {
        await api.admin.approveReview(reviewId);
      } else {
        await api.admin.rejectReview(reviewId, { reason: 'Manual rejection' });
      }
      
      // Update both lists
      setPendingReviews(pendingReviews.filter(r => r.id !== reviewId));
      fetchReviews();
      alert(`Review ${action}d successfully`);
    } catch (error) {
      alert(`Failed to ${action} review`);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={`${
              star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reviews Management</h1>
        <p className="text-gray-600">Manage product reviews and ratings</p>
      </div>

      {/* Pending Reviews Section */}
      {pendingReviews.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Pending Approval</h2>
            <span className="px-3 py-1 text-sm font-medium text-white bg-yellow-500 rounded-full">
              {pendingReviews.length} pending
            </span>
          </div>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingReviews.map((review) => (
              <div key={review.id} className="bg-white rounded-lg shadow border border-yellow-200">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-medium text-gray-900">{review.user.name}</div>
                      <div className="text-sm text-gray-500">{review.user.email}</div>
                    </div>
                    {renderStars(review.rating)}
                  </div>
                  
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-900 mb-1">Product</div>
                    <div className="text-gray-600">{review.product.name}</div>
                  </div>

                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-900 mb-1">Comment</div>
                    <div className="text-gray-600">{review.comment}</div>
                  </div>

                  <div className="flex justify-between">
                    <button
                      onClick={() => handleReviewAction(review.id, 'approve')}
                      className="flex items-center px-3 py-1 text-sm font-medium text-green-700 bg-green-100 rounded hover:bg-green-200"
                    >
                      <ThumbsUp size={14} className="mr-1" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReviewAction(review.id, 'reject')}
                      className="flex items-center px-3 py-1 text-sm font-medium text-red-700 bg-red-100 rounded hover:bg-red-200"
                    >
                      <ThumbsDown size={14} className="mr-1" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="p-4 mb-6 bg-white rounded-lg shadow">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                placeholder="Product or customer"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Rating</label>
            <select
              value={filters.min_rating}
              onChange={(e) => setFilters({...filters, min_rating: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Any Rating</option>
              <option value="5">5 Stars</option>
              <option value="4">4+ Stars</option>
              <option value="3">3+ Stars</option>
              <option value="2">2+ Stars</option>
              <option value="1">1+ Stars</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchReviews}
              className="inline-flex items-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              <Filter size={16} className="mr-2" />
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reviews.map((review) => (
                  <tr key={review.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{review.product.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{review.user.name}</div>
                        <div className="text-sm text-gray-500">{review.user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {renderStars(review.rating)}
                        <span className="ml-2 text-sm text-gray-900">{review.rating}.0</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <p className="text-sm text-gray-900 line-clamp-2">{review.comment}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {review.is_approved ? (
                          <CheckCircle className="text-green-500 mr-2" size={16} />
                        ) : (
                          <XCircle className="text-red-500 mr-2" size={16} />
                        )}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          review.is_approved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {review.is_approved ? 'Approved' : 'Pending'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(review.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        {!review.is_approved && (
                          <button
                            onClick={() => handleReviewAction(review.id, 'approve')}
                            className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded hover:bg-green-200"
                          >
                            Approve
                          </button>
                        )}
                        <button
                          onClick={() => handleReviewAction(review.id, 'reject')}
                          className="px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded hover:bg-red-200"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {reviews.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-gray-500">No reviews found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}