import {
  type SimpleIcon,
  siAmazonaws,
  siBootstrap,
  siCss3,
  siDocker,
  siGo,
  siHtml5,
  siJavascript,
  siMongodb,
  siMysql,
  siNestjs,
  siNodedotjs,
  siPhp,
  siPostgresql,
  siReact,
  siRedis,
  siSass,
  siTailwindcss,
  siTypescript,
  siVuedotjs,
} from 'simple-icons'

const shadcnPath =
  'M22.219 11.784 11.784 22.219c-.407.407-.407 1.068 0 1.476.407.407 1.068.407 1.476 0L23.695 13.26c.407-.408.407-1.069 0-1.476-.408-.407-1.069-.407-1.476 0ZM20.132.305.305 20.132c-.407.407-.407 1.068 0 1.476.408.407 1.069.407 1.476 0L21.608 1.781c.407-.407.407-1.068 0-1.476-.408-.407-1.069-.407-1.476 0Z'

const shadcnIcon: SimpleIcon = {
  title: 'shadcn/ui',
  slug: 'shadcnui',
  hex: '000000',
  source: 'https://ui.shadcn.com/',
  path: shadcnPath,
  svg: `<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="${shadcnPath}"/></svg>`,
}

const SKILLS: { field: string; skills: { skill: string; icon: SimpleIcon }[] }[] =
  [
    {
      field: 'Front-End',
      skills: [
        { skill: 'HTML5', icon: siHtml5 },
        { skill: 'CSS3', icon: siCss3 },
        { skill: 'JavaScript', icon: siJavascript },
        { skill: 'TypeScript', icon: siTypescript },
        { skill: 'React', icon: siReact },
        { skill: 'Vue', icon: siVuedotjs },
        { skill: 'ShadCN', icon: shadcnIcon },
        { skill: 'SASS', icon: siSass },
        { skill: 'Tailwind', icon: siTailwindcss },
        { skill: 'Bootstrap', icon: siBootstrap },
      ],
    },
    {
      field: 'Back-End',
      skills: [
        { skill: 'Golang', icon: siGo },
        { skill: 'NodeJS', icon: siNodedotjs },
        { skill: 'PHP', icon: siPhp },
        { skill: 'NestJS', icon: siNestjs },
        { skill: 'AWS', icon: siAmazonaws },
        { skill: 'Redis', icon: siRedis },
        { skill: 'PostgreSQL', icon: siPostgresql },
        { skill: 'MongoDB', icon: siMongodb },
        { skill: 'MySQL', icon: siMysql },
        { skill: 'Docker', icon: siDocker },
      ],
    },
  ]

export default SKILLS
