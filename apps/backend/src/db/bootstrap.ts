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
        
        // Seed the admin user. 
        // Note: We generate a random UUID for keycloakId. In a real production setup, 
        // we might ideally query Keycloak to get the real ID, or this user will be 
        // updated with the real Keycloak ID upon first login if we implement account linking logic.
        // For SRS compliance, we ensure an admin record exists.
        await db.insert(userProfiles).values({
            email: adminEmail,
            displayName: 'System Admin',
            role: 'admin',
            keycloakId: crypto.randomUUID(), // Placeholder ID
            isActive: true
        });
        
        console.log(`✨ Admin seeded: ${adminEmail}`);
    }

    console.log('✅ Bootstrap complete.');
};
