export interface VideoInfo {
  title: string;
  thumbnail: string;
  duration: string;
  views: string;
  likes: string;
  comments: string;
  author: string;
  availableQualities: string[];
}

export interface DownloadRequest {
  url: string;
  quality: string;
  audioOnly: boolean;
}

export interface DownloadStatus {
  id: string;
  url: string;
  quality: string;
  audioOnly: boolean;
  status: 'pending' | 'downloading' | 'analyzing' | 'completed' | 'error';
  progress: number;
  timestamp: string;
  title?: string;
  thumbnail?: string;
  duration?: string;
  fileSize?: string;
  downloadUrl?: string;
  errorMessage?: string;
}

export const apiService = {
  getVideoInfo: async (url: string): Promise<VideoInfo> => {
    try {
      const response = await fetch('http://localhost:3001/api/video-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      if (!response.ok) {
        const text = await response.text();
        console.error('getVideoInfo error response:', text);
        throw new Error(`Failed to fetch video info: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('getVideoInfo error:', err);
      throw err instanceof Error ? err : new Error('Failed to fetch video info');
    }
  },

  downloadVideo: async (request: DownloadRequest): Promise<{ downloadId: string }> => {
    try {
      const response = await fetch('http://localhost:3001/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      if (!response.ok) {
        const text = await response.text();
        console.error('downloadVideo error response:', text);
        throw new Error(`Failed to start download: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('downloadVideo error:', err);
      throw err instanceof Error ? err : new Error('Failed to start download');
    }
  },

  getDownloadStatus: async (downloadId: string): Promise<DownloadStatus> => {
    try {
      const response = await fetch(`http://localhost:3001/api/download-status/${downloadId}`);
      if (!response.ok) {
        const text = await response.text();
        console.error('getDownloadStatus error response:', text);
        throw new Error(`Failed to get download status: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('getDownloadStatus error:', err);
      throw err instanceof Error ? err : new Error('Failed to check download status');
    }
  },

  getAllDownloads: async (): Promise<DownloadStatus[]> => {
    try {
      const response = await fetch('http://localhost:3001/api/downloads');
      if (!response.ok) {
        const text = await response.text();
        console.error('getAllDownloads error response:', text);
        throw new Error(`Failed to get downloads: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('getAllDownloads error:', err);
      throw err instanceof Error ? err : new Error('Failed to get downloads');
    }
  },

  downloadFile: async (downloadId: string): Promise<void> => {
    try {
      const response = await fetch(`http://localhost:3001/api/download/${downloadId}/file`, {
        method: 'GET',
      });
      if (!response.ok) {
        const text = await response.text();
        console.error('downloadFile error response:', text);
        throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `download-${downloadId}.${blob.type.includes('audio') ? 'mp3' : 'mp4'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('downloadFile error:', err);
      throw err instanceof Error ? err : new Error('Failed to download file');
    }
  },

  exportAnalytics: async (downloadId: string, format: 'csv' | 'pdf'): Promise<void> => {
    try {
      const response = await fetch(`http://localhost:3001/api/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ downloadId, format }),
      });
      if (!response.ok) {
        const text = await response.text();
        console.error('exportAnalytics error response:', text);
        throw new Error(`Failed to export analytics: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      console.error('exportAnalytics error:', err);
      throw err instanceof Error ? err : new Error('Failed to export analytics');
    }
  },
};