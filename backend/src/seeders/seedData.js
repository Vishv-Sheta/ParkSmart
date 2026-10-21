const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Location = require('../models/Location');
const ParkingSlot = require('../models/ParkingSlot');
const Reservation = require('../models/Reservation');

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Helper function to generate random coordinates within a radius
const generateNearbyCoordinates = (centerLat, centerLon, radiusKm) => {
  const radiusInDegrees = radiusKm / 111.32;
  const u = Math.random();
  const v = Math.random();
  const w = radiusInDegrees * Math.sqrt(u);
  const t = 2 * Math.PI * v;
  const x = w * Math.cos(t);
  const y = w * Math.sin(t);
  
  return {
    latitude: centerLat + x,
    longitude: centerLon + y
  };
};

const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Location.deleteMany({});
    await ParkingSlot.deleteMany({});
    await Reservation.deleteMany({});

    console.log('Cleared existing data');

    // Create sample users
    const users = await User.create([
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phone: '+1234567890',
        licensePlate: 'ABC123',
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'password123',
        phone: '+1234567891',
        licensePlate: 'XYZ789',
      },
      {
        name: 'Admin User',
        email: 'admin@smartpark.com',
        password: 'admin123',
        phone: '+1234567892',
        licensePlate: 'ADMIN1',
        role: 'admin',
      },
    ]);

    console.log(`Created ${users.length} users`);

    // Create sample locations (Mysuru, Karnataka area)
    const locations = await Location.create([
      {
        name: 'Mysore Palace Parking',
        area: 'Chamrajpura',
        address: 'Sayyaji Rao Road, Agrahara, Chamrajpura, Mysuru, Karnataka 570001',
        coordinates: {
          type: 'Point',
          coordinates: [76.6552, 12.3052],
        },
        totalSlots: 100,
        availableSlots: 85,
        floors: 2,
        operatingHours: {
          open: '06:00',
          close: '22:00',
        },
      },
      {
        name: 'Devaraja Market Parking',
        area: 'Devaraja Mohalla',
        address: 'Devaraja Mohalla, Mysuru, Karnataka 570001',
        coordinates: {
          type: 'Point',
          coordinates: [76.6544, 12.3089],
        },
        totalSlots: 50,
        availableSlots: 30,
        floors: 1,
        operatingHours: {
          open: '07:00',
          close: '21:00',
        },
      },
      {
        name: 'Mall of Mysore Parking',
        area: 'MG Road',
        address: 'MG Road, Mysuru, Karnataka 570001',
        coordinates: {
          type: 'Point',
          coordinates: [76.6394, 12.2958],
        },
        totalSlots: 200,
        availableSlots: 150,
        floors: 3,
        operatingHours: {
          open: '09:00',
          close: '23:00',
        },
      },
      {
        name: 'Railway Station Parking',
        area: 'Railway Station',
        address: 'Irwin Road, Mysuru, Karnataka 570001',
        coordinates: {
          type: 'Point',
          coordinates: [76.6394, 12.3079],
        },
        totalSlots: 80,
        availableSlots: 60,
        floors: 1,
        operatingHours: {
          open: '00:00',
          close: '23:59',
        },
      },
      {
        name: 'Chamundi Hills Base Parking',
        area: 'Chamundi Hills',
        address: 'Chamundi Hill Road, Mysuru, Karnataka 570010',
        coordinates: {
          type: 'Point',
          coordinates: [76.6726, 12.2724],
        },
        totalSlots: 150,
        availableSlots: 120,
        floors: 1,
        operatingHours: {
          open: '06:00',
          close: '20:00',
        },
      },
    ]);

    console.log(`Created ${locations.length} locations`);

    // Create parking slots for each location
    const slotTypes = ['regular', 'compact', 'large', 'handicap', 'electric'];
    const slotStatuses = ['available', 'occupied', 'reserved'];

    for (const location of locations) {
      const slots = [];
      const slotsPerFloor = Math.ceil(location.totalSlots / location.floors);

      for (let floor = 1; floor <= location.floors; floor++) {
        for (let i = 1; i <= slotsPerFloor; i++) {
          if (slots.length >= location.totalSlots) break;

          const slotNumber = `${floor}${String.fromCharCode(64 + Math.ceil(i / 10))}${(i % 10) || 10}`;
          const type = slotTypes[Math.floor(Math.random() * slotTypes.length)];
          
          // Determine status based on available slots
          let status = 'available';
          const occupiedCount = location.totalSlots - location.availableSlots;
          const currentOccupied = slots.filter(s => s.status !== 'available').length;
          
          if (currentOccupied < occupiedCount) {
            status = slotStatuses[Math.floor(Math.random() * 2) + 1];
          }

          const pricePerHour = type === 'electric' ? 75 : type === 'handicap' ? 30 : 50;

          slots.push({
            location: location._id,
            slotNumber,
            floor,
            type,
            status,
            pricePerHour,
          });
        }
      }

      await ParkingSlot.insertMany(slots);
      console.log(`Created ${slots.length} parking slots for ${location.name}`);
    }

    // Create some sample reservations
    const mysurePalaceLocation = locations[0];
    const mysurePalaceSlots = await ParkingSlot.find({
      location: mysurePalaceLocation._id,
      status: 'reserved',
    }).limit(3);

    if (mysurePalaceSlots.length > 0) {
      for (let i = 0; i < Math.min(2, mysurePalaceSlots.length); i++) {
        const startTime = new Date();
        startTime.setHours(startTime.getHours() + i);
        
        const duration = Math.floor(Math.random() * 4) + 1;
        const endTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000);
        
        const reservation = new Reservation({
          user: users[i % 2]._id,
          location: mysurePalaceLocation._id,
          slot: mysurePalaceSlots[i]._id,
          startTime,
          endTime,
          duration,
          totalPrice: duration * mysurePalaceSlots[i].pricePerHour,
          userName: users[i % 2].name,
          userPhone: users[i % 2].phone,
          licensePlate: users[i % 2].licensePlate,
          status: 'active',
        });

        await reservation.save();
        console.log(`Created reservation ${reservation.reservationId}`);
      }
      console.log('Created sample reservations');
    }

    console.log('\n✅ Database seeded successfully!');
    console.log('\nTest Credentials:');
    console.log('─────────────────────────────────────────');
    console.log('User 1:');
    console.log('  Email: john@example.com');
    console.log('  Password: password123');
    console.log('\nUser 2:');
    console.log('  Email: jane@example.com');
    console.log('  Password: password123');
    console.log('\nAdmin:');
    console.log('  Email: admin@smartpark.com');
    console.log('  Password: admin123');
    console.log('─────────────────────────────────────────\n');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

connectDB().then(() => seedData());