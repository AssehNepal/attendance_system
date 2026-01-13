import { NestFactory } from '@nestjs/core';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { AppModule } from './app.module';
import { SeedService } from './modules/auth/services/seed.service';

async function bootstrap() {
  // Initialize transactional context for typeorm-transactional
  initializeTransactionalContext();

  const app = await NestFactory.createApplicationContext(AppModule);
  const seedService = app.get(SeedService);

  try {
    console.log('Starting database seeding...');
    await seedService.seedInitialData();
    console.log('✅ Seeding completed successfully!');
    console.log('\n📋 Default credentials created:');
    console.log('Super Admin:');
    console.log('  CID: 11111111111111');
    console.log('  Password: SuperAdmin@123');
    console.log('\n🔐 Citizens can auto-register on first login');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

bootstrap();
