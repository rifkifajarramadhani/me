import type { APIRoute } from 'astro'
import { createSitePublishing } from '@/lib/site-publishing'

export const GET: APIRoute = () =>
  Response.json(createSitePublishing().manifest, {
    headers: { 'Content-Type': 'application/manifest+json' },
  })
