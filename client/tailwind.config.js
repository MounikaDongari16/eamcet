/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                pastel: {
                    bg: '#F8FAFC', // Very light blue-grey for background
                    card: '#FFFFFF',
                    text: '#1E293B', // Slate 800
                    primary: '#8B5CF6', // Violet 500 (Soft)
                    secondary: '#10B981', // Emerald 500
                    accent: '#F59E0B', // Amber 500

                    // Specific Pastel Tones
                    mint: '#D1FAE5', // Emerald 100
                    blue: '#DBEAFE', // Blue 100
                    lavender: '#EDE9FE', // Violet 100
                    rose: '#FFE4E6', // Rose 100
                    sunshine: '#FEF3C7', // Amber 100
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
