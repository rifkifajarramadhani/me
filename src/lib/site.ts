import { withBase } from '@/lib/with-base'

export const name = 'Rifki Fajar Ramadhani'
export const shortName = 'Rifki'
export const alternateSiteNames = [shortName, 'rifkiramadhani.my.id'] as const
export const jobTitle = 'Full-Stack Engineer'
export const defaultTitle = `${name} | ${jobTitle} in Indonesia`
export const defaultDescription =
  'Rifki Fajar Ramadhani is a full-stack software engineer based in Indonesia, building web applications since 2018 with TypeScript, Golang, PHP, React, and Vue.'

export const siteUrl = import.meta.env.SITE
export const homePageUrl = new URL(withBase(), siteUrl).href
export const defaultOgImage = withBase('og-image.png')
export const defaultTwitterImage = withBase('twitter-image.png')
export const defaultSocialImageAlt = `${name} — ${jobTitle}`

export const socialLinks = {
  github: 'https://github.com/rifkifajarramadhani',
  linkedin: 'https://www.linkedin.com/in/rifkifajarramadhani/',
  email: 'mailto:rifkid56@gmail.com',
}

export const pageSeo = {
  home: {
    title: defaultTitle,
    description: defaultDescription,
  },
  about: {
    title: `About | ${shortName}`,
    description:
      'About Rifki Fajar Ramadhani, a full-stack web developer based in Indonesia who has been building web applications since 2018.',
  },
  work: {
    title: `Work | ${shortName}`,
    description:
      'Selected portfolio projects by Rifki Fajar Ramadhani — full-stack web applications including e-commerce, lifestyle, and museum ticketing platforms.',
  },
} as const
