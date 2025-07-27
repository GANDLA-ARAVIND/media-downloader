import React, { useState } from 'react';
import { Clock, Download, BarChart3, Play, Trash2, Search, Filter, ExternalLink } from 'lucide-react';
import { apiService } from '../services/api';

interface Download {
  id: string;
  url: string;
  title: string;
  quality: string;
  audioOnly: boolean;
  status: 'pending' | 'downloading' | 'analyzing' | 'completed' | 'error';
  progress: number;
  timestamp: Date;
  thumbnail?: string;
  duration?: string;
  fileSize?: string;
  analyticsData?: any;
  downloadUrl?: string;
}

interface DownloadHistoryProps {
  downloads: Download[];
  onViewAnalytics: (download: Download) => void;
  onRedownload: (url: string, quality: string, audioOnly: boolean) => void;
}

export const DownloadHistory: React.FC<DownloadHistoryProps> = ({ 
  downloads, 
  onViewAnalytics, 
  onRedownload 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredDownloads = downloads.filter(download => {
    const matchesSearch = download.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || download.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium';
    switch (status) {
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300`;
      case 'downloading':
      case 'analyzing':
        return `${baseClasses} bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300`;
      case 'error':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300`;
    }
  };

  const handleDelete = (id: string) => {
    // In a real app, this would delete from the downloads array
    console.log('Delete download:', id);
  };

  const handleDownloadFile = async (download: Download) => {
    try {
      await apiService.downloadFile(download.id);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-orange-200 dark:border-orange-700">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
          <Clock className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Download History</h2>
          <p className="text-gray-600 dark:text-gray-400">{downloads.length} total downloads</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search downloads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-10 pr-8 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="downloading">Downloading</option>
            <option value="analyzing">Analyzing</option>
            <option value="error">Error</option>
          </select>
        </div>
      </div>

      {/* Downloads List */}
      <div className="space-y-4">
        {filteredDownloads.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No downloads found</p>
          </div>
        ) : (
          filteredDownloads.map((download) => (
            <div key={download.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
              <div className="flex items-start space-x-4">
                {download.thumbnail && (
                  <img
                    src={download.thumbnail}
                    alt={download.title}
                    className="w-20 h-12 object-cover rounded"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {download.title}
                      </h3>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                        <span>{download.quality}</span>
                        <span>{download.audioOnly ? 'Audio Only' : 'Video'}</span>
                        {download.duration && <span>{download.duration}</span>}
                        {download.fileSize && <span>{download.fileSize}</span>}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {download.timestamp.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={getStatusBadge(download.status)}>
                        {download.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-2">
                  {download.status === 'completed' && (
                    <button
                      onClick={() => handleDownloadFile(download)}
                      className="flex items-center space-x-1 px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-800 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span className="text-sm">Download to your device</span>
                    </button>
                  )}
                  {download.status === 'completed' && download.analyticsData && (
                    <button
                      onClick={() => onViewAnalytics(download)}
                      className="flex items-center space-x-1 px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span className="text-sm">View Analytics</span>
                    </button>
                  )}
                  <button
                    onClick={() => onRedownload(download.url, download.quality, download.audioOnly)}
                    className="flex items-center space-x-1 px-3 py-1 bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span className="text-sm">Redownload</span>
                  </button>
                </div>
                <button
                  onClick={() => handleDelete(download.id)}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};