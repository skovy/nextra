import React, { useState, useEffect, useMemo } from 'react'
import cn from 'classnames'
import Slugger from 'github-slugger'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { Heading } from 'nextra'

import { useActiveAnchor } from './misc/active-anchor'
import { getFSRoute } from './utils/get-fs-route'
import useMenuContext from './utils/menu-context'
import Search from './search'
import Flexsearch from './flexsearch'
import { useConfig } from './config'
import getHeadingText from './utils/get-heading-text'
import { Item, PageItem } from './utils/normalize-pages'
import LocaleSwitch from './locale-switch'
import ThemeSwitch from './theme-switch'
import ArrowRight from './icons/arrow-right'

const TreeState: Record<string, boolean> = {}

interface FolderProps {
  item: PageItem | Item
  anchors: string[]
}

function Folder({ item, anchors }: FolderProps) {
  const { asPath, locale } = useRouter()
  const routeOriginal = getFSRoute(asPath, locale)
  const route = routeOriginal.split('#')[0]
  const active = route === item.route + '/' || route + '/' === item.route + '/'
  const { defaultMenuCollapsed } = useMenuContext()
  const open = TreeState[item.route] ?? !defaultMenuCollapsed
  const rerender = useState({})[1]

  useEffect(() => {
    if (active) {
      TreeState[item.route] = true
    }
  }, [active])

  const link = (
    <a
      onClick={() => {
        if (item.withIndexPage) {
          // If it's focused, we toggle it. Otherwise always open it.
          TreeState[item.route] = active ? !open : true
          rerender({})
          return
        }
        if (active) return
        TreeState[item.route] = !open
        rerender({})
      }}
    >
      <span className="flex items-center justify-between gap-2">
        {item.title}
        <ArrowRight
          height="1em"
          className={cn(open ? 'rotate-90' : '', 'transition-transform')}
        />
      </span>
    </a>
  )

  return (
    <li className={cn({ open, active })}>
      {item.withIndexPage ? <Link href={item.route}>{link}</Link> : link}
      <div
        style={{
          display: open ? 'initial' : 'none'
        }}
      >
        {Array.isArray(item.children) && (
          <Menu
            directories={item.children}
            base={item.route}
            anchors={anchors}
          />
        )}
      </div>
    </li>
  )
}
interface FileProps {
  item: PageItem | Item
  anchors: string[]
}
function File({ item, anchors }: FileProps) {
  const { asPath, locale } = useRouter()
  const route = getFSRoute(asPath, locale)
  const active = route === item.route + '/' || route + '/' === item.route + '/'
  const slugger = new Slugger()
  const activeAnchor = useActiveAnchor()

  const title = item.title
  // if (item.title.startsWith('> ')) {
  // title = title.substr(2)
  if (anchors && anchors.length) {
    if (active) {
      let activeIndex = 0
      const anchorInfo = anchors.map((anchor, i) => {
        const text = anchor
        const slug = slugger.slug(text)
        if (activeAnchor[slug] && activeAnchor[slug].isActive) {
          activeIndex = i
        }
        return { text, slug }
      })
      return (
        <li className={active ? 'active' : ''}>
          <Link href={(item as PageItem).href || item.route}>
            <a
              {...((item as PageItem).newWindow
                ? { target: '_blank', rel: 'noopener noreferrer' }
                : {})}
            >
              {title}
            </a>
          </Link>
          <ul>
            {anchors.map((_, i) => {
              const { slug, text } = anchorInfo[i]
              const isActive = i === activeIndex

              return (
                <li key={`a-${slug}`}>
                  <a
                    href={'#' + slug}
                    className={isActive ? 'active-anchor' : ''}
                  >
                    <span className="flex text-sm">
                      <span className="opacity-25">#</span>
                      <span className="mr-2"></span>
                      <span className="inline-block">{text}</span>
                    </span>
                  </a>
                </li>
              )
            })}
          </ul>
        </li>
      )
    }
  }

  return (
    <li className={active ? 'active' : ''}>
      <Link href={(item as PageItem).href || item.route}>
        <a
          {...((item as PageItem).newWindow
            ? { target: '_blank', rel: 'noopener noreferrer' }
            : {})}
        >
          {title}
        </a>
      </Link>
    </li>
  )
}
interface MenuProps {
  directories: PageItem[] | Item[]
  anchors: string[]
  base?: string
}
function Menu({ directories, anchors }: MenuProps) {
  return (
    <ul>
      {directories.map(item => {
        if (item.children) {
          return <Folder key={item.name} item={item} anchors={anchors} />
        }
        return <File key={item.name} item={item} anchors={anchors} />
      })}
    </ul>
  )
}

