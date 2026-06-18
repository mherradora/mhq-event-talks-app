document.addEventListener('DOMContentLoaded', () => {
  // -----------------------------------------------------------
  // STATE MANAGEMENT
  // -----------------------------------------------------------
  let rawUpdatesData = [];
  let currentFilter = 'all';
  let searchQuery = '';
  
  // -----------------------------------------------------------
  // DOM ELEMENT REFERENCES
  // -----------------------------------------------------------
  const feedContainer = document.getElementById('feedContainer');
  const skeletonLoader = document.getElementById('skeletonLoader');
  const errorContainer = document.getElementById('errorContainer');
  const emptyContainer = document.getElementById('emptyContainer');
  const errorMessageText = document.getElementById('errorMessageText');
  
  const refreshBtn = document.getElementById('refreshBtn');
  const refreshIcon = document.getElementById('refreshIcon');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const lastUpdatedTime = document.getElementById('lastUpdatedTime');
  const retryBtn = document.getElementById('retryBtn');
  const resetFiltersBtn = document.getElementById('resetFiltersBtn');
  
  // Search & Filter elements
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const filterPills = document.querySelectorAll('.filter-pill');
  
  // Stats elements
  const statTotal = document.getElementById('statTotal');
  const statFeatures = document.getElementById('statFeatures');
  const statAlerts = document.getElementById('statAlerts');
  
  // Scroll Progress
  const scrollProgress = document.getElementById('scrollProgress');
  
  // Dialog / Tweet elements
  const tweetDialog = document.getElementById('tweetDialog');
  const tweetTextarea = document.getElementById('tweetTextarea');
  const progressCircle = document.getElementById('progressCircle');
  const charCountLabel = document.getElementById('charCountLabel');
  const warningMsg = document.getElementById('warningMsg');
  const copyTweetBtn = document.getElementById('copyTweetBtn');
  const sendTweetBtn = document.getElementById('sendTweetBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');

  // -----------------------------------------------------------
  // THEME TOGGLE FUNCTIONALITY
  // -----------------------------------------------------------
  function initTheme() {
    const cachedTheme = localStorage.getItem("theme") || "system";
    setTheme(cachedTheme, false);
  }

  function setTheme(theme, save = true) {
    let isDark = false;
    if (theme === "dark") {
      isDark = true;
    } else if (theme === "system") {
      isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    }

    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    const colorSchemeMeta = document.querySelector('meta[name="color-scheme"]');
    if (colorSchemeMeta) {
      colorSchemeMeta.content = isDark ? "dark" : "light";
    }

    // Update Toggle Icon
    const themeIcon = document.getElementById('themeIcon');
    if (isDark) {
      themeIcon.className = "fa-solid fa-sun";
      themeToggleBtn.title = "Switch to Light Mode";
    } else {
      themeIcon.className = "fa-solid fa-moon";
      themeToggleBtn.title = "Switch to Dark Mode";
    }

    if (save) {
      localStorage.setItem("theme", theme);
    }
  }

  // React to OS Theme Changes if in system mode
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    const cachedTheme = localStorage.getItem("theme") || "system";
    if (cachedTheme === "system") {
      setTheme("system", false);
    }
  });

  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme, true);
  });

  // -----------------------------------------------------------
  // SCROLL PROGRESS BAR
  // -----------------------------------------------------------
  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const percentage = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    scrollProgress.style.width = `${percentage}%`;
  });

  // -----------------------------------------------------------
  // API CONSUMPTION & RENDER COORD
  // -----------------------------------------------------------
  async function fetchNotes(isRefresh = false) {
    showLoadingState();
    
    // Animate spinner
    if (isRefresh) {
      refreshIcon.classList.add('animating');
      refreshBtn.disabled = true;
    }

    try {
      const endpoint = isRefresh ? '/api/refresh' : '/api/notes';
      const method = isRefresh ? 'POST' : 'GET';
      
      const response = await fetch(endpoint, { method });
      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }
      
      const data = await response.json();
      rawUpdatesData = data.updates || [];
      
      // Update last updated timestamp
      if (data.updated) {
        const dateObj = new Date(data.updated);
        lastUpdatedTime.textContent = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + dateObj.toLocaleDateString();
      } else {
        lastUpdatedTime.textContent = new Date().toLocaleString();
      }

      updateDashboardStats();
      renderUpdates();
      
    } catch (err) {
      console.error("Failed to load BigQuery release notes:", err);
      showErrorState(err.message);
    } finally {
      // Clear spinner animation
      refreshIcon.classList.remove('animating');
      refreshBtn.disabled = false;
    }
  }

  // -----------------------------------------------------------
  // STATS & VIEW RENDERERS
  // -----------------------------------------------------------
  function updateDashboardStats() {
    statTotal.textContent = rawUpdatesData.length;
    
    const features = rawUpdatesData.filter(item => item.type === 'Feature').length;
    statFeatures.textContent = features;
    
    const alerts = rawUpdatesData.filter(item => item.type === 'Breaking' || item.type === 'Issue').length;
    statAlerts.textContent = alerts;
  }

  function showLoadingState() {
    skeletonLoader.style.display = 'block';
    feedContainer.style.display = 'none';
    errorContainer.style.display = 'none';
    emptyContainer.style.display = 'none';
  }

  function showErrorState(message) {
    skeletonLoader.style.display = 'none';
    feedContainer.style.display = 'none';
    errorContainer.style.display = 'flex';
    emptyContainer.style.display = 'none';
    errorMessageText.textContent = message || "We encountered an issue downloading the release notes feed. Please try again.";
  }

  function renderUpdates() {
    skeletonLoader.style.display = 'none';
    errorContainer.style.display = 'none';
    
    // Apply filters
    const filtered = rawUpdatesData.filter(item => {
      // 1. Type Filter
      const matchType = currentFilter === 'all' || item.type === currentFilter;
      
      // 2. Search Query Filter
      const query = searchQuery.trim().toLowerCase();
      const matchQuery = !query || 
                         item.text.toLowerCase().includes(query) ||
                         item.type.toLowerCase().includes(query) ||
                         item.date.toLowerCase().includes(query);
                         
      return matchType && matchQuery;
    });

    if (filtered.length === 0) {
      feedContainer.style.display = 'none';
      emptyContainer.style.display = 'flex';
      return;
    }

    emptyContainer.style.display = 'none';
    feedContainer.style.display = 'flex';
    feedContainer.innerHTML = '';

    // Group filtered updates by Date
    const grouped = {};
    filtered.forEach(update => {
      if (!grouped[update.date]) {
        grouped[update.date] = [];
      }
      grouped[update.date].push(update);
    });

    // Generate HTML
    Object.keys(grouped).forEach(date => {
      const dateGroup = document.createElement('div');
      dateGroup.className = 'date-group';

      const dateHeader = document.createElement('div');
      dateHeader.className = 'date-header';
      dateHeader.textContent = date;
      dateGroup.appendChild(dateHeader);

      grouped[date].forEach(item => {
        const card = document.createElement('article');
        card.className = `update-card ${item.type.toLowerCase()}-type`;
        card.setAttribute('data-id', item.id);
        
        // Icon classes based on update type
        let iconClass = 'fa-solid fa-info-circle';
        if (item.type === 'Feature') iconClass = 'fa-solid fa-star';
        else if (item.type === 'Breaking') iconClass = 'fa-solid fa-circle-radiation';
        else if (item.type === 'Announcement') iconClass = 'fa-solid fa-bullhorn';
        else if (item.type === 'Change') iconClass = 'fa-solid fa-sliders';
        else if (item.type === 'Issue') iconClass = 'fa-solid fa-triangle-exclamation';

        card.innerHTML = `
          <div class="card-header-row">
            <span class="type-badge">
              <i class="${iconClass}"></i> ${item.type}
            </span>
            <div class="card-actions">
              <button class="action-btn copy-action" title="Copy text preview to clipboard" aria-label="Copy preview">
                <i class="fa-regular fa-copy"></i>
              </button>
              <button class="action-btn tweet-action" title="Edit and Tweet about this update" aria-label="Tweet this update">
                <i class="fa-brands fa-x-twitter"></i>
              </button>
            </div>
          </div>
          <div class="card-body">
            ${item.html}
          </div>
        `;
        
        // Add copy action listener
        const copyBtn = card.querySelector('.copy-action');
        copyBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          copyTextToClipboard(`BigQuery ${item.type} (${item.date}): ${item.text} ${item.url}`, copyBtn);
        });

        // Add tweet action listener
        const tweetBtn = card.querySelector('.tweet-action');
        tweetBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          openTweetComposer(item);
        });

        dateGroup.appendChild(card);
      });

      feedContainer.appendChild(dateGroup);
    });
  }

  // Helper function to copy text
  function copyTextToClipboard(text, buttonElement) {
    navigator.clipboard.writeText(text).then(() => {
      const icon = buttonElement.querySelector('i');
      const originalClass = icon.className;
      icon.className = "fa-solid fa-check";
      buttonElement.style.backgroundColor = "rgba(16, 185, 129, 0.15)";
      
      setTimeout(() => {
        icon.className = originalClass;
        buttonElement.style.backgroundColor = "";
      }, 2000);
    }).catch(err => {
      alert("Failed to copy text: " + err);
    });
  }

  // -----------------------------------------------------------
  // FILTER PILLS & SEARCH HANDLERS
  // -----------------------------------------------------------
  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      
      currentFilter = pill.getAttribute('data-type');
      renderUpdates();
    });
  });

  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value;
    if (searchQuery.trim().length > 0) {
      clearSearchBtn.style.display = 'flex';
    } else {
      clearSearchBtn.style.display = 'none';
    }
    renderUpdates();
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearSearchBtn.style.display = 'none';
    searchInput.focus();
    renderUpdates();
  });

  resetFiltersBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearSearchBtn.style.display = 'none';
    currentFilter = 'all';
    
    filterPills.forEach(p => p.classList.remove('active'));
    document.querySelector('.filter-pill[data-type="all"]').classList.add('active');
    
    renderUpdates();
  });

  retryBtn.addEventListener('click', () => fetchNotes(true));
  refreshBtn.addEventListener('click', () => fetchNotes(true));

  // -----------------------------------------------------------
  // TWEET COMPOSER DIALOG LOGIC
  // -----------------------------------------------------------
  const TWEET_LIMIT = 280;
  // Progress circle configuration
  const CIRCLE_RADIUS = 11;
  const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;
  
  if (progressCircle) {
    progressCircle.style.strokeDasharray = CIRCLE_CIRCUMFERENCE;
  }

  function openTweetComposer(item) {
    // Structure of tweet
    // Maximize text while ensuring it fits 280.
    // Length budget = 280 - (Fixed prefixes & Hashtags & URL)
    
    const emojiMap = {
      'Feature': '🚀 BigQuery Feature',
      'Breaking': '⚠️ BigQuery Breaking Change',
      'Announcement': '📢 BigQuery Announcement',
      'Change': '🔄 BigQuery Change',
      'Issue': '🛠️ BigQuery Issue'
    };
    
    const emojiHeader = emojiMap[item.type] || '📢 BigQuery Update';
    const dateStr = item.date;
    const url = item.url;
    const hashtags = '#GoogleCloud #BigQuery';
    
    // Format template:
    // "[emojiHeader] ([dateStr]): [Shortened Text] [hashtags] [url]"
    // Let's compute fixed characters
    const templateFixedText = `${emojiHeader} (${dateStr}): \n\n ${hashtags}\n`;
    const fixedLen = templateFixedText.length + url.length + 3; // +3 for spacing
    
    let textBudget = TWEET_LIMIT - fixedLen;
    let textContent = item.text;
    
    if (textContent.length > textBudget) {
      textContent = textContent.substring(0, textBudget - 3) + '...';
    }
    
    const defaultTweet = `${emojiHeader} (${dateStr}):\n"${textContent}"\n\n${hashtags} ${url}`;
    
    tweetTextarea.value = defaultTweet;
    updateTweetProgress();
    
    // Open standard dialog modal
    tweetDialog.showModal();
  }

  function updateTweetProgress() {
    const textLen = tweetTextarea.value.length;
    const remaining = TWEET_LIMIT - textLen;
    
    charCountLabel.textContent = remaining;
    
    // Progress circle fill
    if (progressCircle) {
      const fillPercentage = Math.min(textLen / TWEET_LIMIT, 1);
      const dashOffset = CIRCLE_CIRCUMFERENCE - (fillPercentage * CIRCLE_CIRCUMFERENCE);
      progressCircle.style.strokeDashoffset = dashOffset;
      
      // Update color coding based on characters remaining
      if (remaining < 0) {
        progressCircle.style.stroke = '#f4212e'; // Red
        charCountLabel.style.color = '#f4212e';
        warningMsg.style.display = 'block';
        sendTweetBtn.disabled = true;
      } else if (remaining <= 20) {
        progressCircle.style.stroke = '#ffd400'; // Yellow
        charCountLabel.style.color = '#ffd400';
        warningMsg.style.display = 'none';
        sendTweetBtn.disabled = false;
      } else {
        progressCircle.style.stroke = '#1d9bf0'; // Twitter Blue
        charCountLabel.style.color = 'var(--text-secondary)';
        warningMsg.style.display = 'none';
        sendTweetBtn.disabled = false;
      }
    }
  }

  tweetTextarea.addEventListener('input', updateTweetProgress);

  copyTweetBtn.addEventListener('click', () => {
    copyTextToClipboard(tweetTextarea.value, copyTweetBtn);
  });

  sendTweetBtn.addEventListener('click', () => {
    const tweetText = tweetTextarea.value;
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(tweetUrl, '_blank', 'noopener,noreferrer');
  });

  // Native Dialog Close listener
  closeModalBtn.addEventListener('click', () => {
    tweetDialog.close();
  });

  // Fallback for click outside standard dialog backdrop (Light Dismiss)
  if (!('closedBy' in HTMLDialogElement.prototype)) {
    tweetDialog.addEventListener('click', (event) => {
      if (event.target !== tweetDialog) return;
      
      const rect = tweetDialog.getBoundingClientRect();
      const isDialogContent = (
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width
      );
      
      if (!isDialogContent) {
        tweetDialog.close();
      }
    });
  }

  // -----------------------------------------------------------
  // BOOTSTRAP INITIALIZATION
  // -----------------------------------------------------------
  initTheme();
  fetchNotes();
});
