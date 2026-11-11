import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '.env.local'), override: true });

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clear existing data in reverse dependency order
  await prisma.loan.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.member.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // --- Users ---
  const adminPassword = 'admin123';
  const adminHash = await bcrypt.hash(adminPassword, 12);
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@robotics.club',
      passwordHash: adminHash,
      role: 'ADMIN',
      isActive: true
    }
  });
  const labHash = await bcrypt.hash('lab123', 12);
  const labAssistant = await prisma.user.create({
    data: {
      name: 'Lab Assistant',
      email: 'lab@robotics.club',
      passwordHash: labHash,
      role: 'LAB_ASSISTANT',
      isActive: true
    }
  });
  const execHash = await bcrypt.hash('exec123', 12);
  await prisma.user.create({
    data: {
      name: 'Executive Member',
      email: 'exec@robotics.club',
      passwordHash: execHash,
      role: 'EXECUTIVE',
      isActive: true
    }
  });

  console.log('\n=== ADMIN CREDENTIALS ===');
  console.log('Email:   ', admin.email);
  console.log('Password:', adminPassword);
  console.log('=========================\n');

  // --- Categories ---
  const cats = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Microcontrollers',
        description: 'Arduino, ESP32, and similar microcontroller boards'
      }
    }),
    prisma.category.create({
      data: {
        name: 'Sensors',
        description: 'Distance, temperature, pressure, IMU sensors'
      }
    }),
    prisma.category.create({
      data: {
        name: 'Motors',
        description: 'DC motors, servo motors, stepper motors'
      }
    }),
    prisma.category.create({
      data: {
        name: 'Motor Drivers',
        description: 'L298N, L293D, TB6612FNG motor driver modules'
      }
    }),
    prisma.category.create({
      data: {
        name: 'Batteries',
        description: 'LiPo packs, 18650 cells, AA/AAA batteries'
      }
    }),
    prisma.category.create({
      data: {
        name: 'Measuring Tools',
        description: 'Multimeters, oscilloscopes, power supplies'
      }
    }),
    prisma.category.create({
      data: {
        name: 'Soldering',
        description: 'Soldering irons, solder wire, flux, helping hands'
      }
    }),
    prisma.category.create({
      data: {
        name: 'Laptops',
        description: 'Club-owned laptops for project work'
      }
    })
  ]);
  const [mcuCat, sensorCat, motorCat, motorDriverCat, batteryCat, measCat, solderCat, laptopCat] =
    cats as [
      (typeof cats)[0],
      (typeof cats)[0],
      (typeof cats)[0],
      (typeof cats)[0],
      (typeof cats)[0],
      (typeof cats)[0],
      (typeof cats)[0],
      (typeof cats)[0]
    ];

  // --- Equipment (35 items) ---
  function tag(n: number) {
    return `RC-${String(n).padStart(4, '0')}`;
  }
  const today = new Date();
  const purchaseDate = new Date(today);
  purchaseDate.setFullYear(purchaseDate.getFullYear() - 1);

  const equipmentData = [
    // Microcontrollers (6)
    {
      assetTag: tag(1),
      name: 'Arduino Uno R3',
      categoryId: mcuCat.id,
      storageLocation: 'Shelf A1',
      condition: 'GOOD',
      status: 'AVAILABLE'
    },
    {
      assetTag: tag(2),
      name: 'Arduino Uno R3',
      categoryId: mcuCat.id,
      storageLocation: 'Shelf A1',
      condition: 'GOOD',
      status: 'AVAILABLE'
    },
    {
      assetTag: tag(3),
      name: 'Arduino Mega 2560',
      categoryId: mcuCat.id,
      storageLocation: 'Shelf A1',
      condition: 'GOOD',
      status: 'AVAILABLE'
    },
    {
      assetTag: tag(4),
      name: 'ESP32 DevKit',
      categoryId: mcuCat.id,
      storageLocation: 'Shelf A2',
      condition: 'GOOD',
      status: 'AVAILABLE'
    },
    {
      assetTag: tag(5),
      name: 'ESP32 DevKit',
      categoryId: mcuCat.id,
      storageLocation: 'Shelf A2',
      condition: 'FAIR',
      status: 'AVAILABLE'
    },
    {
      assetTag: tag(6),
      name: 'Raspberry Pi 4B 4GB',
      categoryId: mcuCat.id,
      storageLocation: 'Shelf A2',
      condition: 'GOOD',
      status: 'AVAILABLE'
    },
    // Sensors (6)
    {
      assetTag: tag(7),
      name: 'HC-SR04 Ultrasonic Sensor',
      categoryId: sensorCat.id,
      storageLocation: 'Drawer B1',
      condition: 'GOOD',
      status: 'AVAILABLE'
    },
    {
      assetTag: tag(8),
      name: 'HC-SR04 Ultrasonic Sensor',
      categoryId: sensorCat.id,
      storageLocation: 'Drawer B1',
      condition: 'GOOD',
      status: 'AVAILABLE'
    },
    {
      assetTag: tag(9),
      name: 'MPU-6050 IMU Module',
      categoryId: sensorCat.id,
      storageLocation: 'Drawer B1',
      condition: 'GOOD',
      status: 'AVAILABLE'
    },
    {
      assetTag: tag(10),
      name: 'DHT22 Temperature/Humidity Sensor',
      categoryId: sensorCat.id,
      storageLocation: 'Drawer B2',
      condition: 'GOOD',
      status: 'AVAILABLE'
    },
    {
      assetTag: tag(11),
      name: 'IR Sensor Module',
      categoryId: sensorCat.id,
      storageLocation: 'Drawer B2',
      condition: 'FAIR',
      status: 'AVAILABLE'
    },
    {
      assetTag: tag(12),
      name: 'Flame Sensor Module',
      categoryId: sensorCat.id,
      storageLocation: 'Drawer B2',
      condition: 'GOOD',
      status: 'AVAILABLE'
    },
    // Motors (4)
    {
      assetTag: tag(13),
      name: 'DC Gear Motor 12V 100RPM',
      categoryId: motorCat.id,
      storageLocation: 'Shelf C1',
      condition: 'GOOD',
      status: 'AVAILABLE'
    },
    {
      assetTag: tag(14),
      name: 'DC Gear Motor 12V 100RPM',
      categoryId: motorCat.id,
      storageLocation: 'Shelf C1',
      condition: 'GOOD',
      status: 'AVAILABLE'
    },
    {
      assetTag: tag(15),
      name: 'MG996R Servo Motor',
      categoryId: motorCat.id,
      storageLocation: 'Shelf C1',
      condition: 'GOOD',
      status: 'AVAILABLE'
    },
    {
      assetTag: tag(16),
      name: 'NEMA 17 Stepper Motor',
      categoryId: motorCat.id,
      storageLocation: 'Shelf C2',
      condition: 'FAIR',
      status: 'AVAILABLE'
    },
    // Motor Drivers (4)
    {
      assetTag: tag(17),
      name: 'L298N Motor Driver Module',
      categoryId: motorDriverCat.id,
      storageLocation: 'Drawer D1',
      condition: 'GOOD',
      status: 'AVAILABLE'
    },
    {
      assetTag: tag(18),
      name: 'L298N Motor Driver Module',
      categoryId: motorDriverCat.id,
      storageLocation: 'Drawer D1',
      condition: 'GOOD',
      status: 'AVAILABLE'
    },
    {
      assetTag: tag(19),
      name: 'TB6612FNG Motor Driver',
      categoryId: motorDriverCat.id,
      storageLocation: 'Drawer D1',
      condition: 'GOOD',
      status: 'AVAILABLE'
    },
    {
      assetTag: tag(20),
      name: 'BTS7960 High Current Motor Driver',
      categoryId: motorDriverCat.id,
      storageLocation: 'Drawer D1',
      condition: 'DAMAGED',
      status: 'DAMAGED'
    },
    // Batteries (4)
    {
      assetTag: tag(21),
      name: 'LiPo Battery 11.1V 2200mAh',
      categoryId: batteryCat.id,
      storageLocation: 'Battery Safe',
      condition: 'GOOD',
      status: 'AVAILABLE'
    },
    {
      assetTag: tag(22),
      name: 'LiPo Battery 11.1V 2200mAh',
      categoryId: batteryCat.id,
      storageLocation: 'Battery Safe',
      condition: 'FAIR',
      status: 'AVAILABLE'
    },
    {
      assetTag: tag(23),
      name: 'LiPo Battery 7.4V 1800mAh',
      categoryId: batteryCat.id,
      storageLocation: 'Battery Safe',
      condition: 'GOOD',
      status: 'AVAILABLE'
    },
    {
      assetTag: tag(24),
      name: 'Portable Power Bank 20000mAh',
      categoryId: batteryCat.id,
      storageLocation: 'Shelf E1',
      condition: 'GOOD',
      status: 'AVAILABLE'
    },
    // Measuring Tools (4)
    {
      assetTag: tag(25),
      name: 'Digital Multimeter UT61E',
      categoryId: measCat.id,
      storageLocation: 'Shelf F1',
      condition: 'GOOD',
      status: 'AVAILABLE'
    },
    {
      assetTag: tag(26),
      name: 'Digital Multimeter UT61E',
      categoryId: measCat.id,
      storageLocation: 'Shelf F1',
      condition: 'FAIR',
      status: 'AVAILABLE'
    },
    {
      assetTag: tag(27),
      name: 'Bench Power Supply 30V/5A',
      categoryId: measCat.id,
      storageLocation: 'Bench 1',
      condition: 'GOOD',
      status: 'AVAILABLE'
    },
    {
      assetTag: tag(28),
      name: 'Oscilloscope DS1054Z',
      categoryId: measCat.id,
      storageLocation: 'Bench 2',
      condition: 'GOOD',
      status: 'AVAILABLE'
    },
    // Soldering (4)
    {
      assetTag: tag(29),
      name: 'Soldering Iron Station TS100',
      categoryId: solderCat.id,
      storageLocation: 'Bench 3',
      condition: 'GOOD',
      status: 'AVAILABLE'
    },
    {
      assetTag: tag(30),
      name: 'Soldering Iron Station TS100',
      categoryId: solderCat.id,
      storageLocation: 'Bench 3',
      condition: 'GOOD',
      status: 'AVAILABLE'
    },
    {
      assetTag: tag(31),
      name: 'Hakko FX-888D Soldering Station',
      categoryId: solderCat.id,
      storageLocation: 'Bench 4',
      condition: 'GOOD',
      status: 'AVAILABLE'
    },
    {
      assetTag: tag(32),
      name: 'Desoldering Pump Set',
      categoryId: solderCat.id,
      storageLocation: 'Bench 3',
      condition: 'FAIR',
      status: 'AVAILABLE'
    },
    // Laptops (3)
    {
      assetTag: tag(33),
      name: 'Dell Latitude 5520 Laptop',
      categoryId: laptopCat.id,
      storageLocation: 'Laptop Cabinet',
      condition: 'GOOD',
      status: 'AVAILABLE'
    },
    {
      assetTag: tag(34),
      name: 'Dell Latitude 5520 Laptop',
      categoryId: laptopCat.id,
      storageLocation: 'Laptop Cabinet',
      condition: 'GOOD',
      status: 'AVAILABLE'
    },
    {
      assetTag: tag(35),
      name: 'Lenovo ThinkPad T14 Laptop',
      categoryId: laptopCat.id,
      storageLocation: 'Laptop Cabinet',
      condition: 'FAIR',
      status: 'AVAILABLE'
    }
  ];

  const equipment = await Promise.all(
    equipmentData.map((e) => prisma.equipment.create({ data: { ...e, purchaseDate } }))
  );

  // --- Members (12) ---
  const members = await Promise.all([
    prisma.member.create({
      data: {
        studentId: '2020-1-60-001',
        fullName: 'Rahim Ahmed',
        email: 'rahim@uni.edu',
        phone: '01711000001',
        department: 'EEE',
        status: 'ACTIVE'
      }
    }),
    prisma.member.create({
      data: {
        studentId: '2020-1-60-002',
        fullName: 'Karim Hossain',
        email: 'karim@uni.edu',
        phone: '01711000002',
        department: 'CSE',
        status: 'ACTIVE'
      }
    }),
    prisma.member.create({
      data: {
        studentId: '2021-1-60-003',
        fullName: 'Nadia Islam',
        email: 'nadia@uni.edu',
        phone: '01711000003',
        department: 'ME',
        status: 'ACTIVE'
      }
    }),
    prisma.member.create({
      data: {
        studentId: '2021-1-60-004',
        fullName: 'Farhan Khan',
        email: 'farhan@uni.edu',
        phone: '01711000004',
        department: 'EEE',
        status: 'ACTIVE'
      }
    }),
    prisma.member.create({
      data: {
        studentId: '2021-1-60-005',
        fullName: 'Tasnim Sultana',
        email: 'tasnim@uni.edu',
        phone: '01711000005',
        department: 'CSE',
        status: 'ACTIVE'
      }
    }),
    prisma.member.create({
      data: {
        studentId: '2022-1-60-006',
        fullName: 'Sabbir Rahman',
        email: 'sabbir@uni.edu',
        phone: '01711000006',
        department: 'EEE',
        status: 'ACTIVE'
      }
    }),
    prisma.member.create({
      data: {
        studentId: '2022-1-60-007',
        fullName: 'Mehenaz Akter',
        email: 'mehenaz@uni.edu',
        phone: '01711000007',
        department: 'ME',
        status: 'ACTIVE'
      }
    }),
    prisma.member.create({
      data: {
        studentId: '2022-1-60-008',
        fullName: 'Tanvir Hasan',
        email: 'tanvir@uni.edu',
        phone: '01711000008',
        department: 'CSE',
        status: 'ACTIVE'
      }
    }),
    prisma.member.create({
      data: {
        studentId: '2023-1-60-009',
        fullName: 'Riya Chowdhury',
        email: 'riya@uni.edu',
        phone: '01711000009',
        department: 'EEE',
        status: 'ACTIVE'
      }
    }),
    prisma.member.create({
      data: {
        studentId: '2023-1-60-010',
        fullName: 'Imran Uddin',
        email: 'imran@uni.edu',
        phone: '01711000010',
        department: 'CSE',
        status: 'ACTIVE'
      }
    }),
    prisma.member.create({
      data: {
        studentId: '2023-1-60-011',
        fullName: 'Sadia Parvin',
        email: 'sadia@uni.edu',
        phone: '01711000011',
        department: 'ME',
        status: 'ACTIVE'
      }
    }),
    prisma.member.create({
      data: {
        studentId: '2019-1-60-012',
        fullName: 'Mizanur Rahman',
        email: 'mizan@uni.edu',
        phone: '01711000012',
        department: 'EEE',
        status: 'INACTIVE',
        notes: 'Graduated'
      }
    })
  ]);

  const [rahim, karim, nadia, farhan, tasnim, sabbir, mehenaz, tanvir, riya, imran, sadia] =
    members as Array<(typeof members)[0]>;

  // Compute dates relative to today
  function daysAgo(n: number) {
    const d = new Date(today);
    d.setDate(d.getDate() - n);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }
  function daysFromNow(n: number) {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }
  function todayMidnight() {
    const d = new Date(today);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }

  // --- Loans (15) ---
  // Active loans (4)
  await prisma.loan.create({
    data: {
      equipmentId: equipment[0]!.id,
      memberId: rahim!.id,
      issuedByUserId: labAssistant.id,
      borrowedAt: daysAgo(3),
      dueDate: daysFromNow(4),
      purpose: 'Line follower robot project'
    }
  });
  await prisma.equipment.update({
    where: { id: equipment[0]!.id },
    data: { status: 'BORROWED' }
  });

  await prisma.loan.create({
    data: {
      equipmentId: equipment[16]!.id,
      memberId: karim!.id,
      issuedByUserId: labAssistant.id,
      borrowedAt: daysAgo(2),
      dueDate: daysFromNow(5),
      purpose: 'Motor control project'
    }
  });
  await prisma.equipment.update({
    where: { id: equipment[16]!.id },
    data: { status: 'BORROWED' }
  });

  await prisma.loan.create({
    data: {
      equipmentId: equipment[32]!.id,
      memberId: nadia!.id,
      issuedByUserId: admin.id,
      borrowedAt: daysAgo(5),
      dueDate: daysFromNow(2),
      purpose: 'Semester project work'
    }
  });
  await prisma.equipment.update({
    where: { id: equipment[32]!.id },
    data: { status: 'BORROWED' }
  });

  await prisma.loan.create({
    data: {
      equipmentId: equipment[5]!.id,
      memberId: farhan!.id,
      issuedByUserId: labAssistant.id,
      borrowedAt: daysAgo(1),
      dueDate: daysFromNow(6),
      purpose: 'Robotics competition prep'
    }
  });
  await prisma.equipment.update({
    where: { id: equipment[5]!.id },
    data: { status: 'BORROWED' }
  });

  // Due today (2)
  await prisma.loan.create({
    data: {
      equipmentId: equipment[8]!.id,
      memberId: tasnim!.id,
      issuedByUserId: labAssistant.id,
      borrowedAt: daysAgo(7),
      dueDate: todayMidnight(),
      purpose: 'IMU calibration research'
    }
  });
  await prisma.equipment.update({
    where: { id: equipment[8]!.id },
    data: { status: 'BORROWED' }
  });

  await prisma.loan.create({
    data: {
      equipmentId: equipment[24]!.id,
      memberId: sabbir!.id,
      issuedByUserId: labAssistant.id,
      borrowedAt: daysAgo(7),
      dueDate: todayMidnight(),
      purpose: 'Circuit testing'
    }
  });
  await prisma.equipment.update({
    where: { id: equipment[24]!.id },
    data: { status: 'BORROWED' }
  });

  // Overdue (5, ranging 1-20 days late)
  await prisma.loan.create({
    data: {
      equipmentId: equipment[3]!.id,
      memberId: mehenaz!.id,
      issuedByUserId: labAssistant.id,
      borrowedAt: daysAgo(8),
      dueDate: daysAgo(1),
      purpose: 'IoT sensor node project'
    }
  });
  await prisma.equipment.update({
    where: { id: equipment[3]!.id },
    data: { status: 'BORROWED' }
  });

  await prisma.loan.create({
    data: {
      equipmentId: equipment[20]!.id,
      memberId: tanvir!.id,
      issuedByUserId: labAssistant.id,
      borrowedAt: daysAgo(12),
      dueDate: daysAgo(5),
      purpose: 'Drone power system testing'
    }
  });
  await prisma.equipment.update({
    where: { id: equipment[20]!.id },
    data: { status: 'BORROWED' }
  });

  await prisma.loan.create({
    data: {
      equipmentId: equipment[28]!.id,
      memberId: riya!.id,
      issuedByUserId: admin.id,
      borrowedAt: daysAgo(17),
      dueDate: daysAgo(10),
      purpose: 'PCB soldering for capstone'
    }
  });
  await prisma.equipment.update({
    where: { id: equipment[28]!.id },
    data: { status: 'BORROWED' }
  });

  await prisma.loan.create({
    data: {
      equipmentId: equipment[13]!.id,
      memberId: imran!.id,
      issuedByUserId: labAssistant.id,
      borrowedAt: daysAgo(25),
      dueDate: daysAgo(18),
      purpose: 'Autonomous rover project'
    }
  });
  await prisma.equipment.update({
    where: { id: equipment[13]!.id },
    data: { status: 'BORROWED' }
  });

  await prisma.loan.create({
    data: {
      equipmentId: equipment[33]!.id,
      memberId: sadia!.id,
      issuedByUserId: labAssistant.id,
      borrowedAt: daysAgo(28),
      dueDate: daysAgo(21),
      purpose: 'Final year project development'
    }
  });
  await prisma.equipment.update({
    where: { id: equipment[33]!.id },
    data: { status: 'BORROWED' }
  });

  // Returned (4, including one damaged)
  await prisma.loan.create({
    data: {
      equipmentId: equipment[6]!.id,
      memberId: rahim!.id,
      issuedByUserId: labAssistant.id,
      borrowedAt: daysAgo(14),
      dueDate: daysAgo(7),
      returnedAt: daysAgo(6),
      returnedToUserId: labAssistant.id,
      returnCondition: 'GOOD',
      purpose: 'Obstacle avoidance project'
    }
  });

  await prisma.loan.create({
    data: {
      equipmentId: equipment[15]!.id,
      memberId: karim!.id,
      issuedByUserId: labAssistant.id,
      borrowedAt: daysAgo(20),
      dueDate: daysAgo(13),
      returnedAt: daysAgo(13),
      returnedToUserId: admin.id,
      returnCondition: 'GOOD',
      purpose: 'Stepper motor calibration'
    }
  });

  await prisma.loan.create({
    data: {
      equipmentId: equipment[25]!.id,
      memberId: nadia!.id,
      issuedByUserId: labAssistant.id,
      borrowedAt: daysAgo(30),
      dueDate: daysAgo(23),
      returnedAt: daysAgo(22),
      returnedToUserId: labAssistant.id,
      returnCondition: 'FAIR',
      purpose: 'Voltage measurement assignment'
    }
  });

  // One returned damaged
  await prisma.loan.create({
    data: {
      equipmentId: equipment[18]!.id,
      memberId: farhan!.id,
      issuedByUserId: admin.id,
      borrowedAt: daysAgo(45),
      dueDate: daysAgo(38),
      returnedAt: daysAgo(37),
      returnedToUserId: admin.id,
      returnCondition: 'DAMAGED',
      purpose: 'High-current motor driver test',
      notes: 'Returned with burn marks on the PCB. Marked as damaged.'
    }
  });

  console.log('Database seeded successfully!');
  console.log(
    `Created: 3 users, 8 categories, ${equipmentData.length} equipment items, 12 members, 15 loans`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
