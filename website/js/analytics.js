// Analytics and tracking scripts
// Amplitude handles page views, session replay, and event tracking
// Configure AMPLITUDE_API_KEY in config.js or set window.ANALYTICS_CONFIG before this script loads

(function() {
  var config = window.ANALYTICS_CONFIG || {};

  // Amplitude API keys are 32-character hex strings
  var AMPLITUDE_KEY_PATTERN = /^[a-f0-9]{32}$/;

  if (!config.AMPLITUDE_API_KEY) {
    return; // Analytics disabled — no key configured
  }

  if (!AMPLITUDE_KEY_PATTERN.test(config.AMPLITUDE_API_KEY)) {
    console.warn('Invalid AMPLITUDE_API_KEY format. Expected 32-character hex string.');
    return;
  }

  var apiKey = config.AMPLITUDE_API_KEY;

  // Load Amplitude Browser SDK from CDN
  var ampScript = document.createElement('script');
  ampScript.async = true;
  ampScript.src = 'https://cdn.amplitude.com/libs/analytics-browser-2.11.0-min.js.gz';
  ampScript.onerror = function() {
    console.warn('Failed to load Amplitude Analytics script');
  };
  ampScript.onload = function() {
    if (window.amplitude) {
      window.amplitude.init(apiKey, { autocapture: true });
    }
  };
  document.head.appendChild(ampScript);

  // Track CTA clicks to the app
  document.addEventListener('DOMContentLoaded', function() {
    var links = document.querySelectorAll('a[href*="app.openhamprep.com"]');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', function(e) {
        if (window.amplitude) {
          window.amplitude.track('CTA Clicked', {
            page: window.location.pathname,
            button_text: this.textContent.trim(),
            destination_url: this.href,
          });
        }
      });
    }
  });
})();
