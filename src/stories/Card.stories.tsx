// src/stories/Card.stories.tsx
import type { Meta, StoryObj } from '@storybook/nextjs'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card'

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
  argTypes: {
    glow: { control: 'boolean' },
  },
}
export default meta
type Story = StoryObj<typeof Card>

export const Default: Story = {
  args: {
    glow: false,
    children: (
      <>
        <CardHeader><h3 style={{ color: '#fff', fontWeight: 700 }}>Card Title</h3></CardHeader>
        <CardContent><p style={{ color: '#94a3b8', fontSize: 14 }}>Card body content goes here.</p></CardContent>
        <CardFooter><span style={{ color: '#64748b', fontSize: 12 }}>Footer content</span></CardFooter>
      </>
    ),
  },
}

export const WithGlow: Story = {
  args: {
    glow: true,
    children: (
      <CardContent>
        <p style={{ color: '#f59e0b', fontWeight: 600 }}>Gold glow card</p>
        <p style={{ color: '#94a3b8', fontSize: 14, marginTop: 8 }}>Used for featured or highlighted cards.</p>
      </CardContent>
    ),
  },
}