interface SideBarProps {
  directories: PageItem[]
  flatDirectories: Item[]
  fullDirectories: Item[]
  asPopover?: boolean
  headings?: Heading[]
  isRTL?: boolean
}

const emptyHeading: any[] = []
export default function Sidebar({
  directories,
  flatDirectories,
  fullDirectories,
  asPopover = false,
  headings = emptyHeading
}: SideBarProps) {
  const config = useConfig()
  const anchors = useMemo(
    () =>
      headings
        .filter(v => v.children && v.depth === 2 && v.type === 'heading')
        .map(v => getHeadingText(v))
        .filter(Boolean),
    [headings]
  )
  const { menu } = useMenuContext()
  useEffect(() => {
    if (menu) {
      document.body.classList.add('overflow-hidden', 'md:overflow-auto')
    } else {
      document.body.classList.remove('overflow-hidden', 'md:overflow-auto')
    }
  }, [menu])

  return (
    <aside
      className={cn(
        'nextra-sidebar-container fixed flex-shrink-0 w-full md:w-64 md:sticky z-[15] top-16 self-start overflow-y-auto h-[calc(var(--vh)-4rem)] transform-none',
        asPopover ? 'md:hidden' : 'md:block',
        { open: menu }
      )}
    >
      <div className="nextra-sidebar select-none w-full h-full md:h-auto pl-[calc(env(safe-area-inset-left)-1.5rem)]">
        <div className="p-4 min-h-[calc(var(--vh)-4rem-61px)]">
          <div className="mb-4 block md:hidden">
            {config.customSearch ||
              (config.search ? (
                config.unstable_flexsearch ? (
                  <Flexsearch />
                ) : (
                  <Search directories={flatDirectories} />
                )
              ) : null)}
          </div>
          <div className="hidden md:block">
            <Menu
              directories={directories}
              anchors={
                // When the viewport size is larger than `md`, hide the anchors in
                // the sidebar when `floatTOC` is enabled.
                config.floatTOC ? [] : anchors
              }
            />
          </div>
          <div className="md:hidden">
            <Menu
              directories={fullDirectories}
              anchors={
                // Always show the anchor links on mobile (`md`).
                anchors
              }
            />
          </div>
        </div>

        <div className="sticky bottom-0 mx-4 border-t dark:border-prime-100 dark:border-opacity-10 shadow-[0_-12px_12px_white] dark:shadow-none">
          <div
            className="bg-white dark:bg-dark py-4 flex gap-1"
            style={{
              paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)'
            }}
          >
            {config.i18n ? (
              <div className="flex-1 relative">
                <LocaleSwitch options={config.i18n} />
              </div>
            ) : null}
            {config.darkMode ? (
              <>
                <div
                  className={cn('relative md:hidden', {
                    locale: config.i18n,
                    'flex-1': !config.i18n
                  })}
                >
                  <ThemeSwitch lite={false} />
                </div>
                <div
                  className={cn(
                    'relative hidden md:block',
                    {
                      locale: config.i18n
                    },
                    config.i18n ? 'grow-0' : 'flex-1'
                  )}
                >
                  <ThemeSwitch lite={!!config.i18n} />
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </aside>
  )
}
