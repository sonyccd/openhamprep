// Analytics and tracking scripts
// Amplitude handles page views and event tracking via autocapture
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

  // Attach click handlers to all CTA links pointing to the app.
  // Called after SDK loads to guarantee window.amplitude exists.
  function attachCTATracking() {
    function setup() {
      document.querySelectorAll('a[href*="app.openhamprep.com"]').forEach(function(link) {
        link.addEventListener('click', function() {
          window.amplitude.track('CTA Clicked', {
            page: window.location.pathname,
            button_text: this.textContent.trim(),
            destination_url: this.href,
          });
        });
      });
    }

    // DOM may already be ready if SDK loaded after DOMContentLoaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setup);
    } else {
      setup();
    }
  }

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
      attachCTATracking();
    }
  };
  document.head.appendChild(ampScript);
})();
