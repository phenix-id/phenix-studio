import { pathRoutes } from '@/config/pathRoutes'
import { redirect } from 'next/navigation'

const page = (): never => redirect(pathRoutes.organizations.billing)

export default page
