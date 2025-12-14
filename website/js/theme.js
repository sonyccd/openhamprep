// Theme toggle functionality
(function() {
  const STORAGE_KEY = 'theme';
  const DARK_CLASS = 'dark';

  // Get saved theme or default to 'light'
  function getSavedTheme() {
    return localStorage.getItem(STORAGE_KEY) || 'light';
  }

  // Save theme preference
  function saveTheme(theme) {
    localStorage.setItem(STORAGE_KEY, theme);
  }

  // Apply theme to document
  function applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.classList.add(DARK_CLASS);
    } else {
      document.documentElement.classList.remove(DARK_CLASS);
    }
  }

  // Toggle between light and dark
  function toggleTheme() {
    const currentTheme = getSavedTheme();
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    saveTheme(newTheme);
    applyTheme(newTheme);
  }

  // Initialize theme on page load
  function initTheme() {
    const savedTheme = getSavedTheme();
    applyTheme(savedTheme);

    // Set up theme toggle buttons
    const themeToggle = document.getElementById('theme-toggle');
    const themeToggleMobile = document.getElementById('theme-toggle-mobile');

    if (themeToggle) {
      themeToggle.addEventListener('click', toggleTheme);
    }

    if (themeToggleMobile) {
      themeToggleMobile.addEventListener('click', toggleTheme);
    }
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
  } else {
    initTheme();
  }
})();
