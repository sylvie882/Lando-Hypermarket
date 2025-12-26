// components/admin/BulkUpload.tsx
'use client';

import React, { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, X } from 'lucide-react';
import { api } from '@/lib/api';

interface BulkUploadProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface UploadStats {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
}

const BulkUpload: React.FC<BulkUploadProps> = ({ onSuccess, onError }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStats, setUploadStats] = useState<UploadStats | null>(null);
  const [showTemplateInfo, setShowTemplateInfo] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
      } else {
        onError?.('Please upload a CSV file');
      }
    }
  }, [onError]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
      } else {
        onError?.('Please upload a CSV file');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      setUploadStats(null);
      
      const response = await api.admin.uploadProductsBulk(formData);
      
      setUploadStats({
        total: response.data.total,
        successful: response.data.successful,
        failed: response.data.failed,
        errors: response.data.errors || []
      });

      if (response.data.successful > 0) {
        onSuccess?.();
      }

    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Upload failed';
      onError?.(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const templateHeaders = [
      'name',
      'description',
      'price',
      'compare_price',
      'cost',
      'sku',
      'barcode',
      'quantity',
      'category',
      'brand',
      'weight',
      'weight_unit',
      'length',
      'width',
      'height',
      'dimension_unit',
      'status',
      'featured',
      'meta_title',
      'meta_description',
      'tags'
    ];

    const exampleRow = [
      'Wireless Headphones',
      'Premium wireless headphones with noise cancellation',
      '199.99',
      '249.99',
      '120.00',
      'WH-001',
      '123456789012',
      '50',
      'Electronics/Audio',
      'AudioBrand',
      '0.3',
      'kg',
      '20',
      '15',
      '8',
      'cm',
      'active',
      'true',
      'Wireless Headphones - Premium Audio',
      'Premium wireless headphones with noise cancellation feature',
      'headphones,wireless,audio'
    ];

    const csvContent = [
      templateHeaders.join(','),
      exampleRow.join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'products_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const resetUpload = () => {
    setFile(null);
    setUploadStats(null);
  };

  return (
    <div className="space-y-6">
      {/* Template Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <FileSpreadsheet className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">CSV Template Required</h4>
              <p className="text-sm text-blue-700 mt-1">
                Download our template to ensure proper formatting. Required fields: name, price, quantity.
              </p>
              <button
                onClick={() => setShowTemplateInfo(!showTemplateInfo)}
                className="text-sm text-blue-600 hover:text-blue-800 mt-2 font-medium"
              >
                {showTemplateInfo ? 'Hide details' : 'Show column details'}
              </button>
            </div>
          </div>
          <button
            onClick={downloadTemplate}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Download Template
          </button>
        </div>

        {showTemplateInfo && (
          <div className="mt-4 p-3 bg-white border border-blue-100 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="font-medium">name*</span>
                <span className="text-gray-600 block">Product name</span>
              </div>
              <div>
                <span className="font-medium">price*</span>
                <span className="text-gray-600 block">Selling price</span>
              </div>
              <div>
                <span className="font-medium">quantity*</span>
                <span className="text-gray-600 block">Stock quantity</span>
              </div>
              <div>
                <span className="font-medium">sku</span>
                <span className="text-gray-600 block">Stock keeping unit</span>
              </div>
              <div>
                <span className="font-medium">category</span>
                <span className="text-gray-600 block">Category path</span>
              </div>
              <div>
                <span className="font-medium">status</span>
                <span className="text-gray-600 block">active/inactive</span>
              </div>
              <div>
                <span className="font-medium">description</span>
                <span className="text-gray-600 block">Product description</span>
              </div>
              <div>
                <span className="font-medium">tags</span>
                <span className="text-gray-600 block">Comma separated</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upload Area */}
      {!uploadStats ? (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="max-w-md mx-auto">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Upload className="w-6 h-6 text-gray-400" />
            </div>
            
            {file ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2">
                  <FileSpreadsheet className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-gray-900">{file.name}</span>
                  <span className="text-sm text-gray-500">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                  <button
                    onClick={resetUpload}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
                    uploading
                      ? 'bg-blue-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white`}
                >
                  {uploading ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </span>
                  ) : (
                    'Upload Products'
                  )}
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Drop your CSV file here
                </h3>
                <p className="text-gray-600 mb-6">
                  or click to browse files
                </p>
                
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <span className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors">
                    <Upload className="w-4 h-4 mr-2" />
                    Select CSV File
                  </span>
                </label>
                
                <p className="text-sm text-gray-500 mt-4">
                  Supports .csv files up to 10MB
                </p>
              </>
            )}
          </div>
        </div>
      ) : (
        /* Upload Results */
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b">
            <h3 className="font-medium text-gray-900">Upload Results</h3>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {uploadStats.total}
                </div>
                <div className="text-sm text-gray-600">Total Records</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-700 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 mr-1" />
                  {uploadStats.successful}
                </div>
                <div className="text-sm text-green-600">Successful</div>
              </div>
              
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-700 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 mr-1" />
                  {uploadStats.failed}
                </div>
                <div className="text-sm text-red-600">Failed</div>
              </div>
            </div>

            {/* Error Details */}
            {uploadStats.errors.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Errors Found</h4>
                <div className="bg-red-50 border border-red-200 rounded-lg overflow-hidden">
                  <div className="grid grid-cols-3 bg-red-100 px-4 py-2 text-sm font-medium text-red-900">
                    <div>Row</div>
                    <div>Error</div>
                    <div>Field</div>
                  </div>
                  <div className="divide-y divide-red-100">
                    {uploadStats.errors.map((error, index) => (
                      <div key={index} className="grid grid-cols-3 px-4 py-3 text-sm">
                        <div className="font-medium">Row {error.row}</div>
                        <div className="text-red-700">{error.error}</div>
                        <div className="text-red-600">-</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4 border-t">
              <button
                onClick={resetUpload}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Upload Another File
              </button>
              
              <button
                onClick={() => {
                  resetUpload();
                  onSuccess?.();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Products
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkUpload;