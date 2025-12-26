'use client';

import React, { useState, useEffect } from 'react';
import { Star, X, Upload, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import toast from 'react-hot-toast';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: number;
  productName: string;
  productImage?: string;
  orderId?: number;
  existingReview?: any;
  onSuccess: () => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  productId,
  productName,
  productImage,
  orderId,
  existingReview,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [images, setImages] = useState<File[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>(existingReview?.images || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<number>(orderId || 0);
  const [hasPurchased, setHasPurchased] = useState(false);

  // Fetch user's orders that contain this product
  useEffect(() => {
    if (isOpen && user) {
      fetchUserOrders();
    }
  }, [isOpen, user, productId]);

  const fetchUserOrders = async () => {
    try {
      setIsLoading(true);
      const response = await api.orders.getUserOrders();
      
      // Check if any order contains this product (delivered or completed)
      const eligibleOrders = response.data.filter((order: any) => {
        // Check if order is in a completed state
        const isCompleted = ['delivered', 'completed', 'fulfilled'].includes(order.status?.toLowerCase());
        
        // Check if any item in the order matches the product
        const hasProduct = order.items?.some((item: any) => 
          item.product_id === productId || 
          item.product?.id === productId ||
          item.product_id?.toString() === productId.toString()
        );
        
        return isCompleted && hasProduct;
      });
      
      setUserOrders(eligibleOrders);
      setHasPurchased(eligibleOrders.length > 0);
      
      if (eligibleOrders.length > 0 && !selectedOrderId) {
        setSelectedOrderId(eligibleOrders[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error('Failed to load your orders');
    } finally {
      setIsLoading(false);
    }
  };

  // If editing existing review, user has obviously purchased it
  useEffect(() => {
    if (existingReview) {
      setHasPurchased(true);
    }
  }, [existingReview]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: File[] = [];
    const newPreviews: string[] = [];

    Array.from(files).forEach(file => {
      if (images.length + newImages.length >= 4) {
        toast.error('Maximum 4 images allowed');
        return;
      }

      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast.error('Image size should be less than 2MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast.error('Only image files are allowed');
        return;
      }

      newImages.push(file);
      const preview = URL.createObjectURL(file);
      newPreviews.push(preview);
    });

    setImages([...images, ...newImages]);
    setPreviewImages([...previewImages, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    if (previewImages[index].startsWith('blob:')) {
      URL.revokeObjectURL(previewImages[index]);
    }
    
    const newPreviewImages = [...previewImages];
    newPreviewImages.splice(index, 1);
    setPreviewImages(newPreviewImages);
    
    if (index < images.length) {
      const newImages = [...images];
      newImages.splice(index, 1);
      setImages(newImages);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (!comment.trim()) {
      toast.error('Please write a review comment');
      return;
    }

    if (comment.trim().length < 20) {
      toast.error('Review must be at least 20 characters long');
      return;
    }

    // For new reviews, require order selection
    if (!existingReview && !selectedOrderId) {
      toast.error('Please select an order');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      
      // For new reviews, include order_id
      if (!existingReview) {
        formData.append('order_id', selectedOrderId.toString());
      }
      
      formData.append('product_id', productId.toString());
      formData.append('rating', rating.toString());
      formData.append('comment', comment);
      
      images.forEach((image, index) => {
        formData.append(`images[${index}]`, image);
      });

      if (existingReview) {
        // Update existing review (order_id is not needed for updates)
        await api.reviews.update(existingReview.id, formData);
        toast.success('Review updated successfully!');
      } else {
        // Create new review
        await api.reviews.create(formData);
        toast.success('Review submitted successfully! It will be visible after approval.');
      }

      onSuccess();
      onClose();
      resetForm();
    } catch (error: any) {
      console.error('Review submission error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Failed to submit review';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setRating(existingReview?.rating || 0);
    setComment(existingReview?.comment || '');
    setImages([]);
    // Only revoke blob URLs (newly uploaded images)
    previewImages.forEach(preview => {
      if (preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    });
    setPreviewImages(existingReview?.images || []);
    if (!existingReview) {
      setSelectedOrderId(userOrders.length > 0 ? userOrders[0].id : 0);
    }
  };

  // Handle modal close
  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-2xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {existingReview ? 'Edit Your Review' : 'Write a Review'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">Share your experience with this product</p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-500 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close modal"
            >
              <X size={24} />
            </button>
          </div>

          {/* Product Info */}
          <div className="p-6 border-b">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 flex-shrink-0">
                <img
                  src={productImage || '/images/placeholder-product.jpg'}
                  alt={productName}
                  className="w-full h-full object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.src = '/images/placeholder-product.jpg';
                  }}
                />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{productName}</h4>
                <p className="text-sm text-gray-500 mt-1">
                  {existingReview ? 'Update your review below' : 'Please rate your experience'}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {/* Order Selection - Only show for new reviews */}
            {!existingReview && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Order *
                </label>
                {isLoading ? (
                  <div className="space-y-2">
                    <div className="animate-pulse h-10 bg-gray-200 rounded"></div>
                    <p className="text-xs text-gray-500">Loading your orders...</p>
                  </div>
                ) : !hasPurchased ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <AlertCircle className="text-yellow-500 mr-2 flex-shrink-0 mt-0.5" size={20} />
                      <div>
                        <p className="text-sm text-yellow-700 font-medium mb-1">
                          Purchase Required
                        </p>
                        <p className="text-xs text-yellow-600">
                          You need to purchase and receive this product before you can review it.
                          <br />
                          <span className="font-medium">
                            Status: {userOrders.length === 0 ? 'No purchases found' : 'Order not delivered yet'}
                          </span>
                        </p>
                        {user && (
                          <button
                            type="button"
                            onClick={() => window.location.href = `/products/${productId}`}
                            className="mt-2 text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded transition-colors"
                          >
                            Purchase This Product
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <select
                      value={selectedOrderId}
                      onChange={(e) => setSelectedOrderId(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    >
                      <option value="">Select an order</option>
                      {userOrders.map((order) => (
                        <option key={order.id} value={order.id}>
                          Order #{order.order_number || order.id} • 
                          Purchased: {new Date(order.created_at).toLocaleDateString()} • 
                          Status: {order.status}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Select the order where you purchased this product
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Rating */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Rating *
              </label>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 focus:outline-none transition-transform hover:scale-110"
                    aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                  >
                    <Star
                      size={32}
                      className={
                        star <= (hoverRating || rating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }
                    />
                  </button>
                ))}
                <span className="ml-3 text-lg font-semibold text-gray-700">
                  {rating > 0 ? `${rating}.0` : '0.0'}
                  <span className="text-sm font-normal text-gray-500 ml-1">/ 5.0</span>
                </span>
              </div>
              <div className="flex justify-between mt-1 text-xs text-gray-500">
                <span>Poor</span>
                <span>Excellent</span>
              </div>
            </div>

            {/* Review Comment */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Review *
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share details of your experience with this product. What did you like or dislike? Would you recommend it to others?"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none transition-colors"
                required
                minLength={20}
                maxLength={1000}
              />
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-500">
                  Be honest and specific. Minimum 20 characters.
                </span>
                <span className={`text-xs font-medium ${comment.length < 20 ? 'text-red-500' : 'text-green-500'}`}>
                  {comment.length}/1000
                </span>
              </div>
            </div>

            {/* Image Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Photos (Optional)
              </label>
              <div className="grid grid-cols-4 gap-3">
                {/* Existing images */}
                {previewImages.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview.startsWith('blob:') ? preview : `http://localhost:8000/storage/${preview}`}
                      alt={`Review image ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.src = '/images/placeholder-product.jpg';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      aria-label="Remove image"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}

                {/* Upload button - only show if less than 4 images */}
                {previewImages.length < 4 && (
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <div className="w-full h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-primary-500 hover:bg-primary-50 transition-colors">
                      <Upload size={24} className="text-gray-400 mb-1" />
                      <span className="text-xs text-gray-500">Add Photo</span>
                      <span className="text-xs text-gray-400">
                        ({previewImages.length}/4)
                      </span>
                    </div>
                  </label>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Upload up to 4 images (JPG, PNG, max 2MB each)
              </p>
            </div>

            {/* Tips */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h5 className="font-medium text-gray-700 mb-2 flex items-center">
                <CheckCircle size={16} className="text-green-500 mr-2 flex-shrink-0" />
                Tips for a helpful review:
              </h5>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Mention specific features you liked or didn't like</li>
                <li>• Describe product quality and durability</li>
                <li>• Compare with similar products if applicable</li>
                <li>• Include how you're using the product</li>
                <li>• Mention delivery experience and packaging</li>
                <li>• Note if the product matched the description</li>
              </ul>
            </div>

            {/* Footer */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || (!existingReview && !hasPurchased)}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                  (!existingReview && !hasPurchased) || isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-primary-600 hover:bg-primary-700'
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Submitting...
                  </span>
                ) : existingReview ? (
                  'Update Review'
                ) : (
                  'Submit Review'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;