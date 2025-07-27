import React from 'react';
import { TrendingUp, MessageCircle, Heart, Hash, Volume2, FileText, Download, Share2 } from 'lucide-react';

interface AnalyticsData {
  sentiment: {
    positive: number;
    negative: number;
    neutral: number;
  };
  keywords: string[];
  transcript: string;
  engagement: {
    likes: string;
    views: string;
    comments: string;
    shares: string;
  };
  topics: string[];
}

interface AnalyticsDashboardProps {
  data: AnalyticsData;
  onExport: (format: 'csv' | 'pdf') => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ data, onExport }) => {
  const sentimentTotal = data.sentiment.positive + data.sentiment.negative + data.sentiment.neutral;
  const positivePercentage = (data.sentiment.positive / sentimentTotal) * 100;
  const negativePercentage = (data.sentiment.negative / sentimentTotal) * 100;
  const neutralPercentage = (data.sentiment.neutral / sentimentTotal) * 100;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Video Analytics</h2>
            <p className="text-gray-600 dark:text-gray-400">AI-powered insights</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onExport('csv')}
            className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-all duration-300 transform hover:scale-105"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={() => onExport('pdf')}
            className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-all duration-300 transform hover:scale-105"
          >
            <FileText className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Views</p>
              <p className="text-2xl font-bold">{data.engagement.views}</p>
            </div>
            <Heart className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Likes</p>
              <p className="text-2xl font-bold">{data.engagement.likes}</p>
            </div>
            <Heart className="w-8 h-8 text-green-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Comments</p>
              <p className="text-2xl font-bold">{data.engagement.comments}</p>
            </div>
            <MessageCircle className="w-8 h-8 text-purple-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Shares</p>
              <p className="text-2xl font-bold">{data.engagement.shares}</p>
            </div>
            <Share2 className="w-8 h-8 text-orange-200" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <MessageCircle className="w-5 h-5" />
            <span>Sentiment Analysis</span>
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Positive</span>
              <span className="text-sm font-medium text-green-600">{positivePercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${positivePercentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Negative</span>
              <span className="text-sm font-medium text-red-600">{negativePercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
              <div
                className="bg-red-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${negativePercentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Neutral</span>
              <span className="text-sm font-medium text-gray-600">{neutralPercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
              <div
                className="bg-gray-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${neutralPercentage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <Hash className="w-5 h-5" />
            <span>Trending Keywords</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {data.keywords.map((keyword, index) => (
              <span
                key={index}
                className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Topics</span>
          </h3>
          <div className="space-y-2">
            {data.topics.map((topic, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{topic}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <Volume2 className="w-5 h-5" />
            <span>Transcript Preview</span>
          </h3>
          <div className="max-h-32 overflow-y-auto">
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {data.transcript}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};