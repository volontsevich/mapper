from flask import Flask, jsonify, request, send_from_directory
from flask_compress import Compress
import requests
import os
import json

app = Flask(__name__, static_folder='../assets', static_url_path='/assets')
Compress(app)

API_KEY = os.getenv('GOOGLE_PLACES_API_KEY', 'AIzaSyC48nGG95v_4Fc1e9f6Q0yyGpXLEkoRXtI')
PORT = int(os.environ.get('PORT', 8080))

def build_places_url(location, radius, type, keyword, pagetoken=None):
    base_url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json'
    params = {
        'key': API_KEY,
        'location': location,
        'radius': radius,
        'type': type,
        'keyword': keyword
    }
    if pagetoken:
        params['pagetoken'] = pagetoken

    return requests.Request('GET', base_url, params=params).prepare().url

def build_place_details_url(place_id):
    base_url = 'https://maps.googleapis.com/maps/api/place/details/json'
    params = {
        'key': API_KEY,
        'place_id': place_id
    }
    return requests.Request('GET', base_url, params=params).prepare().url

@app.route('/api/places')
def get_places():
    location = request.args.get('location')
    radius = request.args.get('radius')
    type = request.args.get('type')
    keyword = request.args.get('keyword')
    pagetoken = request.args.get('pagetoken')

    url = build_places_url(location, radius, type, keyword, pagetoken)
    response = requests.get(url)

    if response.status_code != 200:
        return jsonify({'error': 'Failed to fetch places'}), response.status_code

    return jsonify(response.json())

@app.route('/api/placeDetails')
def get_place_details():
    place_id = request.args.get('place_id')
    url = build_place_details_url(place_id)
    response = requests.get(url)

    if response.status_code != 200:
        return jsonify({'error': 'Failed to fetch place details'}), response.status_code

    return jsonify(response.json())

@app.route('/api/placeTypes')
def get_place_types():
    query = request.args.get('q', '').lower().replace(' ', '_')
    with open('placeTypes.json') as f:
        place_types = json.load(f)['placeTypes']
    filtered_types = [pt for pt in place_types if query in pt.lower()]
    return jsonify({'placeTypes': filtered_types})

@app.route('/assets/manifest.json')
def manifest():
    return send_from_directory(app.static_folder, 'manifest.json')

@app.route('/assets/service-worker.js')
def service_worker():
    return send_from_directory(app.static_folder, 'service-worker.js')

@app.route('/')
def serve_index():
    return send_from_directory('..', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('..', path)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=PORT, debug=True)
