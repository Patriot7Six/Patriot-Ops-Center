import type { Meta, StoryObj } from '@storybook/nextjs'
import { Badge } from '@/components/ui/Badge'

const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'gold', 'green', 'purple', 'red'],
    },
  },
}
export default meta
type Story = StoryObj<typeof Badge>

export const Default:  Story = { args: { variant: 'default', children: 'Free' } }
export const Gold:     Story = { args: { variant: 'gold',    children: 'Ranger' } }
export const Green:    Story = { args: { variant: 'green',   children: 'Active' } }
export const Purple:   Story = { args: { variant: 'purple',  children: 'Special Ops' } }
export const Red:      Story = { args: { variant: 'red',     children: 'Past Due' } }

export const AllBadges: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: 24, background: '#0a1929' }}>
      <Badge variant="default">Free</Badge>
      <Badge variant="gold">Ranger</Badge>
      <Badge variant="green">Active</Badge>
      <Badge variant="purple">Special Ops</Badge>
      <Badge variant="red">Past Due</Badge>
    </div>
  ),
}
