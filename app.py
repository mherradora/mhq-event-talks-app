import os
import re
import html
import json
import logging
import xml.etree.ElementTree as ET
import requests
from flask import Flask, render_template, jsonify, request

app = Flask(__name__)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

CACHE_FILE = 'feed_cache.json'
FEED_URL = 'https://docs.cloud.google.com/feeds/bigquery-release-notes.xml'

# Namespaces for Atom feed
NAMESPACES = {'atom': 'http://www.w3.org/2005/Atom'}

def parse_feed_content(xml_content):
    """Parses Atom feed XML and returns structured updates."""
    try:
        root = ET.fromstring(xml_content)
    except ET.ParseError as e:
        logger.error(f"XML parse error: {e}")
        raise ValueError("Invalid XML feed content")

    updates = []
    update_idx = 0

    feed_title = root.find('atom:title', NAMESPACES)
    feed_title_text = feed_title.text.strip() if feed_title is not None else 'BigQuery Release Notes'
    
    feed_updated = root.find('atom:updated', NAMESPACES)
    feed_updated_text = feed_updated.text.strip() if feed_updated is not None else ''

    for entry in root.findall('atom:entry', NAMESPACES):
        date_el = entry.find('atom:title', NAMESPACES)
        date_str = date_el.text.strip() if date_el is not None else 'Unknown Date'
        
        id_el = entry.find('atom:id', NAMESPACES)
        entry_id = id_el.text.strip() if id_el is not None else f"id_{update_idx}"
        
        updated_el = entry.find('atom:updated', NAMESPACES)
        updated_str = updated_el.text.strip() if updated_el is not None else ''
        
        link_el = entry.find('atom:link', NAMESPACES)
        link_url = link_el.attrib.get('href', '') if link_el is not None else ''

        content_el = entry.find('atom:content', NAMESPACES)
        if content_el is None or content_el.text is None:
            continue

        content_html = content_el.text.strip()

        # Split content by <h3> headers
        pattern = re.compile(r'<h3>(.*?)</h3>(.*?)(?=<h3>|$)', re.DOTALL)
        matches = pattern.findall(content_html)

        for heading, body in matches:
            heading_text = heading.strip()
            body_text = body.strip()

            # Create text preview for Tweet
            plain_text_body = re.sub(r'<[^>]+>', '', body_text)
            plain_text_body = ' '.join(plain_text_body.split())
            plain_text_body = html.unescape(plain_text_body)

            update_idx += 1
            updates.append({
                'id': f"{entry_id}_{update_idx}",
                'date': date_str,
                'iso_date': updated_str,
                'type': heading_text,
                'html': body_text,
                'text': plain_text_body,
                'url': link_url
            })

    return {
        'title': feed_title_text,
        'updated': feed_updated_text,
        'updates': updates
    }

def get_cached_notes():
    """Loads notes from the JSON cache file if it exists, otherwise returns None."""
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error reading cache file: {e}")
    return None

def save_cache(data):
    """Saves feed data to the local JSON cache file."""
    try:
        with open(CACHE_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        logger.error(f"Error writing to cache file: {e}")

def fetch_feed_data():
    """Fetches the Atom feed and updates the cache."""
    logger.info("Fetching fresh release notes from Google Cloud feed...")
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    response = requests.get(FEED_URL, headers=headers, timeout=12)
    response.raise_for_status()
    data = parse_feed_content(response.content)
    save_cache(data)
    return data

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/notes')
def get_notes():
    # Try cache first
    data = get_cached_notes()
    if not data:
        try:
            data = fetch_feed_data()
        except Exception as e:
            logger.error(f"Failed to fetch initial feed: {e}")
            return jsonify({'error': 'Failed to fetch release notes', 'details': str(e)}), 500
    return jsonify(data)

@app.route('/api/refresh', methods=['POST'])
def refresh_notes():
    try:
        data = fetch_feed_data()
        return jsonify(data)
    except Exception as e:
        logger.error(f"Failed to refresh feed: {e}")
        return jsonify({'error': 'Failed to refresh release notes', 'details': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
