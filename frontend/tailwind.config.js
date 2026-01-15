/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // Light mode
                background: {
                    light: '#FFFFFF',
                    'light-secondary': '#F9FAFB',
                },
                // Dark mode
                dark: {
                    bg: '#1F1F1F',
                    'bg-secondary': '#2A2A2A',
                    'bg-tertiary': '#333333',
                    border: '#404040',
                    text: '#E5E5E5',
                    'text-secondary': '#A0A0A0',
                },
                // Accent colors
                accent: {
                    primary: '#10A37F',
                    'primary-hover': '#0D8A6B',
                    secondary: '#6366F1',
                    danger: '#EF4444',
                },
                // Neutral
                border: {
                    light: '#E5E7EB',
                    DEFAULT: '#D1D5DB',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'Consolas', 'monospace'],
            },
            boxShadow: {
                'sm-light': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                'md-light': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            },
            borderRadius: {
                'lg': '0.75rem',
                'xl': '1rem',
            },
            animation: {
                'fade-in': 'fadeIn 0.2s ease-out',
                'slide-in': 'slideIn 0.3s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideIn: {
                    '0%': { transform: 'translateY(10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
            },
        },
    },
    plugins: [],
}
