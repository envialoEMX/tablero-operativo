/** Escala de ritmo vertical de la landing — una sola sección usa `climax`. */
export const SECTION_SPACING = {
  tight: 'py-12 md:py-16',
  standard: 'py-16 md:py-20',
  hero: 'pt-20 pb-16 md:pt-28 md:pb-20',
  climax: 'py-24 md:py-32',
} as const

export type SectionSpacing = keyof typeof SECTION_SPACING
