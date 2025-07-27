const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use('/downloads', express.static(path.join(__dirname, 'downloads')));

const downloadsDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

app.use('/download-file', express.static(downloadsDir));

const downloads = new Map();

function extractVideoId(url) {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

function getVideoInfo(url) {
  return new Promise((resolve, reject) => {
    const args = [
      '--dump-json',
      '--no-download',
      '--no-playlist',
      '--no-warnings',
      url
    ];

    const ytdlp = spawn('yt-dlp', args);

    let data = '';
    let error = '';

    ytdlp.stdout.on('data', (chunk) => {
      data += chunk.toString();
    });

    ytdlp.stderr.on('data', (chunk) => {
      error += chunk.toString();
    });

    ytdlp.on('close', (code) => {
      if (code === 0) {
        try {
          const info = JSON.parse(data);
          const formats = info.formats || [];
          const availableQualities = [];
          
          formats.forEach(format => {
            if (format.height && format.vcodec !== 'none') {
              const quality = `${format.height}p`;
              if (!availableQualities.includes(quality)) {
                availableQualities.push(quality);
              }
            }
          });
          
          availableQualities.sort((a, b) => {
            const aNum = parseInt(a.replace('p', ''));
            const bNum = parseInt(b.replace('p', ''));
            return aNum - bNum;
          });
          
          resolve({
            title: info.title || 'Unknown Title',
            duration: formatDuration(info.duration || 0),
            views: formatNumber(info.view_count || 0),
            author: info.uploader || info.channel || 'Unknown Author',
            thumbnail: info.thumbnail || '',
            likes: formatNumber(info.like_count || 0),
            comments: formatNumber(info.comment_count || 0),
            description: info.description || '',
            upload_date: info.upload_date || '',
            tags: info.tags || [],
            availableQualities: availableQualities.length > 0 ? availableQualities : ['360p', '720p', '1080p']
          });
        } catch (e) {
          console.error('Error parsing video info:', e);
          reject(new Error('Failed to parse video info'));
        }
      } else {
        console.error('yt-dlp error:', error);
        if (error.includes('HTTP Error 403')) {
          reject(new Error('Access denied: Video may be private or restricted'));
        } else if (error.includes('fragment not found')) {
          reject(new Error('Video fragments unavailable: The video may be private or removed'));
        } else {
          reject(new Error(error || 'Failed to get video info'));
        }
      }
    });
  });
}

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

app.post('/api/video-info', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const videoInfo = await getVideoInfo(url);
    res.json(videoInfo);
  } catch (error) {
    console.error('Error getting video info:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/download', async (req, res) => {
  try {
    const { url, quality, audioOnly } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const downloadId = uuidv4();
    const videoInfo = await getVideoInfo(url);
    
    downloads.set(downloadId, {
      id: downloadId,
      url,
      title: videoInfo.title,
      quality,
      audioOnly,
      status: 'pending',
      progress: 0,
      timestamp: new Date(),
      thumbnail: videoInfo.thumbnail,
      duration: videoInfo.duration,
      fileSize: null,
      filePath: null,
      analyticsData: null,
      errorMessage: null
    });

    downloadVideo(downloadId, url, quality, audioOnly, videoInfo);
    
    res.json({ downloadId, ...downloads.get(downloadId) });
  } catch (error) {
    console.error('Error starting download:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/download/:id', (req, res) => {
  const { id } = req.params;
  const download = downloads.get(id);
  
  if (!download) {
    return res.status(404).json({ error: 'Download not found' });
  }
  
  res.json(download);
});

app.get('/api/downloads', (req, res) => {
  const allDownloads = Array.from(downloads.values()).sort((a, b) => 
    new Date(b.timestamp) - new Date(a.timestamp)
  );
  res.json(allDownloads);
});

async function downloadVideo(downloadId, url, quality, audioOnly, videoInfo) {
  const download = downloads.get(downloadId);
  
  try {
    download.status = 'downloading';
    downloads.set(downloadId, download);

    const filename = `${downloadId}_${videoInfo.title.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const extension = audioOnly ? 'mp3' : 'mp4';
    const outputFilename = `${filename}.${extension}`;
    const outputPath = path.join(downloadsDir, outputFilename);

    const args = [
      '--progress',
      '--newline',
      '--no-playlist',
      url,
      '-o', outputPath
    ];

    if (audioOnly) {
      args.push('--extract-audio', '--audio-format', 'mp3', '--audio-quality', '0'); // Best audio quality
    } else {
      const formatMap = {
        '360p': 'bestvideo[height=360][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        '720p': 'bestvideo[height=720][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        '1080p': 'bestvideo[height=1080][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best'
      };
      args.push('-f', formatMap[quality] || 'bestvideo[height=720][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best');
    }

    const ytdlp = spawn('yt-dlp', args);

    ytdlp.stdout.on('data', (data) => {
      const output = data.toString();
      const progressMatch = output.match(/(\d+\.?\d*)%/);
      if (progressMatch) {
        const progress = parseFloat(progressMatch[1]);
        download.progress = Math.min(progress, 80);
        downloads.set(downloadId, download);
      }
    });

    ytdlp.stderr.on('data', (data) => {
      console.error('yt-dlp stderr:', data.toString());
    });

    ytdlp.on('close', async (code) => {
      if (code === 0) {
        download.status = 'analyzing';
        download.progress = 85;
        downloads.set(downloadId, download);

        try {
          const stats = fs.statSync(outputPath);
          download.fileSize = formatFileSize(stats.size);
          download.filePath = outputPath;
          download.downloadUrl = `/download-file/${outputFilename}`;
        } catch (e) {
          console.error('Error getting file stats:', e);
          download.status = 'error';
          download.errorMessage = 'Failed to access downloaded file';
          downloads.set(downloadId, download);
          return;
        }

        await simulateAnalysis(downloadId);
        
        download.status = 'completed';
        download.progress = 100;
        downloads.set(downloadId, download);
      } else {
        console.error('yt-dlp exited with code:', code);
        download.status = 'error';
        if (ytdlp.stderr.toString().includes('HTTP Error 403')) {
          download.errorMessage = 'Access denied: Video may be private or restricted';
        } else if (ytdlp.stderr.toString().includes('fragment not found')) {
          download.errorMessage = 'Video fragments unavailable: The video may be private or removed';
        } else {
          download.errorMessage = 'Failed to download video';
        }
        downloads.set(downloadId, download);
      }
    });

    ytdlp.on('error', (error) => {
      console.error('Download error:', error);
      download.status = 'error';
      download.errorMessage = 'Failed to download video: ' + error.message;
      downloads.set(downloadId, download);
    });

  } catch (error) {
    console.error('Error in downloadVideo:', error);
    download.status = 'error';
    download.errorMessage = error.message;
    downloads.set(downloadId, download);
  }
}

async function simulateAnalysis(downloadId) {
  const download = downloads.get(downloadId);
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const analyticsData = {
    sentiment: {
      positive: Math.floor(Math.random() * 40) + 50,
      negative: Math.floor(Math.random() * 20) + 5,
      neutral: Math.floor(Math.random() * 30) + 20
    },
    keywords: [
      'technology', 'tutorial', 'programming', 'web development', 
      'javascript', 'react', 'coding', 'software'
    ].slice(0, Math.floor(Math.random() * 4) + 3),
    transcript: 'This is a sample transcript of the video content.',
    engagement: {
      likes: formatNumber(Math.floor(Math.random() * 100000)),
      views: formatNumber(Math.floor(Math.random() * 1000000)),
      comments: formatNumber(Math.floor(Math.random() * 10000)),
      shares: formatNumber(Math.floor(Math.random() * 1000))
    },
    topics: ['Technology', 'Education', 'Programming', 'Web Development', 'Tutorial']
  };
  
  download.analyticsData = analyticsData;
  download.progress = 95;
  downloads.set(downloadId, download);
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

app.post('/api/export', async (req, res) => {
  try {
    const { format, downloadId } = req.body;
    const download = downloads.get(downloadId);
    
    if (!download || !download.analyticsData) {
      return res.status(404).json({ error: 'Download or analytics data not found' });
    }
    
    if (format === 'csv') {
      const csv = generateCSV(download);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${download.title}_analytics.csv"`);
      res.send(csv);
    } else if (format === 'pdf') {
      res.json({ message: 'PDF export would be implemented with a PDF library like puppeteer or jsPDF' });
    }
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: error.message });
  }
});

