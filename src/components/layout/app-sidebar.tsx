'use client'
/* eslint-disable sort-imports */

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import React, { JSX, useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import {
  appFaviconPath,
  appLogoAltText,
  appLogoDarkPath,
  appLogoPath,
  currentPageNumber,
  itemPerPage,
} from '@/config/CommonConstant'
import {
  resetOrgState,
  setOrgId,
  setOrgInfo,
  setSelectedOrgId,
  setTenantData,
} from '@/lib/orgSlice'
import { useAppDispatch, useAppSelector } from '@/lib/hooks'
import { usePathname } from 'next/navigation'

import { IconChevronRight } from '@tabler/icons-react'
import { Icons } from '../icons'
import Image from 'next/image'
import Link from 'next/link'
import { NavItem } from '../../../types'
import { Organization } from '@/features/dashboard/type/organization'
import { getOrganizations } from '@/app/api/organization'
import { hardNavigate } from '@/utils/navigation'
import { navItems } from '@/constants/data'
import { setSidebarCollapsed } from '@/lib/sidebarSlice'

const APP_CONFIG = {
  logo: appLogoPath,
  logoDark: appLogoDarkPath,
  collapsedLogo: appFaviconPath,
}

export default function AppSidebar(): React.JSX.Element {
  const pathname = usePathname()

  const dispatch = useAppDispatch()

  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const logoImageSrc =
    mounted && resolvedTheme === 'dark' ? APP_CONFIG.logoDark : APP_CONFIG.logo
  const collapsedLogoImageSrc = APP_CONFIG.collapsedLogo

  const [currentPage] = useState(currentPageNumber)
  const [pageSize] = useState(itemPerPage)
  const [searchTerm] = useState('')
  const [managedNavItem, setManagedNavItem] = useState<NavItem[]>(navItems)

  const selectedOrgId = useAppSelector((state) => state.organization.orgId)
  const isCollapsed = useAppSelector((state) => state.sidebar.isCollapsed)
  const ecosystemEnableStatus = useAppSelector(
    (state) => state.ecosystem.ecosystemEnableStatus,
  )

  useEffect(() => {
    dispatch(setSidebarCollapsed(true))
  }, [dispatch])

  useEffect(() => {
    const fetchOrganizations = async (): Promise<void> => {
      try {
        const response = await getOrganizations(
          currentPage,
          pageSize,
          searchTerm,
          '',
        )
        if (
          typeof response !== 'string' &&
          response?.data?.data?.organizations
        ) {
          const orgs = response.data.data.organizations

          if (orgs.length === 0) {
            dispatch(resetOrgState())
            return
          }

          const selectedOrg = orgs.find(
            (org: Organization) => org.id === selectedOrgId,
          )
          const [firstOrg]: Organization[] = orgs
          const nextOrg = selectedOrg ?? firstOrg

          if (!selectedOrgId || selectedOrgId !== nextOrg.id) {
            dispatch(setOrgId(nextOrg.id))
            dispatch(setSelectedOrgId(nextOrg.id))
            dispatch(
              setTenantData({
                id: nextOrg.id,
                name: nextOrg.name,
                logoUrl: nextOrg.logoUrl,
              }),
            )
            dispatch(
              setOrgInfo({
                id: nextOrg.id,
                name: nextOrg.name,
                description: nextOrg.description,
                logoUrl: nextOrg.logoUrl,
                roles:
                  nextOrg.userOrgRoles?.map(
                    (role: { orgRole: { name: string } }) =>
                      role?.orgRole?.name,
                  ) || [],
              }),
            )
          }
        }
      } catch (err) {
        console.error('Error fetching organizations:', err)
      }
    }

    fetchOrganizations()
  }, [dispatch, currentPage, pageSize, searchTerm, selectedOrgId])

  useEffect(() => {
    if (ecosystemEnableStatus) {
      setManagedNavItem((prev) => {
        const exists = prev.some((item) => item.url === '/ecosystems')
        if (exists) {
          return prev
        }

        const ecosystemMenu: NavItem = {
          title: 'Ecosystems',
          url: '/ecosystems',
          icon: 'world',
          isActive: false,
          shortcut: ['e', 'e'],
          items: [],
        }

        return [...prev, ecosystemMenu]
      })
    }
  }, [ecosystemEnableStatus])
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="group" data-collapsed>
        <button
          onClick={() => hardNavigate('/dashboard')}
          className="focus-visible:ring-primary relative cursor-pointer rounded transition-all duration-300 focus:outline-none focus-visible:ring-2"
          aria-label="Go to dashboard"
        >
          {isCollapsed ? (
            <div className="h-[40px] w-[150px] overflow-hidden">
              <Image
                height={40}
                width={150}
                alt={appLogoAltText}
                className="h-auto max-h-[100px] w-auto object-contain"
                src={logoImageSrc}
              />
            </div>
          ) : (
            <div className="hidden h-[40px] w-[40px] group-data-[collapsed=true]:block">
              <Image
                height={40}
                width={40}
                alt={appLogoAltText}
                className="h-full w-full object-contain"
                src={collapsedLogoImageSrc}
              />
            </div>
          )}
        </button>
      </SidebarHeader>

      <SidebarContent className="overflow-x-hidden">
        <SidebarGroup>
          <SidebarMenu>
            {managedNavItem.map((item: NavItem): JSX.Element => {
              const Icon = item.icon ? Icons[item.icon] : Icons.logo
              return item?.items && item.items.length > 0 ? (
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen={item.isActive}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={item.title}
                        isActive={pathname === item.url}
                        className="data-[active=true]:bg-primary data-[active=true]:hover:bg-primary/90 data-[active=true]:text-primary-foreground"
                      >
                        {item.icon && <Icon />}
                        <span>{item.title}</span>
                        <IconChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === subItem.url}
                              className="data-[active=true]:bg-primary data-[active=true]:hover:bg-primary/90 data-[active=true]:text-primary-foreground"
                            >
                              <Link
                                href={
                                  subItem.title === 'DID'
                                    ? `${subItem.url}?orgId=${selectedOrgId}`
                                    : subItem.url
                                }
                              >
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ) : (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={pathname.startsWith(item.url)}
                    className="data-[active=true]:bg-primary data-[active=true]:hover:bg-primary/90 data-[active=true]:text-primary-foreground"
                  >
                    <Link href={item.url}>
                      <Icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  )
}
