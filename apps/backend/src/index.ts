import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { swagger } from '@elysiajs/swagger'
import { bootstrap } from './db/bootstrap'

import { authPlugin } from './auth'

const app = new Elysia()
    .use(cors())
    .use(swagger())
    .use(authPlugin)
    .get('/', () => 'SuiPic API')
    .get('/health', () => ({ status: 'ok' }))
    .group('/api', (app) => 
        app.get('/protected', () => 'Access Granted', {
            requireAuth: ['admin']
        })
    )
    .listen(4000)

await bootstrap();

console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
)