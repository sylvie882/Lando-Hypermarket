// components/admin/ProductTable.tsx
import React from 'react';
import { Edit, Trash2, Eye } from 'lucide-react';
import type { Product } from '@/types';

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: number) => void;
}

export default function ProductTable({ products, onEdit, onDelete }: ProductTableProps) {
  // Helper function to safely format price
  const formatPrice = (price: number | string): string => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) {
      return '$0.00';
    }
    return `$${numPrice.toFixed(2)}`;
  };

  // Helper function to safely convert to number for comparison
  const toNumber = (value: number | string): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  // Helper function to get category name
  const getCategoryName = (product: Product): string => {
    if (product.category?.name) {
      return product.category.name;
    }
    return 'Uncategorized';
  };

  // Helper function to format date
  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  // Helper function to safely get image URL
  const getImageUrl = (image: string | null | undefined): string => {
    if (!image) return '';
    
    if (image.startsWith('http')) {
      return image;
    }
    
    // Clean path and construct URL
    const cleanPath = image.replace(/^\//, '');
    return `https://api.hypermarket.co.ke/storage/${cleanPath}`;
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Product
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Category
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Price
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Stock
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Added
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {products.map((product) => {
            // Convert prices to numbers for comparison
            const priceNum = toNumber(product.price);
            const finalPriceNum = product.final_price ? toNumber(product.final_price) : null;
            const discountedPriceNum = product.discounted_price ? toNumber(product.discounted_price) : null;
            
            return (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0">
                      {product.thumbnail ? (
                        <img 
                          src={getImageUrl(product.thumbnail)}
                          alt={product.name}
                          className="h-10 w-10 rounded object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/images/placeholder-product.jpg';
                          }}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-500 text-sm">IMG</span>
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">
                        SKU: {product.sku || `ID: ${product.id}`}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {getCategoryName(product)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="flex flex-col">
                    <span>{formatPrice(priceNum)}</span>
                    {discountedPriceNum && discountedPriceNum !== priceNum && (
                      <span className="text-xs text-green-600 line-through">
                        {formatPrice(discountedPriceNum)}
                      </span>
                    )}
                    {finalPriceNum && finalPriceNum < priceNum && (
                      <span className="text-xs font-semibold text-red-600">
                        Final: {formatPrice(finalPriceNum)}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          product.stock_quantity > 20 ? 'bg-green-500' : 
                          product.stock_quantity > 5 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ 
                          width: `${Math.min((product.stock_quantity / 50) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                    <span className="ml-2 text-sm text-gray-600">
                      {product.stock_quantity}
                      {product.is_in_stock !== undefined && (
                        <span className={`ml-1 text-xs ${product.is_in_stock ? 'text-green-600' : 'text-red-600'}`}>
                          ({product.is_in_stock ? 'In Stock' : 'Out'})
                        </span>
                      )}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col gap-1">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      (product as any).is_active !== false
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {(product as any).is_active !== false ? 'Active' : 'Inactive'}
                    </span>
                    {(product as any).is_featured && (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                        Featured
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(product.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => onEdit(product)}
                      className="p-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded"
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(product.id)}
                      className="p-1 text-red-600 hover:text-red-900 hover:bg-red-50 rounded"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button
                      className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded"
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {products.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-gray-500">No products found</p>
        </div>
      )}
    </div>
  );
}