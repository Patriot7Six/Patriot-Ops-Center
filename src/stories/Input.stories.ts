// src/stories/Input.stories.ts
import type { Meta, StoryObj } from '@storybook/nextjs'
import { Input } from '@/components/ui/Input'

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    label:       { control: 'text' },
    placeholder: { control: 'text' },
    error:       { control: 'text' },
    disabled:    { control: 'boolean' },
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'date', 'number'],
    },
  },
}
export default meta
type Story = StoryObj<typeof Input>

export const Default: Story = {
  args: { label: 'Email', type: 'email', placeholder: 'you@example.com' },
}

export const WithError: Story = {
  args: {
    label: 'Email',
    type: 'email',
    placeholder: 'you@example.com',
    error: 'Invalid email address',
  },
}

export const Password: Story = {
  args: { label: 'Password', type: 'password', placeholder: 'Min. 8 characters' },
}

export const Disabled: Story = {
  args: { label: 'MOS', type: 'text', placeholder: 'Select a branch first', disabled: true },
}

export const DateInput: Story = {
  args: { label: 'Separation Date', type: 'date' },
}
