/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: "#f0f9f0",
                    100: "#daf1da",
                    200: "#b8e4b8",
                    300: "#8cd08c",
                    400: "#5cb85c",
                    500: "#3b8c3b",
                    600: "#2d6e2d",
                    700: "#235523",
                    800: "#1c441c",
                    900: "#163816",
                },
                medical: {
                    bg: "#f8fafc",
                    card: "#ffffff",
                    border: "#e2e8f0",
                    text: "#0f172a",
                    muted: "#64748b",
                },
            },
            fontFamily: {
                sans: ["Inter", "system-ui", "sans-serif"],
            },
            animation: {
                "fade-in": "fadeIn 0.5s ease-out",
                "slide-up": "slideUp 0.4s ease-out",
            },
            keyframes: {
                fadeIn: {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                slideUp: {
                    "0%": { transform: "translateY(20px)", opacity: "0" },
                    "100%": { transform: "translateY(0)", opacity: "1" },
                },
            },
        },
    },
    plugins: [],
};