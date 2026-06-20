document.addEventListener('DOMContentLoaded', () => {
  // -----------------------------------------------------------
  // STATE MANAGEMENT
  // -----------------------------------------------------------
  let rawUpdatesData = [];
  let currentFilter = 'all';
  let searchQuery = '';
  let activeComposeItem = null;
  
  // -----------------------------------------------------------
  // TRANSLATION DICTIONARY
  // -----------------------------------------------------------
  const TRANSLATIONS = {
    en: {
      appTitle: "BigQuery Release Notes",
      appSubtitle: "Real-time insights & announcement tracking",
      updatedLabel: "Updated:",
      updatedLoading: "Loading...",
      btnRefresh: "Refresh",
      btnExportCsv: "Export CSV",
      refreshTooltip: "Refresh Release Notes",
      exportCsvTooltip: "Export to CSV",
      langTooltip: "Switch to Spanish",
      statTotalLabel: "Total Updates",
      statFeaturesLabel: "Features",
      statBreakingLabel: "Breaking / Issues",
      searchPlaceholder: "Search release notes by keywords (e.g. Gemini, SQL, columns)...",
      filterAll: "All Updates",
      filterFeatures: "Features",
      filterAnnouncements: "Announcements",
      filterBreaking: "Breaking",
      filterChanges: "Changes",
      filterIssues: "Issues",
      errorTitle: "Failed to fetch updates",
      errorDesc: "We encountered an issue downloading the release notes feed. Please try again.",
      btnTryAgain: "Try Again",
      emptyTitle: "No matching updates found",
      emptyDesc: "Try refining your search terms or choosing a different filter category.",
      btnResetFilters: "Reset Filters",
      dialogTitle: "Compose Tweet",
      dialogTextareaPlaceholder: "What's happening in BigQuery?",
      dialogNotice: "Draft is editable. Links and hashtags will be formatted.",
      dialogExceedsLimit: "Exceeds X (280) character limit!",
      btnResetDraft: "Reset to default draft",
      btnCopyText: "Copy Text",
      btnPostX: "Post on X",
      scrollToTopTooltip: "Scroll to top",
      footerTitle: "Google Cloud BigQuery Release Notes Web Explorer",
      footerDisclaimer: "This application parses the official RSS feed and facilitates social sharing. All product names belong to Google LLC.",
      toastRefreshSuccess: "Release notes successfully refreshed!",
      toastRefreshFail: "Failed to sync release notes: ",
      toastCopied: "Text copied to clipboard!",
      toastNoExportData: "No data available to export.",
      toastNoExportMatches: "No matching updates to export.",
      toastCsvStarted: "CSV export initiated!",
      toastSearchFocused: "Search input focused!",
      toastDraftReset: "Compose draft reset!",
      toastOffline: "Offline mode. Using cached release notes.",
      toastOnline: "Back online! Ready to sync fresh notes.",
      dateUnknown: "Unknown Date"
    },
    es: {
      appTitle: "Notas de Lanzamiento de BigQuery",
      appSubtitle: "Información en tiempo real y seguimiento de anuncios",
      updatedLabel: "Actualizado:",
      updatedLoading: "Cargando...",
      btnRefresh: "Actualizar",
      btnExportCsv: "Exportar CSV",
      refreshTooltip: "Actualizar notas de lanzamiento",
      exportCsvTooltip: "Exportar a CSV",
      langTooltip: "Cambiar a Inglés",
      statTotalLabel: "Total de Actualizaciones",
      statFeaturesLabel: "Funcionalidades",
      statBreakingLabel: "Críticos / Problemas",
      searchPlaceholder: "Buscar notas de lanzamiento por palabras clave (ej. Gemini, SQL)...",
      filterAll: "Todas las Actualizaciones",
      filterFeatures: "Funcionalidades",
      filterAnnouncements: "Anuncios",
      filterBreaking: "Críticos",
      filterChanges: "Cambios",
      filterIssues: "Problemas",
      errorTitle: "Error al obtener las actualizaciones",
      errorDesc: "Ocurrió un problema al descargar el feed de notas de lanzamiento. Inténtelo de nuevo.",
      btnTryAgain: "Reintentar",
      emptyTitle: "No se encontraron actualizaciones",
      emptyDesc: "Intente refinar los términos de búsqueda o elija otra categoría de filtro.",
      btnResetFilters: "Restablecer Filtros",
      dialogTitle: "Redactar Tweet",
      dialogTextareaPlaceholder: "¿Qué está pasando en BigQuery?",
      dialogNotice: "El borrador es editable. Los enlaces y hashtags serán formateados.",
      dialogExceedsLimit: "¡Supera el límite de caracteres de X (280)!",
      btnResetDraft: "Restablecer borrador predeterminado",
      btnCopyText: "Copiar Texto",
      btnPostX: "Publicar en X",
      scrollToTopTooltip: "Subir al inicio",
      footerTitle: "Explorador Web de Notas de Lanzamiento de Google Cloud BigQuery",
      footerDisclaimer: "Esta aplicación analiza el feed RSS oficial y facilita compartir en redes sociales. Todos los nombres de productos pertenecen a Google LLC.",
      toastRefreshSuccess: "¡Notas de lanzamiento actualizadas con éxito!",
      toastRefreshFail: "Error al sincronizar notas de lanzamiento: ",
      toastCopied: "¡Texto copiado al portapapeles!",
      toastNoExportData: "No hay datos disponibles para exportar.",
      toastNoExportMatches: "No hay actualizaciones coincidentes para exportar.",
      toastCsvStarted: "¡Exportación de CSV iniciada!",
      toastSearchFocused: "¡Buscador enfocado!",
      toastDraftReset: "¡Borrador restablecido!",
      toastOffline: "Modo sin conexión. Usando notas de lanzamiento almacenadas.",
      toastOnline: "¡De nuevo en línea! Listo para sincronizar nuevas notas.",
      dateUnknown: "Fecha Desconocida"
    }
  };

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
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const themeToggleCheckbox = document.getElementById('themeToggleCheckbox');
  const lastUpdatedTime = document.getElementById('lastUpdatedTime');
  const retryBtn = document.getElementById('retryBtn');
  const resetFiltersBtn = document.getElementById('resetFiltersBtn');
  
  // Language elements
  const langBtn = document.getElementById('langBtn');
  const langBtnText = document.getElementById('langBtnText');
  
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
  const resetDraftBtn = document.getElementById('resetDraftBtn');
  const scrollToTopBtn = document.getElementById('scrollToTopBtn');
  const toastContainer = document.getElementById('toastContainer');

  // -----------------------------------------------------------
  // LANGUAGE SELECTION FUNCTIONALITY
  // -----------------------------------------------------------
  function initLanguage() {
    const cachedLang = localStorage.getItem("language") || "en";
    setLanguage(cachedLang, false);
  }

  function setLanguage(lang, save = true) {
    const newLang = lang === 'es' ? 'es' : 'en';
    
    if (save) {
      localStorage.setItem("language", newLang);
    }
    
    if (langBtnText) {
      langBtnText.textContent = newLang === 'es' ? 'EN' : 'ES';
    }
    if (langBtn) {
      const titleText = newLang === 'es' ? 'Cambiar a Inglés' : 'Switch to Spanish';
      langBtn.title = titleText;
      langBtn.setAttribute('aria-label', titleText);
    }
    
    document.documentElement.setAttribute('lang', newLang);
    
    translateUI(newLang);
    
    if (rawUpdatesData && rawUpdatesData.length > 0) {
      renderUpdates();
      updateDashboardStats();
      updateFilterPillCounts();
    }
  }

  function translateUI(lang) {
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    
    // Header
    const appTitle = document.getElementById('appTitle');
    if (appTitle) appTitle.textContent = t.appTitle;
    
    const appSubtitle = document.getElementById('appSubtitle');
    if (appSubtitle) appSubtitle.textContent = t.appSubtitle;
    
    const lastUpdatedLabel = document.getElementById('lastUpdatedLabel');
    if (lastUpdatedLabel) lastUpdatedLabel.textContent = t.updatedLabel;
    
    const refreshBtnText = document.getElementById('refreshBtnText');
    if (refreshBtnText) refreshBtnText.textContent = t.btnRefresh;
    
    const exportCsvBtnText = document.getElementById('exportCsvBtnText');
    if (exportCsvBtnText) exportCsvBtnText.textContent = t.btnExportCsv;
    
    if (refreshBtn) {
      refreshBtn.title = t.refreshTooltip;
      refreshBtn.setAttribute('aria-label', t.refreshTooltip);
    }
    
    if (exportCsvBtn) {
      exportCsvBtn.title = t.exportCsvTooltip;
      exportCsvBtn.setAttribute('aria-label', t.exportCsvTooltip);
    }
    
    // Stats Dashboard
    const statTotalLabel = document.getElementById('statTotalLabel');
    if (statTotalLabel) statTotalLabel.textContent = t.statTotalLabel;
    
    const statFeaturesLabel = document.getElementById('statFeaturesLabel');
    if (statFeaturesLabel) statFeaturesLabel.textContent = t.statFeaturesLabel;
    
    const statAlertsLabel = document.getElementById('statAlertsLabel');
    if (statAlertsLabel) statAlertsLabel.textContent = t.statBreakingLabel;
    
    // Search
    if (searchInput) {
      searchInput.placeholder = t.searchPlaceholder;
      searchInput.setAttribute('aria-label', t.searchPlaceholder);
    }
    
    // Filter Pills
    const filterAllText = document.getElementById('filterAllText');
    if (filterAllText) filterAllText.textContent = t.filterAll;
    
    const filterFeatureText = document.getElementById('filterFeatureText');
    if (filterFeatureText) filterFeatureText.textContent = t.filterFeatures;
    
    const filterAnnouncementText = document.getElementById('filterAnnouncementText');
    if (filterAnnouncementText) filterAnnouncementText.textContent = t.filterAnnouncements;
    
    const filterBreakingText = document.getElementById('filterBreakingText');
    if (filterBreakingText) filterBreakingText.textContent = t.filterBreaking;
    
    const filterChangeText = document.getElementById('filterChangeText');
    if (filterChangeText) filterChangeText.textContent = t.filterChanges;
    
    const filterIssueText = document.getElementById('filterIssueText');
    if (filterIssueText) filterIssueText.textContent = t.filterIssues;
    
    // Stream states
    const errorTitle = document.getElementById('errorTitle');
    if (errorTitle) errorTitle.textContent = t.errorTitle;
    
    const errorMessageText = document.getElementById('errorMessageText');
    if (errorMessageText && (errorMessageText.textContent.includes("We encountered an issue") || errorMessageText.textContent.includes("Ocurrió un problema"))) {
      errorMessageText.textContent = t.errorDesc;
    }
    
    const retryBtnText = document.getElementById('retryBtnText');
    if (retryBtnText) retryBtnText.textContent = t.btnTryAgain;
    
    const emptyTitle = document.getElementById('emptyTitle');
    if (emptyTitle) emptyTitle.textContent = t.emptyTitle;
    
    const emptyDesc = document.getElementById('emptyDesc');
    if (emptyDesc) emptyDesc.textContent = t.emptyDesc;
    
    const resetFiltersBtnText = document.getElementById('resetFiltersBtnText');
    if (resetFiltersBtnText) resetFiltersBtnText.textContent = t.btnResetFilters;
    
    // Tweet Dialog
    const tweetModalTitle = document.getElementById('tweetModalTitle');
    if (tweetModalTitle) tweetModalTitle.textContent = t.dialogTitle;
    
    if (tweetTextarea) {
      tweetTextarea.placeholder = t.dialogTextareaPlaceholder;
      tweetTextarea.setAttribute('aria-label', t.dialogTextareaPlaceholder);
    }
    
    const tweetPreviewNoticeText = document.getElementById('tweetPreviewNoticeText');
    if (tweetPreviewNoticeText) tweetPreviewNoticeText.textContent = t.dialogNotice;
    
    const warningMsg = document.getElementById('warningMsg');
    if (warningMsg) {
      warningMsg.textContent = t.dialogExceedsLimit;
    }
    
    if (resetDraftBtn) {
      resetDraftBtn.title = t.btnResetDraft;
      resetDraftBtn.setAttribute('aria-label', t.btnResetDraft);
    }
    
    const copyTweetBtnText = document.getElementById('copyTweetBtnText');
    if (copyTweetBtnText) copyTweetBtnText.textContent = t.btnCopyText;
    
    const sendTweetBtnText = document.getElementById('sendTweetBtnText');
    if (sendTweetBtnText) sendTweetBtnText.textContent = t.btnPostX;
    
    // Scroll To Top
    if (scrollToTopBtn) {
      scrollToTopBtn.title = t.scrollToTopTooltip;
      scrollToTopBtn.setAttribute('aria-label', t.scrollToTopTooltip);
    }
    
    // Footer
    const footerTitle = document.getElementById('footerTitle');
    if (footerTitle) footerTitle.textContent = t.footerTitle;
    
    const footerDisclaimer = document.getElementById('footerDisclaimer');
    if (footerDisclaimer) footerDisclaimer.textContent = t.footerDisclaimer;
  }

  function formatDateHeader(isoDateStr, fallbackDate) {
    if (!isoDateStr) return fallbackDate;
    try {
      const dateObj = new Date(isoDateStr);
      const currentLang = localStorage.getItem('language') || 'en';
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return dateObj.toLocaleDateString(currentLang === 'es' ? 'es-ES' : 'en-US', options);
    } catch (e) {
      return fallbackDate;
    }
  }

  // -----------------------------------------------------------
  // UX UTILITIES & FEED COUNT BADGES
  // -----------------------------------------------------------
  function showToast(message, type = 'info') {
    const lang = localStorage.getItem("language") || "en";
    const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
    
    const toastMap = {
      'Release notes successfully refreshed!': 'toastRefreshSuccess',
      'Text copied to clipboard!': 'toastCopied',
      'No data available to export.': 'toastNoExportData',
      'No matching updates to export.': 'toastNoExportMatches',
      'CSV export initiated!': 'toastCsvStarted',
      'Search input focused!': 'toastSearchFocused',
      'Compose draft reset!': 'toastDraftReset',
      'Offline mode. Using cached release notes.': 'toastOffline',
      'Back online! Ready to sync fresh notes.': 'toastOnline'
    };
    
    let displayMessage = message;
    if (toastMap[message]) {
      displayMessage = t[toastMap[message]];
    } else if (message.startsWith('Failed to sync release notes: ')) {
      const errorDetail = message.substring('Failed to sync release notes: '.length);
      displayMessage = t.toastRefreshFail + errorDetail;
    } else if (message.startsWith('Failed to copy text: ')) {
      const errorDetail = message.substring('Failed to copy text: '.length);
      displayMessage = (lang === 'es' ? 'Error al copiar texto: ' : 'Failed to copy text: ') + errorDetail;
    }

    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    else if (type === 'error') icon = 'fa-exclamation-circle';
    else if (type === 'warning') icon = 'fa-exclamation-triangle';

    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${displayMessage}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function highlightText(html, query) {
    if (!query) return html;
    const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
    const parts = html.split(/(<[^>]+>)/);
    for (let i = 0; i < parts.length; i++) {
      if (parts[i] && !parts[i].startsWith('<')) {
        parts[i] = parts[i].replace(regex, '<mark class="highlight">$1</mark>');
      }
    }
    return parts.join('');
  }

  function updateFilterPillCounts() {
    const counts = {
      all: rawUpdatesData.length,
      Feature: 0,
      Announcement: 0,
      Breaking: 0,
      Change: 0,
      Issue: 0
    };

    rawUpdatesData.forEach(item => {
      if (counts[item.type] !== undefined) {
        counts[item.type]++;
      }
    });

    Object.keys(counts).forEach(key => {
      const badge = document.getElementById(`count-${key}`);
      if (badge) {
        badge.textContent = `(${counts[key]})`;
      }
    });
  }

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

    // Update Switch Checkbox State
    if (themeToggleCheckbox) {
      themeToggleCheckbox.checked = isDark;
      themeToggleCheckbox.title = isDark ? "Switch to Light Mode" : "Switch to Dark Mode";
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

  if (themeToggleCheckbox) {
    themeToggleCheckbox.addEventListener('change', () => {
      const newTheme = themeToggleCheckbox.checked ? 'dark' : 'light';
      setTheme(newTheme, true);
    });
  }

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
        const lang = localStorage.getItem("language") || "en";
        lastUpdatedTime.textContent = dateObj.toLocaleTimeString(lang === 'es' ? 'es-ES' : 'en-US', { hour: '2-digit', minute: '2-digit' }) + ' ' + dateObj.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US');
      } else {
        const lang = localStorage.getItem("language") || "en";
        lastUpdatedTime.textContent = new Date().toLocaleString(lang === 'es' ? 'es-ES' : 'en-US');
      }

      updateDashboardStats();
      updateFilterPillCounts();
      renderUpdates();
      
      if (isRefresh) {
        showToast('Release notes successfully refreshed!', 'success');
      }
    } catch (err) {
      console.error("Failed to load BigQuery release notes:", err);
      showErrorState(err.message);
      showToast('Failed to sync release notes: ' + err.message, 'error');
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
    
    const lang = localStorage.getItem("language") || "en";
    const typeTranslation = lang === 'es' ? {
      'Feature': 'Funcionalidad',
      'Announcement': 'Anuncio',
      'Breaking': 'Cambio Crítico',
      'Change': 'Cambio',
      'Issue': 'Problema'
    } : {
      'Feature': 'Feature',
      'Announcement': 'Announcement',
      'Breaking': 'Breaking',
      'Change': 'Change',
      'Issue': 'Issue'
    };
    
    // Apply filters
    const filtered = rawUpdatesData.filter(item => {
      // 1. Type Filter
      const matchType = currentFilter === 'all' || item.type === currentFilter;
      
      // 2. Search Query Filter
      const query = searchQuery.trim().toLowerCase();
      
      // Look up localized type as well for search
      const localizedType = (typeTranslation[item.type] || item.type).toLowerCase();
      
      const matchQuery = !query || 
                         item.text.toLowerCase().includes(query) ||
                         item.type.toLowerCase().includes(query) ||
                         localizedType.includes(query) ||
                         formatDateHeader(item.iso_date, item.date).toLowerCase().includes(query);
                         
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
      const dateStr = formatDateHeader(update.iso_date, update.date);
      if (!grouped[dateStr]) {
        grouped[dateStr] = [];
      }
      grouped[dateStr].push(update);
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

        let bodyHtml = item.html;
        if (searchQuery.trim()) {
          bodyHtml = highlightText(bodyHtml, searchQuery.trim());
        }

        const localizedType = typeTranslation[item.type] || item.type;

        card.innerHTML = `
          <div class="card-header-row">
            <span class="type-badge">
              <i class="${iconClass}"></i> ${localizedType}
            </span>
            <div class="card-actions">
              <button class="action-btn copy-action" title="${lang === 'es' ? 'Copiar vista previa de texto al portapapeles' : 'Copy text preview to clipboard'}" aria-label="${lang === 'es' ? 'Copiar vista previa' : 'Copy preview'}">
                <i class="fa-regular fa-copy"></i>
              </button>
              <button class="action-btn tweet-action" title="${lang === 'es' ? 'Editar y Twittear esta actualización' : 'Edit and Tweet about this update'}" aria-label="${lang === 'es' ? 'Twittear actualización' : 'Tweet this update'}">
                <i class="fa-brands fa-x-twitter"></i>
              </button>
            </div>
          </div>
          <div class="card-body">
            ${bodyHtml}
          </div>
        `;
        
        // Add copy action listener
        const copyBtn = card.querySelector('.copy-action');
        copyBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const formattedItemDate = formatDateHeader(item.iso_date, item.date);
          let copyText = "";
          if (lang === 'es') {
            copyText = `BigQuery ${localizedType} - ${formattedItemDate}\n\n${item.text}\n\nLeer más: ${item.url}`;
          } else {
            copyText = `BigQuery ${localizedType} - ${formattedItemDate}\n\n${item.text}\n\nRead more: ${item.url}`;
          }
          copyTextToClipboard(copyText, copyBtn);
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
      showToast('Text copied to clipboard!', 'success');
      if (buttonElement) {
        const icon = buttonElement.querySelector('i');
        if (icon) {
          const originalClass = icon.className;
          icon.className = "fa-solid fa-check";
          buttonElement.style.backgroundColor = "rgba(16, 185, 129, 0.15)";
          
          setTimeout(() => {
            icon.className = originalClass;
            buttonElement.style.backgroundColor = "";
          }, 2000);
        }
      }
    }).catch(err => {
      showToast("Failed to copy text: " + err, 'error');
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

  exportCsvBtn.addEventListener('click', () => {
    if (!rawUpdatesData || rawUpdatesData.length === 0) {
      showToast("No data available to export.", 'warning');
      return;
    }

    const filtered = rawUpdatesData.filter(item => {
      const matchType = currentFilter === 'all' || item.type === currentFilter;
      const query = searchQuery.trim().toLowerCase();
      return matchType && (!query || 
             item.text.toLowerCase().includes(query) ||
             item.type.toLowerCase().includes(query) ||
             item.date.toLowerCase().includes(query));
    });

    if (filtered.length === 0) {
      showToast("No matching updates to export.", 'warning');
      return;
    }

    showToast("CSV export initiated!", 'success');

    const headers = ['ID', 'Date', 'ISO Date', 'Type', 'Description', 'URL'];
    
    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '';
      let str = String(val);
      str = str.replace(/"/g, '""');
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        str = `"${str}"`;
      }
      return str;
    };

    const csvRows = [headers.join(',')];
    filtered.forEach(item => {
      const row = [
        item.id,
        item.date,
        item.iso_date,
        item.type,
        item.text,
        item.url
      ];
      csvRows.push(row.map(escapeCSV).join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    
    let filename = 'bigquery_release_notes';
    if (currentFilter !== 'all') {
      filename += `_${currentFilter.toLowerCase()}`;
    }
    if (searchQuery.trim()) {
      filename += `_${searchQuery.trim().replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
    }
    filename += '.csv';
    
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });

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
    activeComposeItem = item;
    
    const lang = localStorage.getItem("language") || "en";
    const emojiMapEN = {
      'Feature': '🚀 BigQuery Feature',
      'Breaking': '⚠️ BigQuery Breaking Change',
      'Announcement': '📢 BigQuery Announcement',
      'Change': '🔄 BigQuery Change',
      'Issue': '🛠️ BigQuery Issue'
    };
    const emojiMapES = {
      'Feature': '🚀 Funcionalidad de BigQuery',
      'Breaking': '⚠️ Cambio Crítico de BigQuery',
      'Announcement': '📢 Anuncio de BigQuery',
      'Change': '🔄 Cambio de BigQuery',
      'Issue': '🛠️ Problema de BigQuery'
    };
    
    const emojiMap = lang === 'es' ? emojiMapES : emojiMapEN;
    const defaultUpdateTitle = lang === 'es' ? '📢 Actualización de BigQuery' : '📢 BigQuery Update';
    const hashtags = '#GoogleCloud #BigQuery';
    
    const emojiHeader = emojiMap[item.type] || defaultUpdateTitle;
    const formattedItemDate = formatDateHeader(item.iso_date, item.date);
    const url = item.url;
    
    // Format template:
    // "[emojiHeader] ([formattedItemDate]): [Shortened Text] [hashtags] [url]"
    // Let's compute fixed characters
    const templateFixedText = `${emojiHeader} (${formattedItemDate}): \n\n ${hashtags}\n`;
    const fixedLen = templateFixedText.length + url.length + 3; // +3 for spacing
    
    let textBudget = TWEET_LIMIT - fixedLen;
    let textContent = item.text;
    
    if (textContent.length > textBudget) {
      textContent = textContent.substring(0, textBudget - 3) + '...';
    }
    
    const defaultTweet = `${emojiHeader} (${formattedItemDate}):\n"${textContent}"\n\n${hashtags} ${url}`;
    
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
  // INTERACTIVE UX EVENT HANDLERS
  // -----------------------------------------------------------
  
  // Scroll to Top visibility
  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      scrollToTopBtn.classList.add('visible');
    } else {
      scrollToTopBtn.classList.remove('visible');
    }
  });

  scrollToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Keyboard shortcut '/' to focus search
  window.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
      showToast('Search input focused!', 'info');
    }
  });

  // Reset compose draft
  if (resetDraftBtn) {
    resetDraftBtn.addEventListener('click', () => {
      if (activeComposeItem) {
        openTweetComposer(activeComposeItem);
        showToast('Compose draft reset!', 'info');
      }
    });
  }

  // Network offline/online alerts
  window.addEventListener('offline', () => {
    showToast('Offline mode. Using cached release notes.', 'warning');
  });

  window.addEventListener('online', () => {
    showToast('Back online! Ready to sync fresh notes.', 'success');
  });

  // -----------------------------------------------------------
  // BOOTSTRAP INITIALIZATION
  // -----------------------------------------------------------
  if (langBtn) {
    langBtn.addEventListener('click', () => {
      const currentLang = localStorage.getItem("language") || "en";
      const newLang = currentLang === 'en' ? 'es' : 'en';
      setLanguage(newLang, true);
    });
  }

  initTheme();
  initLanguage();
  fetchNotes();
});
