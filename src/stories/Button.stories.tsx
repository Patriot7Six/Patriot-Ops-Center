import type { Meta, StoryObj } from '@storybook/nextjs'
import { Button } from '@/components/ui/Button'

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'outline', 'danger'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', 'icon'],
    },
    disabled: { control: 'boolean' },
  },
}

export default meta
type Story = StoryObj<typeof Button>

export const Primary: Story = {
  args: { variant: 'primary', size: 'md', children: 'Get started free' },
}

export const Secondary: Story = {
  args: { variant: 'secondary', size: 'md', children: 'Learn more' },
}

export const Ghost: Story = {
  args: { variant: 'ghost', size: 'md', children: 'Sign in' },
}

export const Outline: Story = {
  args: { variant: 'outline', size: 'md', children: 'Back' },
}

export const Danger: Story = {
  args: { variant: 'danger', size: 'md', children: 'Delete account' },
}

export const Large: Story = {
  args: { variant: 'primary', size: 'lg', children: 'Start Ranger — $34/mo' },
}

export const ExtraLarge: Story = {
  args: { variant: 'primary', size: 'xl', children: 'Get started free →' },
}

export const Disabled: Story = {
  args: { variant: 'primary', size: 'md', children: 'Submit', disabled: true },
}

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', padding: 24, background: '#0a1929' }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="danger">Danger</Button>
    </div>
  ),
}
