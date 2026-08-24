import { useEffect } from 'react'
import { getLandingCanonicalUrl, getLandingSectionUrl, LANDING_SEO } from './landingSeo'

const JSON_LD_ID = 'scrumban-landing-jsonld'

function upsertMeta(selector: string, create: () => HTMLMetaElement, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector)
  if (!element) {
    element = create()
    document.head.appendChild(element)
  }
  element.content = content
}

function upsertLink(rel: string, href: string) {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!element) {
    element = document.createElement('link')
    element.rel = rel
    document.head.appendChild(element)
  }
  element.href = href
}

function buildJsonLd() {
  const url = getLandingCanonicalUrl()
  const sections = Object.values(LANDING_SEO.sections)

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: LANDING_SEO.siteName,
        url,
        description: LANDING_SEO.description,
      },
      {
        '@type': 'WebPage',
        '@id': `${url}#webpage`,
        url,
        name: LANDING_SEO.title,
        description: LANDING_SEO.description,
        isPartOf: { '@id': `${url}#website` },
        about: {
          '@type': 'SoftwareApplication',
          name: LANDING_SEO.siteName,
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          description: LANDING_SEO.description,
        },
        hasPart: sections.map((section) => ({
          '@type': 'WebPageElement',
          name: section.name,
          description: section.description,
          url: getLandingSectionUrl(section.id),
        })),
      },
    ],
  }
}

/** Metadatos globales de la landing (`<head>` + JSON-LD por sección). */
export function LandingSeoHead() {
  useEffect(() => {
    const previousTitle = document.title
    const canonical = getLandingCanonicalUrl()

    document.title = LANDING_SEO.title

    upsertMeta(
      'meta[name="description"]',
      () => {
        const meta = document.createElement('meta')
        meta.name = 'description'
        return meta
      },
      LANDING_SEO.description
    )

    upsertMeta(
      'meta[name="keywords"]',
      () => {
        const meta = document.createElement('meta')
        meta.name = 'keywords'
        return meta
      },
      LANDING_SEO.keywords
    )

    upsertMeta(
      'meta[property="og:title"]',
      () => {
        const meta = document.createElement('meta')
        meta.setAttribute('property', 'og:title')
        return meta
      },
      LANDING_SEO.title
    )

    upsertMeta(
      'meta[property="og:description"]',
      () => {
        const meta = document.createElement('meta')
        meta.setAttribute('property', 'og:description')
        return meta
      },
      LANDING_SEO.description
    )

    upsertMeta(
      'meta[property="og:type"]',
      () => {
        const meta = document.createElement('meta')
        meta.setAttribute('property', 'og:type')
        return meta
      },
      'website'
    )

    upsertMeta(
      'meta[property="og:url"]',
      () => {
        const meta = document.createElement('meta')
        meta.setAttribute('property', 'og:url')
        return meta
      },
      canonical
    )

    upsertMeta(
      'meta[name="twitter:card"]',
      () => {
        const meta = document.createElement('meta')
        meta.name = 'twitter:card'
        return meta
      },
      'summary_large_image'
    )

    upsertMeta(
      'meta[name="twitter:title"]',
      () => {
        const meta = document.createElement('meta')
        meta.name = 'twitter:title'
        return meta
      },
      LANDING_SEO.title
    )

    upsertMeta(
      'meta[name="twitter:description"]',
      () => {
        const meta = document.createElement('meta')
        meta.name = 'twitter:description'
        return meta
      },
      LANDING_SEO.description
    )

    upsertLink('canonical', canonical)

    let jsonLd = document.getElementById(JSON_LD_ID) as HTMLScriptElement | null
    if (!jsonLd) {
      jsonLd = document.createElement('script')
      jsonLd.id = JSON_LD_ID
      jsonLd.type = 'application/ld+json'
      document.head.appendChild(jsonLd)
    }
    jsonLd.textContent = JSON.stringify(buildJsonLd())

    return () => {
      document.title = previousTitle
    }
  }, [])

  return null
}

/** Metadescripción accesible por sección (complementa el JSON-LD). */
export function LandingSectionSeo({ description }: { description: string }) {
  return <p className="sr-only">{description}</p>
}
