import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Download, FileAudio, Clock, Eye, Heart, MessageCircle } from 'lucide-react';
import { apiService, VideoInfo } from '../services/api';

interface BatchItem {
  id: string;
  url: string;
  quality: string;
  audioOnly: boolean;
  status: 'pending' | 'downloading' | 'completed' | 'error';
  progress: number;
  videoInfo?: VideoInfo | null;
  analyzeError?: string | null;
  isAnalyzing?: boolean;
  downloadId?: string | null;
}

interface BatchDownloaderProps {
  onBatchDownload: (items: BatchItem[]) => void;
  onDownloadComplete: () => void;
}

export const BatchDownloader: React.FC<BatchDownloaderProps> = ({ onBatchDownload, onDownloadComplete }) => {
  const [batchItems, setBatchItems] = useState<BatchItem[]>([
    { id: crypto.randomUUID(), url: '', quality: '720p', audioOnly: false, status: 'pending', progress: 0 },
  ]);

  const isValidUrl = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  useEffect(() => {
    const analyzeUrl = async (item: BatchItem, index: number) => {
      if (!item.url || !isValidUrl(item.url)) {
        setBatchItems(prev => {
          const newItems = [...prev];
          newItems[index] = { ...newItems[index], videoInfo: null, analyzeError: null, isAnalyzing: false };
          return newItems;
        });
        return;
      }

      setBatchItems(prev => {
        const newItems = [...prev];
        newItems[index] = { ...newItems[index], isAnalyzing: true, analyzeError: null, videoInfo: null };
        return newItems;
      });

      try {
        const info = await apiService.getVideoInfo(item.url);
        setBatchItems(prev => {
          const newItems = [...prev];
          newItems[index] = {
            ...newItems[index],
            videoInfo: info,
            quality: info.availableQualities && info.availableQualities.length > 0
              ? info.availableQualities[info.availableQualities.length - 1]
              : '720p',
            isAnalyzing: false,
          };
          return newItems;
        });
      } catch (err) {
        setBatchItems(prev => {
          const newItems = [...prev];
          newItems[index] = {
            ...newItems[index],
            analyzeError: err instanceof Error ? err.message : 'Failed to analyze video',
            isAnalyzing: false,
            videoInfo: null,
          };
          return newItems;
        });
      }
    };

    const timeouts = batchItems.map((item, index) => {
      if (item.url && isValidUrl(item.url)) {
        return setTimeout(() => analyzeUrl(item, index), 500);
      }
      return null;
    });

    return () => timeouts.forEach(timeout => timeout && clearTimeout(timeout));
  }, [batchItems.map(item => item.url).join(',')]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    let timeout: NodeJS.Timeout | null = null;
    const activeDownloads = batchItems.filter(item => item.downloadId && item.status === 'downloading');

    if (activeDownloads.length > 0) {
      console.log('Starting polling for downloads:', activeDownloads.map(item => ({ id: item.id, url: item.url, status: item.status })));

      interval = setInterval(async () => {
        console.log('Polling cycle. Active downloads:', activeDownloads.map(item => ({ id: item.id, status: item.status, progress: item.progress })));
        
        for (const item of activeDownloads) {
          try {
            const downloadStatus = await apiService.getDownloadStatus(item.downloadId!);
            console.log(`Download status for ${item.id}:`, { status: downloadStatus.status, progress: downloadStatus.progress });
            
            setBatchItems(prev => {
              const newItems = [...prev];
              const index = newItems.findIndex(i => i.id === item.id);
              newItems[index] = {
                ...newItems[index],
                progress: downloadStatus.progress,
                status: downloadStatus.status,
              };
              return newItems;
            });

            if (downloadStatus.status === 'completed' || downloadStatus.status === 'error') {
              setBatchItems(prev => {
                const newItems = [...prev];
                const index = newItems.findIndex(i => i.id === item.id);
                newItems[index] = {
                  ...newItems[index],
                  downloadId: null,
                  status: downloadStatus.status,
                  analyzeError: downloadStatus.status === 'error' ? (downloadStatus.errorMessage ?? 'Download failed') : null,
                };
                return newItems;
              });
            }
          } catch (err) {
            console.error(`Error polling download ${item.id}:`, err);
            setBatchItems(prev => {
              const newItems = [...prev];
              const index = newItems.findIndex(i => i.id === item.id);
              newItems[index] = {
                ...newItems[index],
                status: 'error',
                downloadId: null,
                analyzeError: err instanceof Error ? err.message : 'Failed to check download status',
              };
              return newItems;
            });
          }
        }
      }, 1000);

      // Fallback timeout to clean up stuck downloads
      timeout = setTimeout(() => {
        console.log('Timeout triggered. Marking stuck downloads as error.');
        setBatchItems(prev => prev.map(item => 
          item.status === 'downloading' 
            ? { ...item, status: 'error', downloadId: null, analyzeError: 'Download timed out' }
            : item
        ));
      }, 2 * 60 * 1000); // 2 minutes
    }

    return () => {
      if (interval) {
        console.log('Cleaning up polling interval.');
        clearInterval(interval);
      }
      if (timeout) {
        console.log('Cleaning up timeout.');
        clearTimeout(timeout);
      }
    };
  }, [batchItems]);

  const addBatchItem = () => {
    setBatchItems([...batchItems, {
      id: crypto.randomUUID(),
      url: '',
      quality: '720p',
      audioOnly: false,
      status: 'pending',
      progress: 0,
    }]);
  };

  const removeBatchItem = (id: string) => {
    if (batchItems.length > 1) {
      setBatchItems(batchItems.filter(item => item.id !== id));
    }
  };

  const updateBatchItem = (id: string, field: keyof BatchItem, value: any) => {
    setBatchItems(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleBatchDownload = async () => {
    const validItems = batchItems.filter(item => item.url && isValidUrl(item.url));
    if (validItems.length === 0) {
      console.log('No valid items to download.');
      return;
    }

    console.log('Starting batch download for items:', validItems.map(item => ({ id: item.id, url: item.url })));
    
    let hasErrors = false;
    for (const item of validItems) {
      try {
        const downloadResponse = await apiService.downloadVideo({
          url: item.url,
          quality: item.quality,
          audioOnly: item.audioOnly,
        });
        setBatchItems(prev => {
          const newItems = [...prev];
          const index = newItems.findIndex(i => i.id === item.id);
          newItems[index] = {
            ...newItems[index],
            status: 'downloading',
            progress: 0,
            downloadId: downloadResponse.downloadId,
          };
          return newItems;
        });
      } catch (err) {
        console.error(`Failed to start download for ${item.url}:`, err);
        setBatchItems(prev => {
          const newItems = [...prev];
          const index = newItems.findIndex(i => i.id === item.id);
          newItems[index] = {
            ...newItems[index],
            status: 'error',
            analyzeError: err instanceof Error ? err.message : 'Failed to start download',
          };
          return newItems;
        });
        hasErrors = true;
      }
    }

    onBatchDownload(validItems);
    console.log('All downloads initiated. Triggering navigation to history tab.');
    onDownloadComplete();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-orange-200 dark:border-orange-700">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
          <Download className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Batch Downloader</h2>
          <p className="text-gray-600 dark:text-gray-400">Download multiple videos</p>
        </div>
      </div>

      <div className="space-y-4">
        {batchItems.map((item, index) => (
          <div key={item.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900 dark:text-white">Video {index + 1}</h3>
              {batchItems.length > 1 && (
                <button
                  onClick={() => removeBatchItem(item.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Video URL
                </label>
                <input
                  type="url"
                  value={item.url}
                  onChange={(e) => updateBatchItem(item.id, 'url', e.target.value)}
                  placeholder="Paste video URL here..."
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  disabled={item.status === 'downloading'}
                />
              </div>

              {item.isAnalyzing && (
                <div className="p-3 bg-gray-100 dark:bg-gray-600 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Analyzing video...</p>
                </div>
              )}

              {item.analyzeError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-700 dark:text-red-300 text-sm">{item.analyzeError}</p>
                </div>
              )}

              {item.videoInfo && !item.isAnalyzing && (
                <div className="p-3 bg-gray-100 dark:bg-gray-600 rounded-lg">
                  <div className="flex space-x-4">
                    <img
                      src={item.videoInfo.thumbnail}
                      alt={item.videoInfo.title}
                      className="w-24 h-16 object-cover rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=800';
                      }}
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{item.videoInfo.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{item.videoInfo.author}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{item.videoInfo.duration}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Eye className="w-3 h-3" />
                          <span>{item.videoInfo.views}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Heart className="w-3 h-3" />
                          <span>{item.videoInfo.likes}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageCircle className="w-3 h-3" />
                          <span>{item.videoInfo.comments}</span>
                        </div>
                      </div>
                      {item.videoInfo.availableQualities && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Available qualities: {item.videoInfo.availableQualities.join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quality
                  </label>
                  <select
                    value={item.quality}
                    onChange={(e) => updateBatchItem(item.id, 'quality', e.target.value)}
                    disabled={item.status === 'downloading' || item.isAnalyzing}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    {item.videoInfo?.availableQualities ? (
                      item.videoInfo.availableQualities.map(qual => (
                        <option key={qual} value={qual}>
                          {qual} {qual === '720p' ? '(HD)' : qual === '1080p' ? '(Full HD)' : qual === '1440p' ? '(2K)' : qual === '2160p' ? '(4K)' : ''}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="360p">360p</option>
                        <option value="720p">720p (HD)</option>
                        <option value="1080p">1080p (Full HD)</option>
                      </>
                    )}
                  </select>
                </div>

                <div className="flex items-center space-x-2 pt-8">
                  <input
                    type="checkbox"
                    id={`audioOnly-${item.id}`}
                    checked={item.audioOnly}
                    onChange={(e) => updateBatchItem(item.id, 'audioOnly', e.target.checked)}
                    disabled={item.status === 'downloading'}
                    className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                  />
                  <label htmlFor={`audioOnly-${item.id}`} className="text-sm text-gray-700 dark:text-gray-300 flex items-center space-x-1">
                    <FileAudio className="w-4 h-4" />
                    <span>Audio only (MP3)</span>
                  </label>
                </div>
              </div>

              {item.status === 'downloading' && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Download Progress</span>
                    <span className="font-medium text-gray-900 dark:text-white">{Math.round(item.progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-2">
                    <div
                      className="h-2 rounded-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        <div className="flex space-x-3">
          <button
            onClick={addBatchItem}
            className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 flex items-center justify-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Video
          </button>
          <button
            onClick={handleBatchDownload}
            disabled={batchItems.every(item => !item.url || !isValidUrl(item.url)) || batchItems.some(item => item.status === 'downloading')}
            className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-400 text-white py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 disabled:scale-100"
          >
            Start Batch Download
          </button>
        </div>
      </div>
    </div>
  );
};