function generateCSV(download) {
  const { analyticsData } = download;
  let csv = 'Metric,Value\n';
  csv += `Title,"${download.title}"\n`;
  csv += `Duration,${download.duration}\n`;
  csv += `Quality,${download.quality}\n`;
  csv += `Positive Sentiment,${analyticsData.sentiment.positive}%\n`;
  csv += `Negative Sentiment,${analyticsData.sentiment.negative}%\n`;
  csv += `Neutral Sentiment,${analyticsData.sentiment.neutral}%\n`;
  csv += `Keywords,"${analyticsData.keywords.join(', ')}"\n`;
  csv += `Topics,"${analyticsData.topics.join(', ')}"\n`;
  csv += `Likes,${analyticsData.engagement.likes}\n`;
  csv += `Views,${analyticsData.engagement.views}\n`;
  csv += `Comments,${analyticsData.engagement.comments}\n`;
  csv += `Shares,${analyticsData.engagement.shares}\n`;
  return csv;
}

app.get('/api/download-file/:downloadId', (req, res) => {
  const { downloadId } = req.params;
  const download = downloads.get(downloadId);
  
  if (!download || !download.filePath) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  if (!fs.existsSync(download.filePath)) {
    return res.status(404).json({ error: 'File not found on disk' });
  }
  
  const filename = path.basename(download.filePath);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', download.audioOnly ? 'audio/mpeg' : 'video/mp4');
  res.setHeader('Content-Length', fs.statSync(download.filePath).size);
  res.sendFile(download.filePath, (err) => {
    if (err) {
      console.error('Error sending file:', err);
      res.status(500).json({ error: 'Failed to send file' });
    }
  });
});

const users = new Map();

app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body;
  
  if (users.has(email)) {
    return res.status(400).json({ error: 'User already exists' });
  }
  
  const user = {
    id: uuidv4(),
    name,
    email,
    password,
    createdAt: new Date()
  };
  
  users.set(email, user);
  
  const { password: _, ...userResponse } = user;
  res.json(userResponse);
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  
  const user = users.get(email);
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const { password: _, ...userResponse } = user;
  res.json(userResponse);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Make sure you have yt-dlp installed: pip install yt-dlp`);
});