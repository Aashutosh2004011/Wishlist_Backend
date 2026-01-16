import { db } from './index.js';
import { deals, users } from './schema.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const sampleDeals = [
  {
    title: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
    description: 'Industry-leading noise cancellation with premium sound quality. 30-hour battery life and multipoint connection.',
    originalPrice: '399.99',
    currentPrice: '279.99',
    discountPercentage: 30,
    imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800',
    merchantName: 'Amazon',
    merchantUrl: 'https://amazon.com',
    category: 'Electronics',
    isActive: true,
    isExpired: false,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
  {
    title: 'Apple MacBook Air M2 13-inch',
    description: 'Supercharged by M2 chip. 8-core CPU, 10-core GPU, 16GB RAM, 512GB SSD. Stunning Retina display.',
    originalPrice: '1499.99',
    currentPrice: '1099.99',
    discountPercentage: 27,
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',
    merchantName: 'Best Buy',
    merchantUrl: 'https://bestbuy.com',
    category: 'Electronics',
    isActive: true,
    isExpired: false,
    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
  },
  {
    title: 'Nike Air Max 270 Running Shoes',
    description: 'Comfortable cushioning meets bold style. Max Air unit provides exceptional impact absorption.',
    originalPrice: '150.00',
    currentPrice: '89.99',
    discountPercentage: 40,
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
    merchantName: 'Nike',
    merchantUrl: 'https://nike.com',
    category: 'Fashion',
    isActive: true,
    isExpired: false,
    expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
  },
  {
    title: 'Samsung 65" QLED 4K Smart TV',
    description: 'Quantum Dot technology delivers stunning color and brightness. Smart TV with built-in Alexa.',
    originalPrice: '1299.99',
    currentPrice: '899.99',
    discountPercentage: 31,
    imageUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800',
    merchantName: 'Target',
    merchantUrl: 'https://target.com',
    category: 'Electronics',
    isActive: true,
    isExpired: false,
    expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
  },
  {
    title: 'Dyson V15 Detect Cordless Vacuum',
    description: 'Powerful suction with laser detect technology. Up to 60 minutes of runtime.',
    originalPrice: '749.99',
    currentPrice: '549.99',
    discountPercentage: 27,
    imageUrl: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800',
    merchantName: 'Dyson',
    merchantUrl: 'https://dyson.com',
    category: 'Home & Garden',
    isActive: true,
    isExpired: false,
    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  },
  {
    title: 'Instant Pot Duo 7-in-1 Electric Pressure Cooker',
    description: '6 Quart capacity. Pressure cooker, slow cooker, rice cooker, steamer, and more.',
    originalPrice: '119.99',
    currentPrice: '69.99',
    discountPercentage: 42,
    imageUrl: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=800',
    merchantName: 'Walmart',
    merchantUrl: 'https://walmart.com',
    category: 'Home & Kitchen',
    isActive: false,
    isExpired: false,
    expiresAt: null,
  },
  {
    title: 'Levi\'s 501 Original Fit Jeans',
    description: 'Classic straight fit jeans. Authentic style that never goes out of fashion.',
    originalPrice: '69.99',
    currentPrice: '39.99',
    discountPercentage: 43,
    imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800',
    merchantName: 'Levi\'s',
    merchantUrl: 'https://levis.com',
    category: 'Fashion',
    isActive: true,
    isExpired: true,
    expiresAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    title: 'KitchenAid Stand Mixer',
    description: '5 Quart capacity with 10 speeds. Includes dough hook, flat beater, and wire whip.',
    originalPrice: '449.99',
    currentPrice: '299.99',
    discountPercentage: 33,
    imageUrl: 'https://images.unsplash.com/photo-1578269174936-2709b6aeb913?w=800',
    merchantName: 'Williams Sonoma',
    merchantUrl: 'https://williams-sonoma.com',
    category: 'Home & Kitchen',
    isActive: true,
    isExpired: false,
    expiresAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
  },
];

const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...\n');

    // Step 1: Create demo user in Supabase Auth
    console.log('1. Creating demo user in Supabase Auth...');
    const demoEmail = 'test@buzdealz.com';
    const demoPassword = 'test123456';

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users.find(u => u.email === demoEmail);

    if (existingUser) {
      console.log(`   ℹ Demo user already exists: ${demoEmail}`);
      console.log(`   ✓ User ID: ${existingUser.id}`);

      // Update password to ensure it's correct
      console.log('   🔄 Updating user password...');
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        { password: demoPassword }
      );

      if (updateError) {
        console.error('   ⚠️  Failed to update password:', updateError.message);
      } else {
        console.log('   ✓ Password updated successfully');
      }
    } else {
      const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: demoEmail,
        password: demoPassword,
        email_confirm: true,
        user_metadata: {
          name: 'Test User'
        }
      });

      if (authError) {
        console.error('   ✗ Failed to create demo user:', authError.message);
        throw authError;
      }

      console.log(`   ✓ Created demo user: ${demoEmail}`);
      console.log(`   ✓ User ID: ${newUser.user?.id}`);
    }

    // Step 2: Seed deals
    console.log('\n2. Inserting sample deals...');
    const insertedDeals = await db.insert(deals).values(sampleDeals).returning();
    console.log(`   ✓ Inserted ${insertedDeals.length} sample deals`);

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('✓ Database seeding completed successfully!');
    console.log('='.repeat(50));
    console.log('\nDemo Account Credentials:');
    console.log('  Email:    test@buzdealz.com');
    console.log('  Password: test123456');
    console.log('\nSample Data:');
    console.log(`  - ${insertedDeals.length} deals`);
    console.log('\nYou can now:');
    console.log('  1. Start the backend: npm run dev');
    console.log('  2. Start the frontend: cd ../frontend && npm run dev');
    console.log('  3. Login with the demo account credentials');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('\n✗ Database seeding failed!');
    console.error(error);
    process.exit(1);
  }
};

seedDatabase();
