'use client'

import { useState, useCallback, createContext, useContext, ReactNode } from 'react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Menu, Bell, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'

interface NavItem {
  id: string
  label: string
  icon: React.ElementType
  badge?: boolean
}

interface ResponsiveLayoutContextType {
  activeTab: string
  setActiveTab: (tab: string) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

const ResponsiveLayoutContext = createContext<ResponsiveLayoutContextType | null>(null)

export function useResponsiveLayout() {
  const context = useContext(ResponsiveLayoutContext)
  if (!context) {
    throw new Error('useResponsiveLayout must be used within ResponsiveLayoutProvider')
  }
  return context
}

interface ResponsiveLayoutProviderProps {
  children: ReactNode
  navItems: NavItem[]
  tabTitles: Record<string, string>
  SidebarComponent: React.ComponentType<{ activeTab: string; onTabChange: (tab: string) => void; unreadCount: number }>
  HeaderComponent?: React.ComponentType<{ title: string; unreadCount: number }>
  defaultTab?: string
  badgeCount?: number
}

export function ResponsiveLayoutProvider({
  children,
  navItems,
  tabTitles,
  SidebarComponent,
  HeaderComponent,
  defaultTab = 'overview',
  badgeCount = 0,
}: ResponsiveLayoutProviderProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { logout } = useAuth()

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab)
  }, [])

  const handleSidebarTabChange = useCallback((tab: string) => {
    setActiveTab(tab)
    setSidebarOpen(false)
  }, [])

  return (
    <ResponsiveLayoutContext.Provider
      value={{ activeTab, setActiveTab: handleTabChange, sidebarOpen, setSidebarOpen }}
    >
      <div className="flex h-screen bg-background">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <SidebarComponent
            activeTab={activeTab}
            onTabChange={handleTabChange}
            unreadCount={badgeCount}
          />
        </div>

        {/* Mobile Sheet Sidebar */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-72 p-0">
            <SidebarComponent
              activeTab={activeTab}
              onTabChange={handleSidebarTabChange}
              unreadCount={badgeCount}
            />
          </SheetContent>
        </Sheet>

        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Mobile Header */}
          <MobileHeader 
            title={tabTitles[activeTab]} 
            onMenuClick={() => setSidebarOpen(true)}
            badgeCount={badgeCount}
            logout={logout}
          />

          {/* Desktop Header */}
          {HeaderComponent && (
            <div className="hidden md:block">
              <HeaderComponent
                title={tabTitles[activeTab]}
                unreadCount={badgeCount}
              />
            </div>
          )}

          <main className="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6">
            {children}
          </main>
        </div>

        {/* Mobile Bottom Nav */}
        <MobileNav 
          navItems={navItems}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          badgeCount={badgeCount}
        />
      </div>
    </ResponsiveLayoutContext.Provider>
  )
}

function MobileHeader({ 
  title, 
  onMenuClick, 
  badgeCount, 
  logout 
}: { 
  title: string; 
  onMenuClick: () => void; 
  badgeCount: number;
  logout: () => void;
}) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4 md:hidden">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onMenuClick} className="h-8 w-8">
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-foreground">ResGuard</span>
          <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">{title}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <Bell className="h-4 w-4" />
          {badgeCount > 0 && (
            <Badge variant="destructive" className="absolute -right-1 -top-1 h-4 w-4 p-0 text-[10px]">
              {badgeCount}
            </Badge>
          )}
        </Button>
        <Button variant="ghost" size="icon" onClick={logout} className="h-8 w-8">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}

function MobileNav({ 
  navItems, 
  activeTab, 
  onTabChange,
  badgeCount 
}: { 
  navItems: NavItem[]
  activeTab: string
  onTabChange: (tab: string) => void
  badgeCount: number
}) {
  const visibleItems = navItems.slice(0, 5)
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-border bg-card px-2 py-2 md:hidden">
      {visibleItems.map((item) => {
        const Icon = item.icon
        const isActive = activeTab === item.id
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              'flex flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-xs transition-colors',
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <div className="relative">
              <Icon className="h-5 w-5" />
              {item.badge && badgeCount > 0 && (
                <Badge variant="destructive" className="absolute -right-2 -top-1 h-4 w-4 p-0 text-[10px]">
                  {badgeCount}
                </Badge>
              )}
            </div>
            <span className="hidden xs:inline">{item.label.split(' ')[0]}</span>
          </button>
        )
      })}
    </div>
  )
}