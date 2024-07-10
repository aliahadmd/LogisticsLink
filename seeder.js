import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Note from './models/Note.js';
import sequelize from './config/database.js';

const seedDatabase = async () => {
  await sequelize.sync({ force: true }); // This will drop and recreate the tables

  const users = [];
  const notes = [];

  // Create 1000 users
  for (let i = 0; i < 1000; i++) {
    const user = {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      phone_number: faker.phone.number(),
      vat: faker.finance.accountNumber(),
      address: faker.location.streetAddress(),
      password: await bcrypt.hash('password123', 10), // All users have the same password for simplicity
      role: faker.helpers.arrayElement(['customer', 'subscriber', 'admin']),
      isVerified: faker.datatype.boolean(),
      stripeCustomerId: faker.string.alphanumeric(10)
    };
    users.push(user);
  }

  // Bulk create users
  const createdUsers = await User.bulkCreate(users);

  // Create 1000 notes
  for (let i = 0; i < 1000; i++) {
    const note = {
      logo: faker.image.url(),
      title: faker.lorem.sentence(),
      kmPerMonth: faker.number.int({ min: 100, max: 10000 }),
      price: faker.number.int({ min: 1000, max: 100000 }),
      truckType: faker.vehicle.type(),
      description: faker.lorem.paragraph(),
      userId: createdUsers[faker.number.int({ min: 0, max: 999 })].id
    };
    notes.push(note);
  }

  // Bulk create notes
  await Note.bulkCreate(notes);

  console.log('Database seeded successfully!');
};

seedDatabase().catch(console.error);