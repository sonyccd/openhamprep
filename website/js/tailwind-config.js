// Shared Tailwind CSS configuration for all marketing pages.
// Load this before the Tailwind CDN script and assign to tailwind.config.
//
// ⚠️  gray-800 = #212F45 (brand navy) — NOT standard Tailwind gray.
//     Cards using dark:bg-gray-800 will need explicit text-color overrides
//     because the background will be navy, not a typical dark gray.
window.__TAILWIND_CONFIG = {
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ["'DM Sans'", 'system-ui', 'sans-serif'],
        mono: ['Norwester', 'system-ui', 'sans-serif'],
      },
      colors: {
        amber: {
          50: '#FFF8EF', 100: '#FFF0D6', 200: '#FFE4B3', 300: '#FFD48A',
          400: '#FFCA78', 500: '#FFC285', 600: '#FFB36D', 700: '#E09A50',
          800: '#C07830', 900: '#9A5818',
        },
        // ⚠️  gray-800 = #212F45 (brand navy, NOT standard Tailwind gray-800).
        //     See note above.
        gray: {
          50: '#F8F7F5', 100: '#F0EEED', 200: '#E0DCDA', 300: '#C4BEBB',
          400: '#A09898', 500: '#726E6C', 600: '#4A4646', 700: '#322E2C',
          800: '#212F45', 900: '#161F2E',
        },
        teal: {
          100: '#D4FFF0', 400: '#85FFC7', 500: '#5EFDB5',
          600: '#3DDBA0', 900: '#0D4A35',
        },
      },
    },
  },
};
