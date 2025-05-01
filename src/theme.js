import { extendTheme } from "@chakra-ui/react";

const theme = extendTheme({
  config: {
    initialColorMode: "dark",
    useSystemColorMode: false,
  },
  fonts: {
    heading: "'Space Grotesk', sans-serif",
    body: "'Inter', sans-serif",
    mono: "'Fira Code', monospace",
  },
  colors: {
    brand: {
      50: "#e0f7ff",
      100: "#b8e8ff",
      200: "#8cd8ff",
      300: "#5cc8ff",
      400: "#36b9ff",
      500: "#0aabff",
      600: "#0087cc",
      700: "#006399",
      800: "#004066",
      900: "#001d33",
    },
    editor: {
      bg: "#151a23",
      sidebar: "#1e2430",
      accent: "#0aabff",
      text: "#e2e8f0",
      muted: "#a0aec0",
      border: "#2d3748",
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: "600",
        borderRadius: "md",
      },
      variants: {
        solid: {
          bg: "brand.500",
          color: "white",
          _hover: {
            bg: "brand.600",
          },
        },
        outline: {
          borderColor: "brand.500",
          color: "brand.500",
          _hover: {
            bg: "rgba(10, 171, 255, 0.1)",
          },
        },
        ghost: {
          color: "editor.text",
          _hover: {
            bg: "rgba(255, 255, 255, 0.1)",
          },
        },
      },
    },
    Menu: {
      baseStyle: {
        list: {
          bg: "editor.sidebar",
          borderColor: "editor.border",
        },
        item: {
          bg: "editor.sidebar",
          _hover: {
            bg: "rgba(255, 255, 255, 0.1)",
          },
          _focus: {
            bg: "rgba(255, 255, 255, 0.1)",
          },
        },
      },
    },
    Box: {
      variants: {
        "glass-morph": {
          bg: "rgba(30, 36, 48, 0.7)",
          backdropFilter: "blur(10px)",
          borderRadius: "xl",
          borderWidth: "1px",
          borderColor: "rgba(255, 255, 255, 0.1)",
        },
      },
    },
  },
  styles: {
    global: {
      body: {
        bg: "editor.bg",
        color: "editor.text",
      },
    },
  },
});

export default theme;
