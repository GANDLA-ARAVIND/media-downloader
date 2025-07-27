import React from 'react';
import { User, TrendingUp, Download, BarChart3, Calendar, Award } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface Download {
  id: string;
  status: 'pending' | 'downloading' | 'analyzing' | 'completed' | 'error';
  timestamp: Date;
  quality: string;
  audioOnly: boolean;
}

interface UserDashboardProps {
  user: User;
  downloads: Download[];
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ user, downloads }) => {
  const completedDownloads = downloads.filter(d => d.status === 'completed');
  const thisWeekDownloads = downloads.filter(d => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return d.timestamp >= weekAgo;
  });

  const qualityStats = downloads.reduce((acc, download) => {
    acc[download.quality] = (acc[download.quality] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const audioOnlyCount = downloads.filter(d => d.audioOnly).length;
  const videoCount = downloads.length - audioOnlyCount;

  const achievements = [
    { 
      title: 'First Download', 
      description: 'Downloaded your first video',
      icon: '🎉',
      unlocked: downloads.length > 0
    },
    { 
      title: 'Power User', 
      description: 'Downloaded 10+ videos',
      icon: '💪',
      unlocked: downloads.length >= 10
    },
    { 
      title: 'Quality Enthusiast', 
      description: 'Downloaded in 1080p',
      icon: '🎬',
      unlocked: downloads.some(d => d.quality === '1080p')
    },
    { 
      title: 'Audio Collector', 
      description: 'Downloaded 5+ audio files',
      icon: '🎵',
      unlocked: audioOnlyCount >= 5
    }
  ];

  return (
    <div className="space-y-6">
      {/* User Profile */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h2>
            <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Downloads</p>
                <p className="text-2xl font-bold">{downloads.length}</p>
              </div>
              <Download className="w-8 h-8 text-blue-200" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Completed</p>
                <p className="text-2xl font-bold">{completedDownloads.length}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-200" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">This Week</p>
                <p className="text-2xl font-bold">{thisWeekDownloads.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-200" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Success Rate</p>
                <p className="text-2xl font-bold">
                  {downloads.length > 0 ? Math.round((completedDownloads.length / downloads.length) * 100) : 0}%
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-orange-200" />
            </div>
          </div>
        </div>
      </div>

      {/* Download Preferences */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Download Preferences</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Quality Distribution</h4>
            <div className="space-y-2">
              {Object.entries(qualityStats).map(([quality, count]) => (
                <div key={quality} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{quality}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${(count / downloads.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Content Type</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Video</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{videoCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Audio Only</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{audioOnlyCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3 mb-4">
          <Award className="w-6 h-6 text-yellow-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Achievements</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievements.map((achievement, index) => (
            <div key={index} className={`p-4 rounded-lg border-2 ${
              achievement.unlocked 
                ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' 
                : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
            }`}>
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{achievement.icon}</span>
                <div>
                  <h4 className={`font-medium ${
                    achievement.unlocked 
                      ? 'text-yellow-800 dark:text-yellow-200' 
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {achievement.title}
                  </h4>
                  <p className={`text-sm ${
                    achievement.unlocked 
                      ? 'text-yellow-600 dark:text-yellow-300' 
                      : 'text-gray-500 dark:text-gray-500'
                  }`}>
                    {achievement.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};