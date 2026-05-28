"use client";

import { ChakraProvider, createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const config = defineConfig({
  theme: {
    tokens: {
      fonts: {
        heading: { value: "var(--font-display), Georgia, serif" },
        body: { value: "var(--font-body), system-ui, sans-serif" },
        mono: { value: "var(--font-mono), ui-monospace, monospace" }
      }
    }
  }
});

const system = createSystem(defaultConfig, config);

export function Provider({ children }: { children: React.ReactNode }) {
  return <ChakraProvider value={system}>{children}</ChakraProvider>;
}
