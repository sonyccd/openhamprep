// Analytics and tracking scripts
// All tracking tools gracefully handle missing configuration
// Configure keys in config.js or set window.ANALYTICS_CONFIG before this script loads

(function() {
  // Get config (set by config.js or externally)
  var config = window.ANALYTICS_CONFIG || {};

  // Validation patterns for analytics IDs (prevents XSS via malformed IDs)
  var GA_ID_PATTERN = /^G-[A-Z0-9]+$/;
  var CLARITY_ID_PATTERN = /^[a-z0-9]+$/;

  // Google Analytics (GA4)
  // https://analytics.google.com
  if (config.GA_MEASUREMENT_ID && GA_ID_PATTERN.test(config.GA_MEASUREMENT_ID)) {
    var gaScript = document.createElement('script');
    gaScript.async = true;
    gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=' + config.GA_MEASUREMENT_ID;
    gaScript.onerror = function() {
      console.warn('Failed to load Google Analytics script');
    };
    document.head.appendChild(gaScript);

    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', config.GA_MEASUREMENT_ID);
  } else if (config.GA_MEASUREMENT_ID) {
    console.warn('Invalid GA_MEASUREMENT_ID format. Expected format: G-XXXXXXXXXX');
  }

  // Microsoft Clarity
  // https://clarity.microsoft.com
  if (config.CLARITY_PROJECT_ID && CLARITY_ID_PATTERN.test(config.CLARITY_PROJECT_ID)) {
    (function(c,l,a,r,i,t,y){
      c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
      t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
      t.onerror=function(){console.warn('Failed to load Microsoft Clarity script');};
      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", config.CLARITY_PROJECT_ID);
  } else if (config.CLARITY_PROJECT_ID) {
    console.warn('Invalid CLARITY_PROJECT_ID format. Expected lowercase alphanumeric characters only.');
  }
})();
