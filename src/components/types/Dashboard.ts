import type { LucideIcon } from 'lucide-react'

export type TagVariant = 'neutral' | 'purple' | 'green'

export interface IOptions {
  type?: string
  path: string
  heading: string
  description: string
  icon?: LucideIcon
  tag?: string
  tagVariant?: TagVariant
  isRecommended?: boolean
}

export interface IDashboard {
  eyebrow: string
  title: string
  subtitle: string
  options: IOptions[]
  backButtonPath: string
  viewSchemasPath?: string
  gridCols?: 3 | 4
}
