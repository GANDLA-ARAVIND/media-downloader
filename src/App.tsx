import { useState, useEffect } from 'react';
import { apiService } from './services/api';
import Header from './components/Header';
import { VideoDownloader } from './components/VideoDownloader';
import { BatchDownloader } from './components/BatchDownloader';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { DownloadProgress } from './components/DownloadProgress';
import { DownloadHistory } from './components/DownloadHistory';
import { UserDashboard } from './components/UserDashboard';
import { AuthModal } from './components/AuthModal';
import { ExportModal } from './components/ExportModal';
import { Settings } from './components/Settings';
import { User } from './services/api';

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

interface BatchItem {
  id: string;
  url: string;
  quality: string;
  audioOnly: boolean;
  status: 'pending' | 'downloading' | 'completed' | 'error';
  progress: number;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'download' | 'batch' | 'analytics' | 'history' | 'dashboard' | 'settings'>('download');
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedAnalytics, setSelectedAnalytics] = useState<any>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeDownloadIds, setActiveDownloadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) {
      setDarkMode(JSON.parse(savedDarkMode));
    }

    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    loadDownloads();
  }, []);

  useEffect(() => {
    if (activeDownloadIds.size > 0) {
      const interval = setInterval(async () => {
        for (const downloadId of activeDownloadIds) {
          try {
            const updatedDownload = await apiService.getDownloadStatus(downloadId);
            setDownloads(prev => prev.map(d => 
              d.id === downloadId ? {
                ...updatedDownload,
                timestamp: new Date(updatedDownload.timestamp)
              } : d
            ));

            if (updatedDownload.status === 'completed' || updatedDownload.status === 'error') {
              setActiveDownloadIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(downloadId);
                return newSet;
              });
            }
          } catch (error) {
            console.error('Error polling download status:', error);
          }
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [activeDownloadIds]);

  const loadDownloads = async () => {
    try {
      const allDownloads = await apiService.getAllDownloads();
      setFetchError(null);
      setDownloads(allDownloads.map(d => ({
        ...d,
        timestamp: new Date(d.timestamp)
      })));
    } catch (error) {
      console.error('Error loading downloads:', error);
      setFetchError(`Failed to load downloads: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const handleLogin = () => {
    setShowAuthModal(true);
  };

  const handleAuthSuccess = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const handleDownload = async (url: string, quality: string, audioOnly: boolean) => {
    try {
      setFetchError(null);
      const downloadResponse = await apiService.downloadVideo({ url, quality, audioOnly });
      setFetchError(null);
      
      const newDownload: Download = {
        ...downloadResponse,
        timestamp: new Date(downloadResponse.timestamp)
      };

      setDownloads(prev => [newDownload, ...prev]);
      setActiveDownloadIds(prev => new Set(prev).add(downloadResponse.downloadId));
    } catch (error) {
      console.error('Error starting download:', error);
      setFetchError(`Failed to start download: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const clearFetchError = () => {
    setFetchError(null);
  };

  const handleBatchDownload = (items: BatchItem[]) => {
    items.forEach((item, index) => {
      setTimeout(() => {
        handleDownload(item.url, item.quality, item.audioOnly);
      }, index * 1000);
    });
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    setShowExportModal(true);
    
    setTimeout(async () => {
      try {
        if (selectedAnalytics && downloads.length > 0) {
          const downloadWithAnalytics = downloads.find(d => d.analyticsData === selectedAnalytics);
          if (downloadWithAnalytics) {
            await apiService.exportAnalytics(downloadWithAnalytics.id, format);
          }
        }
      } catch (error) {
        console.error('Export error:', error);
      }
      setShowExportModal(false);
    }, 2000);
  };

  const handleViewAnalytics = (download: Download) => {
    if (download.analyticsData) {
      setSelectedAnalytics(download.analyticsData);
      setActiveTab('analytics');
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleDownloadComplete = () => {
    setActiveTab('history');
  };

  const activeDownloads = downloads.filter(d => d.status === 'downloading' || d.status === 'analyzing');

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark' : ''}`}>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-orange-900">
        <Header
          user={user}
          onLogin={handleLogin}
          onLogout={handleLogout}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
        />

        <main className="container mx-auto px-4 py-8">
          {fetchError && (
            <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
              <div className="flex items-center">
                <span className="text-red-600 dark:text-red-400 mr-2">⚠️</span>
                <p className="text-red-800 dark:text-red-200 font-medium">Connection Error</p>
              </div>
              <p className="text-red-700 dark:text-red-300 mt-1 text-sm">{fetchError}</p>
              <button
                onClick={() => setFetchError(null)}
                className="mt-2 text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-8">
            {[
              { id: 'download', label: 'Download', icon: '📥' },
              { id: 'batch', label: 'Batch', icon: '📋' },
              { id: 'analytics', label: 'Analytics', icon: '📊' },
              { id: 'history', label: 'History', icon: '🕒' },
              ...(user ? [{ id: 'dashboard', label: 'Dashboard', icon: '📱' }] : []),
              { id: 'settings', label: 'Settings', icon: '⚙️' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg'
                    : 'bg-white/70 dark:bg-gray-800/70 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {activeDownloads.length > 0 && (
            <div className="mb-8">
              <DownloadProgress downloads={activeDownloads} />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8">
              {activeTab === 'download' && (
                <VideoDownloader 
                  onDownload={handleDownload}
                  downloadError={fetchError}
                  clearDownloadError={clearFetchError}
                  onDownloadComplete={handleDownloadComplete}
                />
              )}
              
              {activeTab === 'batch' && (
                <BatchDownloader 
                  onBatchDownload={handleBatchDownload} 
                  onDownloadComplete={handleDownloadComplete}
                />
              )}
              
              {activeTab === 'analytics' && selectedAnalytics && (
                <AnalyticsDashboard data={selectedAnalytics} onExport={handleExport} />
              )}
              
              {activeTab === 'history' && (
                <DownloadHistory 
                  downloads={downloads}
                  onViewAnalytics={handleViewAnalytics}
                  onRedownload={handleDownload}
                />
              )}
              
              {activeTab === 'dashboard' && user && (
                <UserDashboard user={user} downloads={downloads} />
              )}
              
              {activeTab === 'settings' && (
                <Settings 
                  darkMode={darkMode}
                  toggleDarkMode={toggleDarkMode}
                  user={user}
                />
              )}
            </div>

            <div className="lg:col-span-4">
              <div className="sticky top-24 space-y-6">
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-orange-200 dark:border-orange-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Stats</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Total Downloads</span>
                      <span className="font-medium text-gray-900 dark:text-white">{downloads.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Completed</span>
                      <span className="font-medium text-green-600">{downloads.filter(d => d.status === 'completed').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">In Progress</span>
                      <span className="font-medium text-orange-600">{activeDownloads.length}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-orange-200 dark:border-orange-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {downloads.slice(0, 3).map(download => (
                      <div key={download.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <div className={`w-2 h-2 rounded-full ${
                          download.status === 'completed' ? 'bg-green-500' :
                          download.status === 'downloading' || download.status === 'analyzing' ? 'bg-orange-500' :
                          'bg-gray-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {download.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {download.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {showAuthModal && (
          <AuthModal
            onSuccess={handleAuthSuccess}
            onClose={() => setShowAuthModal(false)}
          />
        )}
        
        {showExportModal && (
          <ExportModal onClose={() => setShowExportModal(false)} />
        )}
      </div>
    </div>
  );
}

export default App;