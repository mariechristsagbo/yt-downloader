from flask import Flask, request, send_file, jsonify
import yt_dlp
import os
import json
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

progress_data = {}

def progress_hook(d):
    if d['status'] == 'downloading':
        progress_data['downloaded_bytes'] = d.get('downloaded_bytes', 0)
        progress_data['total_bytes'] = d.get('total_bytes', 0)
        progress_data['filename'] = d.get('filename', 'unknown')
        progress_data['speed'] = d.get('speed', 0)
        progress_data['eta'] = d.get('eta', 0)
        progress_data['progress'] = (progress_data['downloaded_bytes'] / progress_data['total_bytes']) * 100 if progress_data['total_bytes'] else 0

@app.route('/api/video-info', methods=['POST'])
def get_video_info():
    try:
        data = request.get_json()
        url = data.get('url')

        if not url:
            return jsonify({"success": False, "message": "No URL provided."}), 400

        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': 'in_playlist',  # Extract information without downloading if it's a playlist
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info_dict = ydl.extract_info(url, download=False)

            # Check if the URL is a playlist
            if 'entries' in info_dict:
                video_info = {
                    "title": info_dict.get("title"),
                    "uploader": info_dict.get("uploader"),
                    "videos": [
                        {
                            "title": entry.get("title"),
                            "url": entry.get("url"),
                            "thumbnail": entry.get("thumbnail"),
                            "duration": entry.get("duration")
                        }
                        for entry in info_dict['entries']
                    ]
                }
            else:
                video_info = {
                    "title": info_dict.get("title"),
                    "thumbnail": info_dict.get("thumbnail"),
                    "uploader": info_dict.get("uploader"),
                    "duration": info_dict.get("duration"),
                    "description": info_dict.get("description"),
                }

        return jsonify({"success": True, "video_info": video_info})

    except yt_dlp.utils.DownloadError as e:
        print(f"Erreur lors de la récupération des informations : {e}")
        return jsonify({"success": False, "message": "Erreur lors de la récupération des informations. Veuillez vérifier l'URL."}), 500
    except Exception as e:
        print(f"Erreur lors de la récupération des informations : {e}")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/download', methods=['POST'])
def download_video():
    try:
        data = request.get_json()
        url = data.get('url')
        quality = data.get('quality', 'highest')

        if not url:
            return jsonify({"success": False, "message": "No URL provided."}), 400

        output_path = "downloads"
        if not os.path.exists(output_path):
            os.makedirs(output_path)

        ydl_opts = {
            'format': 'bestvideo+bestaudio/best' if quality == 'highest' else f'bestvideo[height<={quality}]+bestaudio/best',
            'outtmpl': os.path.join(output_path, '%(title)s.%(ext)s'),  # Use video title as filename
            'merge_output_format': 'mp4',
            'socket_timeout': 60,  # Reduced timeout to start downloads faster
            'retries': 3,  # Retry up to 3 times in case of failure
            'progress_hooks': [progress_hook]  # Use the progress hook for tracking
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info_dict = ydl.extract_info(url, download=True)
            video_file_path = ydl.prepare_filename(info_dict)

        response = send_file(video_file_path, as_attachment=True, download_name=os.path.basename(video_file_path))

        # Nettoyage du fichier après envoi
        @response.call_on_close
        def cleanup():
            try:
                if os.path.exists(video_file_path):
                    os.remove(video_file_path)
            except Exception as e:
                print(f"Erreur lors de la suppression du fichier : {e}")

        return response

    except yt_dlp.utils.DownloadError as e:
        print(f"Erreur lors du téléchargement : {e}")
        return jsonify({"success": False, "message": "Erreur de téléchargement. Veuillez vérifier l'URL ou réessayer plus tard."}), 500
    except Exception as e:
        print(f"Erreur lors du téléchargement : {e}")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/download-progress', methods=['GET'])
def get_download_progress():
    return jsonify(progress_data)

if __name__ == '__main__':
    app.run(port=5000, debug=True)
