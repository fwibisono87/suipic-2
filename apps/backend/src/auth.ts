import { Elysia } from 'elysia';
import { jwt } from '@elysiajs/jwt';

export const authPlugin = new Elysia({ name: 'auth' })
    .use(
        jwt({
            name: 'jwt',
            secret: process.env.JWT_SECRET || 'change-me',
        })
    )
    .derive(async ({ jwt, headers: { authorization } }) => {
        if (!authorization?.startsWith('Bearer ')) {
            return {
                user: null,
            };
        }

        const token = authorization.slice(7);
        const payload = await jwt.verify(token);

        if (!payload) {
            return {
                user: null,
            };
        }

        return {
            user: {
                id: payload.sub as string,
                roles: ((payload as any).realm_access?.roles as string[]) || [],
                email: payload.email as string,
            },
        };
    })
    .macro(({ onBeforeHandle }) => ({
        requireAuth(roles?: string[]) {
            onBeforeHandle(({ user, set }: { user: any; set: any }) => {
                if (!user) {
                    set.status = 401;
                    return 'Unauthorized';
                }

                if (roles && roles.length > 0) {
                    const hasRole = roles.some((role) => user.roles.includes(role));
                    if (!hasRole) {
                        set.status = 403;
                        return 'Forbidden';
                    }
                }
            });
        },
    }));
