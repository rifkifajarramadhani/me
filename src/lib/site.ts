import { withBase } from '@/lib/with-base'

export const name = 'Rifki Fajar Ramadhani'
export const shortName = 'Rifki'
export const jobTitle = 'Full-Stack Engineer'
export const defaultTitle = `${shortName} | ${jobTitle}`
export const defaultDescription =
  'Full-stack software engineer based in Indonesia with 6 years of experience building web applications with TypeScript, Golang, PHP, React, Vue, and Tailwind CSS.'

export const siteUrl = import.meta.env.SITE
export const homePageUrl = new URL(withBase(), siteUrl).href
export const defaultOgImage = withBase('og-image.png')

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
      'Full-stack web developer with 6 years of experience in TypeScript, Golang, PHP, React, Vue, and Tailwind CSS. Skilled in scalable architectures and seamless user experiences.',
  },
  work: {
    title: `Work | ${shortName}`,
    description:
      'Selected portfolio projects by Rifki Fajar Ramadhani — full-stack web applications including e-commerce, lifestyle, and museum ticketing platforms.',
  },
} as const
