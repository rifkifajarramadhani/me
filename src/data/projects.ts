const PROJECTS: {
  name: string
  description: string
  previewImage: string
  repoUrl: string
  liveLink: string
  featured?: boolean
  tags?: string[]
}[] = [
  {
    name: 'Typefn',
    featured: true,
    tags: ['TanStack Start', 'Go', 'PostgreSQL', 'Tree-sitter'],
    description:
      'A Monkeytype-style typing trainer for software engineers, built on real functions from permissively licensed open-source repositories. Tree-sitter extracts the corpus across TypeScript, JavaScript, Go, PHP, and Python, and the trainer preserves auto-indent while marking errors without force-correcting. Timed runs feed history, leaderboards, and adaptive weak-symbol drills.',
    liveLink: 'https://www.typefn.dev/',
    previewImage: 'typefn/1.png',
    repoUrl: '#',
  },
  {
    name: 'Sportsmans Warehouse',
    featured: true,
    tags: ['Vue', 'Node.js', 'Tailwind', 'Payment Gateway'],
    description: `This application is designed to enhance your outdoor shopping experience at Sportsman’s Warehouse. The main feature allows customers to easily browse and purchase a wide range of outdoor gear, including fishing, hunting, and camping equipment. With a secure payment gateway, you can confidently process transactions and manage your orders seamlessly. Whether you're looking for the latest gear or expert advice, our app makes it simple to gear up for your next adventure with just a few taps.`,
    liveLink: 'https://www.sportsmanswarehouse.co.za/',
    previewImage: 'sportsmans-warehouse/1.png',
    repoUrl: '#',
  },
  {
    name: 'Outdoor Warehouse',
    featured: false,
    tags: ['Vue', 'Node.js', 'Tailwind', 'E-commerce'],
    description: `This app is designed to help customers easily shop for outdoor gear at Sportsman’s Warehouse. The main feature allows users to browse a wide selection of equipment for fishing, hunting, camping, and more. With a secure payment gateway, you can effortlessly order and pay for your items, ensuring a smooth transaction process. Whether you’re gearing up for your next adventure or seeking expert advice, our app simplifies your shopping experience, making it easier than ever to get outdoors!`,
    liveLink: 'https://www.outdoorwarehouse.co.za/',
    previewImage: 'outdoor-warehouse/1.png',
    repoUrl: '#',
  },
  {
    name: 'Shelflife',
    featured: false,
    tags: ['Vue', 'Node.js', 'Streetwear', 'E-commerce'],
    description:
      'A premium streetwear and sneaker storefront for one of South Africa\'s most influential lifestyle retailers. Shoppers browse new drops, explore curated collections, and check out through a polished e-commerce experience built for hype-driven product launches and everyday style.',
    liveLink: 'https://www.shelflife.co.za/',
    previewImage: 'shelflife/1.png',
    repoUrl: '#',
  },
  {
    name: 'Museum Macan',
    featured: true,
    tags: ['Vue', 'Node.js', 'Ticketing', 'Cultural'],
    description:
      'The digital front door for Museum MACAN — Indonesia\'s leading museum of modern and contemporary art. Visitors explore exhibitions and programs, book tickets, and plan their visit through a refined, content-rich experience that mirrors the museum\'s curatorial quality.',
    liveLink: 'https://www.museummacan.org/',
    previewImage: 'museum-macan/1.png',
    repoUrl: '#',
  },
  {
    name: 'Woermann Fresh',
    featured: false,
    tags: ['Vue', 'Node.js', 'E-commerce', 'Grocery'],
    description:
      'An online grocery platform for Woermann Fresh supermarkets in Namibia. Customers browse fresh produce, butchery, bakery, and household essentials, place orders for same-day delivery, and track purchases from store to doorstep — all through a streamlined storefront built for everyday shopping at scale.',
    liveLink: 'https://shop.woermannfresh.com/',
    previewImage: 'woermann-fresh/1.png',
    repoUrl: '#',
  },
  {
    name: 'Hey Halfway',
    featured: true,
    tags: ['Vue', 'Node.js', 'Automotive', 'Search'],
    description:
      'A nationwide used-car marketplace for the Halfway Group, one of South Africa\'s largest independent dealer networks. Drivers search, save, and compare vehicles across 22 dealerships, calculate finance instalments, and connect with sales teams — turning a fragmented dealer network into a single, searchable buying experience.',
    liveLink: 'https://www.heyhalfway.com/',
    previewImage: 'hey-halfway/1.png',
    repoUrl: '#',
  },
  {
    name: 'Comprimage',
    featured: true,
    tags: ['Astro', 'TypeScript', 'WebAssembly', 'PWA'],
    description:
      'A privacy-first image toolkit that runs entirely in the browser. Resize, compress, and convert images with modern codecs like MozJPEG, WebP, AVIF, and JPEG XL — no uploads, no server processing. Progressive resizing and auto-quality tuning deliver dramatically smaller files while keeping visuals sharp.',
    liveLink: 'https://comprimage.my.id/',
    previewImage: 'comprimage/1.png',
    repoUrl: '#',
  },
  {
    name: 'AutoWealth',
    tags: ['PHP', 'Bootstrap', 'CSS'],
    description:
      'An institutional-grade robo-advisor for Singapore investors — globally diversified, index-tracking portfolios across CPF, SRS, and cash accounts.',
    liveLink: 'https://www.autowealth.com.sg/',
    previewImage: '',
    repoUrl: '#',
  },
]

export default PROJECTS
