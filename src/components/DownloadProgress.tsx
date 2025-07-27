import React from 'react';
import { Download, Loader2, CheckCircle, AlertCircle, BarChart3 } from 'lucide-react';

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
}

interface DownloadProgressProps {
  downloads: Download[];
}

export const DownloadProgress: React.FC<DownloadProgressProps> = ({ downloads }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'downloading':
        return <Download className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'analyzing':
        return <BarChart3 className="w-4 h-4 text-purple-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'downloading':
        return 'Downloading...';
      case 'analyzing':
        return 'Analyzing content...';
      case 'completed':
        return 'Completed';
      case 'error':
        return 'Error';
      default:
        return 'Pending...';
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'downloading':
        return 'bg-blue-500';
      case 'analyzing':
        return 'bg-purple-500';
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
          <Download className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Download Progress</h2>
          <p className="text-gray-600 dark:text-gray-400">{downloads.length} active downloads</p>
        </div>
      </div>

      <div className="space-y-4">
        {downloads.map((download) => (
          <div key={download.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-3 mb-3">
              {download.thumbnail && (
                <img
                  src={download.thumbnail}
                  alt={download.title}
                  className="w-12 h-8 object-cover rounded"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 dark:text-white truncate">
                  {download.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {download.quality} • {download.audioOnly ? 'Audio Only' : 'Video'}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(download.status)}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {getStatusText(download.status)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Progress</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {Math.round(download.progress)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(download.status)}`}
                  style={{ width: `${download.progress}%` }}
                />
              </div>
            </div>

            {download.status === 'analyzing' && (
              <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-purple-500" />
                  <span className="text-sm text-purple-700 dark:text-purple-300">
                    Extracting insights: sentiment analysis, keywords, engagement metrics...
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};