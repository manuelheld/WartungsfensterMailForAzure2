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
                    blue: '#002D58',
                    lightBlue: '#004a8f',
                }
            }
        },
    },
    plugins: [],
}
