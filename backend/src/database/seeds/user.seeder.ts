import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { DataSource } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Auth } from '../../auths/entities/auth.entity';
import { UserType } from '../../users/enums/user-type.enum';

const env = process.env.NODE_ENV || '';
dotenv.config({
  path: path.resolve(process.cwd(), env ? `.env.${env}` : '.env'),
});

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'power_genix',
  entities: [User, Auth],
  synchronize: false,
});

async function seed() {
  await dataSource.initialize();

  const email = process.env.SEED_USER_EMAIL || 'admin@powergenix.com';
  const password = process.env.SEED_USER_PASSWORD || 'Admin@1234';

  const userRepo = dataSource.getRepository(User);
  const authRepo = dataSource.getRepository(Auth);

  const existing = await userRepo.findOne({ where: { email } });

  if (existing) {
    console.log(`User already exists: ${email}`);
    await dataSource.destroy();
    return;
  }

  const user = userRepo.create({
    firstName: 'Power',
    lastName: 'Genix',
    email,
    type: UserType.USER,
  });
  const savedUser = await userRepo.save(user);

  const hashed = await bcrypt.hash(password, 10);
  const auth = authRepo.create({
    id: savedUser.id,
    email,
    password: hashed,
    user: savedUser,
  });
  await authRepo.save(auth);

  console.log(`User seeded: ${email} / ${password}`);
  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('Seeder failed:', err);
  process.exit(1);
});
