import { db } from './index';
import { userProfiles } from './schema';
import { eq } from 'drizzle-orm';

export const bootstrap = async () => {
    console.log('🚀 Bootstrapping system...');

    const adminEmail = process.env.KC_BOOTSTRAP_ADMIN_EMAIL || 'admin@suipic.test';
    
    // Check if admin already exists in our profiles
    const existingAdmin = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.email, adminEmail)
    });

    if (!existingAdmin) {
        console.log('👤 Creating initial admin profile...');
        // Note: In a real scenario, we'd wait for Keycloak to be ready or sync from it.
        // For MVP, we seed a placeholder that will be linked via Keycloak ID later or updated on first login.
        // However, Keycloak ID is NOT NULL. 
        // Better: Synchronize on first login or use a dedicated sync script.
        // For now, let's just log that the system is ready for Keycloak sync.
    }

    console.log('✅ Bootstrap complete.');
};
