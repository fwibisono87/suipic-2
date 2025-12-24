import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { swagger } from '@elysiajs/swagger'

const app = new Elysia()
    .use(cors())
    .use(swagger())
    .get('/', () => 'SuiPic API')
    .get('/health', () => ({ status: 'ok' }))
    .listen(4000)

console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
)