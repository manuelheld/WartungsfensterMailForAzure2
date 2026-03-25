/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                zf: {
                    blue: '#002D58', // Traditional ZF Blue
                    cyan: '#00AAC8', // ZF Cyan highlight
                    darkBlue: '#001D38', // Even darker shade for footer/deep contrast
                    lightBlue: '#004a8f',
                    gray: '#F5F5F7', // ZF light gray background
                }
            },
            fontFamily: {
                sans: ['"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
