import React, { useState, useEffect } from 'react';
import { Download, Clock, Eye, Heart, MessageCircle, FileAudio } from 'lucide-react';
import { apiService, VideoInfo } from '../services/api';

interface VideoDownloaderProps {
  onDownload: (url: string, quality: string, audioOnly: boolean) => void;
  downloadError: string | null;
  clearDownloadError: () => void;
  onDownloadComplete: () => void;
}

export const VideoDownloader: React.FC<VideoDownloaderProps> = ({ onDownload, downloadError, clearDownloadError, onDownloadComplete }) => {
  const [url, setUrl] = useState('');
  const [quality, setQuality] = useState('720p');
  const [audioOnly, setAudioOnly] = useState(false);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadId, setDownloadId] = useState<string | null>(null);

  const isValidUrl = (url: string) => {
    return (
      url.includes('youtube.com') ||
      url.includes('youtu.be')
    );
  };

  useEffect(() => {
    if (!url || !isValidUrl(url)) {
      setVideoInfo(null);
      setAnalyzeError(null);
      return;
    }

    const analyze = async () => {
      setAnalyzeError(null);
      clearDownloadError();
      setIsAnalyzing(true);
      setVideoInfo(null);

      try {
        const info = await apiService.getVideoInfo(url);
        setVideoInfo(info);
        if (info.availableQualities && info.availableQualities.length > 0) {
          setQuality(info.availableQualities[info.availableQualities.length - 1]);
        }
      } catch (err) {
        setAnalyzeError(err instanceof Error ? err.message : 'Failed to analyze video');
      } finally {
        setIsAnalyzing(false);
      }
    };

    const timeout = setTimeout(analyze, 500);
    return () => clearTimeout(timeout);
  }, [url, clearDownloadError]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (downloadId && isDownloading) {
      interval = setInterval(async () => {
        try {
          const status = await apiService.getDownloadStatus(downloadId);
          setDownloadProgress(status.progress);
          if (status.status === 'completed') {
            setIsDownloading(false);
            setDownloadId(null);
            onDownloadComplete();
          } else if (status.status === 'error') {
            setIsDownloading(false);
            setDownloadId(null);
            setAnalyzeError(status.errorMessage ?? 'Download failed');
          }
        } catch (err) {
          setIsDownloading(false);
          setDownloadId(null);
          setAnalyzeError(err instanceof Error ? err.message : 'Failed to check download status');
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [downloadId, isDownloading, onDownloadComplete]);

  const handleDownload = async () => {
    if (url && isValidUrl(url)) {
      setAnalyzeError(null);
      clearDownloadError();
      setIsDownloading(true);
      setDownloadProgress(0);
      try {
        const downloadResponse = await apiService.downloadVideo({ url, quality, audioOnly });
        setDownloadId(downloadResponse.downloadId);
        await onDownload(url, quality, audioOnly);
      } catch (err) {
        setIsDownloading(false);
        setDownloadId(null);
        setAnalyzeError(err instanceof Error ? err.message : 'Failed to start download');
      }
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-orange-200 dark:border-orange-700">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
          <Download className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Media Downloader</h2>
          <p className="text-gray-600 dark:text-gray-400">Videos and mp3</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Video URL
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste video URL here..."
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            disabled={isDownloading}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quality
            </label>
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
              disabled={isAnalyzing || isDownloading}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              {videoInfo?.availableQualities ? (
                videoInfo.availableQualities.map(qual => (
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
              id="audioOnly"
              checked={audioOnly}
              onChange={(e) => setAudioOnly(e.target.checked)}
              disabled={isDownloading}
              className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
            />
            <label htmlFor="audioOnly" className="text-sm text-gray-700 dark:text-gray-300 flex items-center space-x-1">
              <FileAudio className="w-4 h-4" />
              <span>Audio only (MP3)</span>
            </label>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleDownload}
            disabled={!url || isAnalyzing || isDownloading || !isValidUrl(url)}
            className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-400 text-white py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 disabled:scale-100"
          >
            {isDownloading ? 'Downloading...' : 'Download'}
          </button>
        </div>
      </div>

      {(analyzeError || downloadError) && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-700 dark:text-red-300 text-sm">{analyzeError || downloadError}</p>
        </div>
      )}

      {isAnalyzing && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">Analyzing video...</p>
        </div>
      )}

      {isDownloading && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Download Progress</span>
            <span className="font-medium text-gray-900 dark:text-white">{Math.round(downloadProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-2">
            <div
              className="h-2 rounded-full bg-blue-500 transition-all duration-300"
              style={{ width: `${downloadProgress}%` }}
            />
          </div>
        </div>
      )}

      {videoInfo && !isAnalyzing && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex space-x-4">
            <img
              src={videoInfo.thumbnail}
              alt={videoInfo.title}
              className="w-24 h-16 object-cover rounded"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=800';
              }}
            />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{videoInfo.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{videoInfo.author}</p>
              <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{videoInfo.duration}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Eye className="w-3 h-3" />
                  <span>{videoInfo.views}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Heart className="w-3 h-3" />
                  <span>{videoInfo.likes}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageCircle className="w-3 h-3" />
                  <span>{videoInfo.comments}</span>
                </div>
              </div>
              {videoInfo.availableQualities && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Available qualities: {videoInfo.availableQualities.join(', ')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};