import nextra from 'nextra'
import {withAsktro} from "@asktro/nextra/dist/plugin.mjs"

const withNextra = nextra({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.tsx',
  latex: true,
  flexsearch: {
    codeblocks: false
  },
  defaultShowCopyCode: true
})

export default withAsktro({
  // eslint-disable-next-line no-undef
  apiKey: process.env.ASKTRO_UPLOAD_API_KEY
})(withNextra({
  reactStrictMode: true,
  eslint: {
    // Eslint behaves weirdly in this monorepo.
    ignoreDuringBuilds: true
  },
  redirects: () => [
    {
      source: '/docs/guide/:slug(typescript|latex|tailwind-css|mermaid)',
      destination: '/docs/guide/advanced/:slug',
      permanent: true
    },
    {
      source: '/docs/docs-theme/built-ins/:slug(callout|steps|tabs)',
      destination: '/docs/guide/built-ins/:slug',
      permanent: true
    }
  ],
  webpack(config) {
    const allowedSvgRegex = /components\/icons\/.+\.svg$/

    const fileLoaderRule = config.module.rules.find(rule =>
      rule.test?.test('.svg')
    )
    fileLoaderRule.exclude = allowedSvgRegex

    config.module.rules.push({
      test: allowedSvgRegex,
      use: ['@svgr/webpack']
    })
    return config
  }
}))
