import type { APIRoute } from 'astro'
import { createSitePublishing } from '@/lib/site-publishing'

export const GET: APIRoute = () =>
  new Response(createSitePublishing().robots, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
