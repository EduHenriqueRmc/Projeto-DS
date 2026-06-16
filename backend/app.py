from dotenv import load_dotenv
load_dotenv()

from flask import Flask, send_from_directory
from flask_cors import CORS
from routes.chat import chat_bp
from routes.flashcards import flashcards_bp
from routes.dashboard import dashboard_bp
from routes.environments import envs_bp
from routes.planner import planner_bp
from routes.auth import auth_bp
from routes.files import files_bp
from routes.annotations import annotations_bp
from routes.ai_materials import ai_materials_bp
import os

app = Flask(__name__, static_folder='../frontend')
CORS(app)

# Registra os blueprints
app.register_blueprint(chat_bp, url_prefix='/api')
app.register_blueprint(flashcards_bp, url_prefix='/api')
app.register_blueprint(dashboard_bp, url_prefix='/api')
app.register_blueprint(envs_bp, url_prefix='/api')
app.register_blueprint(planner_bp, url_prefix='/api')
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(files_bp, url_prefix='/api')
app.register_blueprint(annotations_bp, url_prefix='/api')
app.register_blueprint(ai_materials_bp, url_prefix='/api')

@app.route('/')
def index():
    return send_from_directory('../frontend', 'login.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('../frontend', path)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
