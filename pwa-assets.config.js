import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  preset: {
    ...minimal2023Preset,
    maskable: {
      ...minimal2023Preset.maskable,
      padding: 0.15,
      resizeOptions: { background: '#0B0B0C', fit: 'contain' },
    },
    apple: {
      ...minimal2023Preset.apple,
      padding: 0.1,
      resizeOptions: { background: '#0B0B0C', fit: 'contain' },
    },
  },
  images: ['src/assets/logos/spartan-league-main.png'],
})
