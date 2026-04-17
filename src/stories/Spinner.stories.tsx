import type { Meta, StoryObj } from '@storybook/nextjs'
import { Spinner } from '@/components/ui/Spinner'

const meta: Meta<typeof Spinner> = {
  title: 'UI/Spinner',
  component: Spinner,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
}
export default meta
type Story = StoryObj<typeof Spinner>

export const Small:  Story = { args: { size: 'sm' } }
export const Medium: Story = { args: { size: 'md' } }
export const Large:  Story = { args: { size: 'lg' } }

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, padding: 24, background: '#0a1929' }}>
      <Spinner size="sm" />
      <Spinner size="md" />
      <Spinner size="lg" />
    </div>
  ),
}
