const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export interface VideoInfo {
  title: string;
  duration: string;
  views: string;
  author: string;
  thumbnail: string;
  likes: string;
  comments: string;
  description: string;
  upload_date?: string;
  tags?: string[];
  availableQualities?: string[];
}

export interface DownloadRequest {
  url: string;
  quality: string;
  audioOnly: boolean;
}

export interface DownloadResponse {
  downloadId: string;
  id: string;
  url: string;
  title: string;
  quality: string;
  audioOnly: boolean;
  status: 'pending' | 'downloading' | 'analyzing' | 'completed' | 'error';
  progress: number;
  timestamp: string;
  thumbnail?: string;
  duration?: string;
  fileSize?: string;
  analyticsData?: any;
  downloadUrl?: string;
  filePath?: string;
  errorMessage?: string; // Added errorMessage property
}

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

class ApiService {
  async getVideoInfo(url: string): Promise<VideoInfo> {
    const response = await fetch(`${API_BASE_URL}/video-info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get video info');
    }

    return response.json();
  }

  async downloadVideo(request: DownloadRequest): Promise<DownloadResponse> {
    const response = await fetch(`${API_BASE_URL}/download`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to start download');
    }

    return response.json();
  }

  async getDownloadStatus(downloadId: string): Promise<DownloadResponse> {
    const response = await fetch(`${API_BASE_URL}/download/${downloadId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get download status');
    }

    return response.json();
  }

  async getAllDownloads(): Promise<DownloadResponse[]> {
    const response = await fetch(`${API_BASE_URL}/downloads`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get downloads');
    }

    return response.json();
  }

  async exportAnalytics(downloadId: string, format: 'csv' | 'pdf'): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ downloadId, format }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to export analytics');
    }

    if (format === 'csv') {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics_${downloadId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  }

  async login(credentials: LoginRequest): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    return response.json();
  }

  async register(userData: RegisterRequest): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    return response.json();
  }

  async downloadFile(downloadId: string): Promise<void> {
    const downloadStatus = await this.getDownloadStatus(downloadId);
    if (downloadStatus.status !== 'completed' || !downloadStatus.downloadUrl) {
      throw new Error('File not ready for download');
    }

    const response = await fetch(`${API_BASE_URL}/download-file/${downloadId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to download file');
    }

    const blob = await response.blob();
    const contentDisposition = response.headers.get('Content-Disposition');
    const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
    const filename = filenameMatch ? filenameMatch[1] : `download_${downloadId}.${downloadStatus.audioOnly ? 'mp3' : 'mp4'}`;
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}

export const apiService = new ApiService();