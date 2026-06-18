# BigQuery Release Notes Web Explorer

A premium, modern web application that fetches, parses, searches, and shares release notes from the official Google Cloud BigQuery RSS/Atom feed.

## Technology Stack

- **Backend**: Python Flask
- **Frontend**: Plain Vanilla HTML5, Vanilla CSS3 (with dynamic dark/light themes), and Vanilla JavaScript
- **API integrations**: Standard BigQuery RSS/Atom release notes feed, X (formerly Twitter) Web Sharing Intents

## Key Features

1. **Structured Feed Parsing**: Converts Google's raw XML entries containing concatenated HTML tags into individual, granular update cards (Features, Announcements, Issues, Breaking changes, and general changes).
2. **Interactive UI / Dashboard**:
   - **Scroll Progress Indicator**: Gradient bar tracking page scroll level at the top of the viewport.
   - **Quick Stats Overview**: A dashboard showing total updates, total features, and total alerts (Breaking changes/issues) loaded in real-time.
   - **Keyword Search Filtering**: Client-side instant regex matching for titles, update types, and text contents.
   - **Category Filter Pills**: Fast category-based filters (Features, Announcements, etc.) with custom theme dots.
3. **Twitter (X) Share Compose Integration**:
   - Selecting any specific update opens a custom-styled mockup X compose dialog.
   - Native `<dialog>` element with `@starting-style` entry and exit animation effects.
   - An intelligent draft generator that shortens descriptions automatically to fit X's **280-character limit**.
   - An interactive SVG character-counter circular progress indicator (changing colors from blue to yellow to red as the budget is consumed).
   - Instant "Copy to Clipboard" and "Post on X" buttons.
4. **Theme Switcher**: Built-in support for Dark and Light themes matching system/OS preferences by default, with dynamic toggle controls persisting choices to `localStorage` (Flicker-free/FOUC-prevented implementation).
5. **Caching Layer**: Automatically caches XML feed content in a local `feed_cache.json` file to guarantee fast loading speeds and prevent hitting Google feed rate limits.
6. **Refresh Mechanism**: Refresh button with spinning state fetching new data in the background and updating UI with dynamic skeleton loaders.

## Directory Structure

```
cli_project1/
├── app.py                   # Main Flask server application
├── test_app.py              # Backend unit tests
├── feed_cache.json          # Persistent JSON cache for XML data
├── templates/
│   └── index.html           # Main UI template with Twitter modal
└── static/
    ├── css/
    │   └── style.css        # Premium stylesheets (responsive, custom scrollbars, animations)
    └── js/
        └── main.js          # DOM manipulation, theme logic, search, and composer math
```

## Setup & Running Locally

1. Ensure Python 3.12+ is installed on your machine.
2. In the root directory, create a virtual environment and install packages (if not already done):
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install flask requests
   ```
3. Run the Flask application:
   ```bash
   python app.py
   ```
4. Open your browser and navigate to:
   [http://localhost:5000](http://localhost:5000)

## Running Unit Tests

Run the following command to execute the test suite:
```bash
./venv/bin/python test_app.py
```
