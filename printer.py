def save_files_data(file_paths, output_file):
    with open(output_file, 'w', encoding='utf-8') as out_file:
        for path in file_paths:
            out_file.write(f"\n\n=== File: {path} ===\n")
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    out_file.write(content)
            except Exception as e:
                out_file.write(f"[Error reading file]: {e}")

if __name__ == "__main__":
    files = [
r"C:\Users\Dell\Downloads\yt-downloader-sucess\project\src\components",
r"C:\Users\Dell\Downloads\yt-downloader-sucess\project\server",
r"C:\Users\Dell\Downloads\yt-downloader-sucess\project\server\downloads",
r"C:\Users\Dell\Downloads\yt-downloader-sucess\project\server\cookies.txt",
r"C:\Users\Dell\Downloads\yt-downloader-sucess\project\server\index.cjs",
r"C:\Users\Dell\Downloads\yt-downloader-sucess\project\src",
r"C:\Users\Dell\Downloads\yt-downloader-sucess\project\src\components\AnalyticsDashboard.tsx",
r"C:\Users\Dell\Downloads\yt-downloader-sucess\project\src\components\AuthModal.tsx",
r"C:\Users\Dell\Downloads\yt-downloader-sucess\project\src\components\BatchDownloader.tsx",
r"C:\Users\Dell\Downloads\yt-downloader-sucess\project\src\components\DownloadHistory.tsx",
r"C:\Users\Dell\Downloads\yt-downloader-sucess\project\src\components\DownloadProgress.tsx",
r"C:\Users\Dell\Downloads\yt-downloader-sucess\project\src\components\ExportModal.tsx",
r"C:\Users\Dell\Downloads\yt-downloader-sucess\project\src\components\Header.tsx",
r"C:\Users\Dell\Downloads\yt-downloader-sucess\project\src\components\Settings.tsx",
r"C:\Users\Dell\Downloads\yt-downloader-sucess\project\src\components\UserDashboard.tsx",
r"C:\Users\Dell\Downloads\yt-downloader-sucess\project\src\components\VideoDownloader.tsx",
r"C:\Users\Dell\Downloads\yt-downloader-sucess\project\src\services",
r"C:\Users\Dell\Downloads\yt-downloader-sucess\project\src\App.tsx",
r"C:\Users\Dell\Downloads\yt-downloader-sucess\project\src\index.css",
r"C:\Users\Dell\Downloads\yt-downloader-sucess\project\src\main.tsx",
r"C:\Users\Dell\Downloads\yt-downloader-sucess\project\src\vite-env.d.ts",
r"C:\Users\Dell\Downloads\yt-downloader-sucess\project\.env",
r"C:\Users\Dell\Downloads\yt-downloader-sucess\project\apiService.ts",
r"C:\Users\Dell\Downloads\yt-downloader-sucess\project\eslint.config.js",
r"C:\Users\Dell\Downloads\yt-downloader-sucess\project\index.html",
r"C:\Users\Dell\Downloads\yt-downloader-sucess\project\package.json",
r"C:\Users\Dell\Downloads\yt-downloader-sucess\project\postcss.config.js",
r"C:\Users\Dell\Downloads\yt-downloader-sucess\project\README.md",
r"C:\Users\Dell\Downloads\yt-downloader-sucess\project\tailwind.config.js",
r"C:\Users\Dell\Downloads\yt-downloader-sucess\project\test.mp4.webm",
r"C:\Users\Dell\Downloads\yt-downloader-sucess\project\tsconfig.app.json",
r"C:\Users\Dell\Downloads\yt-downloader-sucess\project\tsconfig.json",
r"C:\Users\Dell\Downloads\yt-downloader-sucess\project\tsconfig.node.json",
r"C:\Users\Dell\Downloads\yt-downloader-sucess\project\vite.config.ts",
    ]
    
    output = r"C:\Users\Dell\Downloads\yt-downloader-sucess\project\output.txt"

    save_files_data(files, output)
    print(f"Data saved to {output}")