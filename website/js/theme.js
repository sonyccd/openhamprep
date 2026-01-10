// Theme toggle functionality
(function() {
  const STORAGE_KEY = 'theme';
  const DARK_CLASS = 'dark';

  // Get the effective theme (saved preference or system default)
  function getEffectiveTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEY);
    if (savedTheme) {
      return savedTheme;
    }
    // Default to system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
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
    const currentTheme = getEffectiveTheme();
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    saveTheme(newTheme);
    applyTheme(newTheme);
  }

  // Initialize theme on page load
  function initTheme() {
    const effectiveTheme = getEffectiveTheme();
    applyTheme(effectiveTheme);

    // Set up theme toggle buttons
    const themeToggle = document.getElementById('theme-toggle');
    const themeToggleMobile = document.getElementById('theme-toggle-mobile');

    if (themeToggle) {
      themeToggle.addEventListener('click', toggleTheme);
    }

    if (themeToggleMobile) {
      themeToggleMobile.addEventListener('click', toggleTheme);
    }

    // Listen for system theme changes (when no saved preference)
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
      if (!localStorage.getItem(STORAGE_KEY)) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
  } else {
    initTheme();
  }
})();
