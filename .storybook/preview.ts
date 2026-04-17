// .storybook/preview.ts
import type { Preview } from '@storybook/nextjs'
import '../src/app/globals.css'

const preview: Preview = {
  parameters: {
    // Force dark navy background to match the app
    backgrounds: {
      default: 'navy',
      values: [
        { name: 'navy',  value: '#0a1929' },
        { name: 'white', value: '#ffffff' },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /date$/i,
      },
    },
    layout: 'centered',
  },
  decorators: [
    Story => {
      return Story()
    },
  ],
}

export default preview
