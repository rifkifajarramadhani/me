import {
  type SimpleIcon,
  siBootstrap,
  siCss,
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
  siShadcnui,
  siSass,
  siTailwindcss,
  siTypescript,
  siVuedotjs,
} from 'simple-icons'

const SKILLS: { field: string; skills: { skill: string; icon: SimpleIcon }[] }[] =
  [
    {
      field: 'Front-End',
      skills: [
        { skill: 'HTML5', icon: siHtml5 },
        { skill: 'CSS3', icon: siCss },
        { skill: 'JavaScript', icon: siJavascript },
        { skill: 'TypeScript', icon: siTypescript },
        { skill: 'React', icon: siReact },
        { skill: 'Vue', icon: siVuedotjs },
        { skill: 'ShadCN', icon: siShadcnui },
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
        { skill: 'Redis', icon: siRedis },
        { skill: 'PostgreSQL', icon: siPostgresql },
        { skill: 'MongoDB', icon: siMongodb },
        { skill: 'MySQL', icon: siMysql },
        { skill: 'Docker', icon: siDocker },
      ],
    },
  ]

export default SKILLS
