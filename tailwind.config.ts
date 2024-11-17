import { nextui } from "@nextui-org/react";
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        'editor-bg': "#232327",
      },
      fontFamily: {
        sans: ['var(--font-dos)'],
      },
    },
  },
  darkMode: "class",
  plugins: [
    require('@tailwindcss/typography'),
    nextui({
    themes: {
        "light": {
          "colors": {
            "default": {
              "50": "#fafafa",
              "100": "#f2f2f3",
              "200": "#ebebec",
              "300": "#e3e3e6",
              "400": "#dcdcdf",
              "500": "#d4d4d8",
              "600": "#afafb2",
              "700": "#8a8a8c",
              "800": "#656567",
              "900": "#404041",
              "foreground": "#000",
              "DEFAULT": "#d4d4d8"
            },
            "primary": {
              "50": "#dfedfd",
              "100": "#b3d4fa",
              "200": "#86bbf7",
              "300": "#59a1f4",
              "400": "#2d88f1",
              "500": "#006fee",
              "600": "#005cc4",
              "700": "#00489b",
              "800": "#003571",
              "900": "#002147",
              "foreground": "#fff",
              "DEFAULT": "#006fee"
            },
            "secondary": {
              "50": "#eee4f8",
              "100": "#d7bfef",
              "200": "#bf99e5",
              "300": "#a773db",
              "400": "#904ed2",
              "500": "#7828c8",
              "600": "#6321a5",
              "700": "#4e1a82",
              "800": "#39135f",
              "900": "#240c3c",
              "foreground": "#fff",
              "DEFAULT": "#7828c8"
            },
            "success": {
              "50": "#e2f8ec",
              "100": "#b9efd1",
              "200": "#91e5b5",
              "300": "#68dc9a",
              "400": "#40d27f",
              "500": "#17c964",
              "600": "#13a653",
              "700": "#0f8341",
              "800": "#0b5f30",
              "900": "#073c1e",
              "foreground": "#000",
              "DEFAULT": "#17c964"
            },
            "warning": {
              "50": "#fef4e4",
              "100": "#fce4bd",
              "200": "#fad497",
              "300": "#f9c571",
              "400": "#f7b54a",
              "500": "#f5a524",
              "600": "#ca881e",
              "700": "#9f6b17",
              "800": "#744e11",
              "900": "#4a320b",
              "foreground": "#000",
              "DEFAULT": "#f5a524"
            },
            "danger": {
              "50": "#fee1eb",
              "100": "#fbb8cf",
              "200": "#f98eb3",
              "300": "#f76598",
              "400": "#f53b7c",
              "500": "#f31260",
              "600": "#c80f4f",
              "700": "#9e0c3e",
              "800": "#73092e",
              "900": "#49051d",
              "foreground": "#000",
              "DEFAULT": "#f31260"
            },
            "background": "#ffffff",
            "foreground": {
              "50": "#dfdfdf",
              "100": "#b3b3b3",
              "200": "#868686",
              "300": "#595959",
              "400": "#2d2d2d",
              "500": "#000000",
              "600": "#000000",
              "700": "#000000",
              "800": "#000000",
              "900": "#000000",
              "foreground": "#fff",
              "DEFAULT": "#000000"
            },
            "content1": {
              "DEFAULT": "#ffffff",
              "foreground": "#000"
            },
            "content2": {
              "DEFAULT": "#f4f4f5",
              "foreground": "#000"
            },
            "content3": {
              "DEFAULT": "#e4e4e7",
              "foreground": "#000"
            },
            "content4": {
              "DEFAULT": "#d4d4d8",
              "foreground": "#000"
            },
            "focus": "#006FEE",
            "overlay": "#000000",
            "divider": "#111111"
          }
        },
        "dark": {
          "colors": {
            "default": {
              "50": "#141417",
              "100": "#232327",
              "200": "#313136",
              "300": "#3f3f46",
              "400": "#6a6a70",
              "500": "#959599",
              "600": "#c1c1c3",
              "700": "#ececed",
              "foreground": "#fff",
              "DEFAULT": "#313136"
            },
            "primary": {
              "50": "#00244d",
              "100": "#003d83",
              "200": "#0056b8",
              "300": "#006fee",
              "400": "#398ff2",
              "500": "#73b0f6",
              "600": "#acd0f9",
              "700": "#e6f1fd",
              "foreground": "#fff",
              "DEFAULT": "#0056b8"
            },
            "secondary": {
              "50": "#270d41",
              "100": "#42166e",
              "200": "#5d1f9b",
              "300": "#7828c8",
              "400": "#9658d4",
              "500": "#b589e1",
              "600": "#d3b9ed",
              "700": "#f2eafa",
              "foreground": "#fff",
              "DEFAULT": "#5d1f9b"
            },
            "success": {
              "50": "#074120",
              "100": "#0d6f37",
              "200": "#129c4e",
              "300": "#17c964",
              "400": "#4bd587",
              "500": "#7fe1aa",
              "600": "#b4edcd",
              "700": "#e8faf0",
              "foreground": "#000",
              "DEFAULT": "#129c4e"
            },
            "warning": {
              "50": "#50360c",
              "100": "#875b14",
              "200": "#be801c",
              "300": "#f5a524",
              "400": "#f7b955",
              "500": "#face87",
              "600": "#fce2b8",
              "700": "#fef6e9",
              "foreground": "#000",
              "DEFAULT": "#be801c"
            },
            "danger": {
              "50": "#4f061f",
              "100": "#860a35",
              "200": "#bc0e4a",
              "300": "#f31260",
              "400": "#f64784",
              "500": "#f87da8",
              "600": "#fbb2cb",
              "700": "#fee7ef",
              "foreground": "#fff",
              "DEFAULT": "#bc0e4a"
            },
            "background": "#000000",
            "foreground": {
              "50": "#535353",
              "100": "#8c8c8c",
              "200": "#c6c6c6",
              "300": "#ffffff",
              "400": "#ffffff",
              "500": "#ffffff",
              "600": "#ffffff",
              "700": "#ffffff",
              "foreground": "#000",
              "DEFAULT": "#c6c6c6"
            },
            "content1": {
              "DEFAULT": "#18181b",
              "foreground": "#fff"
            },
            "content2": {
              "DEFAULT": "#27272a",
              "foreground": "#fff"
            },
            "content3": {
              "DEFAULT": "#3f3f46",
              "foreground": "#fff"
            },
            "content4": {
              "DEFAULT": "#52525b",
              "foreground": "#fff"
            },
            "focus": "#006FEE",
            "overlay": "#ffffff",
            "divider": "#ffffff"
          }
        }
      },
      layout: {
        "fontSize": {
          "tiny": "0.75rem",
          "small": "0.875rem",
          "medium": "1rem",
          "large": "1.125rem"
        },
        "lineHeight": {
          "tiny": "1rem",
          "small": "1.25rem",
          "medium": "1.5rem",
          "large": "1.75rem"
        },
        "radius": {
          "small": "0.5rem",
          "medium": "0.75rem",
          "large": "0.875rem"
        },
        "borderWidth": {
          "small": "1px",
          "medium": "2px",
          "large": "3px"
        },
        "disabledOpacity": "0.5",
        "dividerWeight": "1",
        "hoverOpacity": "0.9"
      },
    }),
  ],
};
export default config;