import { Bed } from "../models/Bed.js";
import { Doctor } from "../models/Doctor.js";
import { Patient } from "../models/Patient.js";
import { Emergency } from "../models/Emergency.js";
import { ActionLog } from "../models/ActionLog.js";
import { SystemEvent } from "../models/SystemEvent.js";
import { logSystemEvent } from "./logService.js";
import bcrypt from "bcryptjs";

const seedBeds = [
  { code: "BED-A1", ward: "General" },
  { code: "BED-A2", ward: "General" },
  { code: "BED-A3", ward: "General" },
  { code: "BED-A4", ward: "General" },
  { code: "BED-A5", ward: "General" },
  { code: "BED-B1", ward: "ICU" },
  { code: "BED-B2", ward: "ICU" },
  { code: "BED-B3", ward: "ICU" },
  { code: "BED-C1", ward: "Pediatric" },
  { code: "BED-C2", ward: "Pediatric" },
  { code: "BED-C3", ward: "Pediatric" },
  { code: "BED-D1", ward: "Trauma" },
  { code: "BED-D2", ward: "Trauma" },
  { code: "BED-E1", ward: "Emergency" },
  { code: "BED-E2", ward: "Emergency" }
];

const seedDoctors = [
  { name: "Dr. Aditya Kulkarni", specialization: "Emergency Medicine", availability: 10, gender: "Male" },
  { name: "Dr. Sunita Sharma", specialization: "Trauma Care", availability: 8, gender: "Female" },
  { name: "Dr. Rajesh Deshpande", specialization: "General Medicine", availability: 7, gender: "Male" },
  { name: "Dr. Meera Iyer", specialization: "Cardiology", availability: 9, gender: "Female" },
  { name: "Dr. Vikram Malhotra", specialization: "Neurology", availability: 6, gender: "Male" },
  { name: "Dr. Kavita Reddy", specialization: "Pediatrics", availability: 8, gender: "Female" },
  { name: "Dr. Sandeep Shah", specialization: "Diagnostics", availability: 10, gender: "Male" },
  { name: "Dr. Sneha Patil", specialization: "General Surgery", availability: 9, gender: "Female" },
  { name: "Dr. Amit Trivedi", specialization: "Oncology", availability: 10, gender: "Male" },
  { name: "Dr. Sakshi Verma", specialization: "Endocrinology", availability: 7, gender: "Female" }
];

const seedPatients = [
  { name: "Saurabh Joshi", age: 31, bloodGroup: "B+", riskLevel: 2, primaryCondition: "Asthma" },
  { name: "Priya Varma", age: 56, bloodGroup: "O-", riskLevel: 3, primaryCondition: "Cardiac Risk" },
  { name: "Anil Raut", age: 42, bloodGroup: "A+", riskLevel: 1, primaryCondition: "Hypertension" },
  { name: "Gita Shinde", age: 68, bloodGroup: "AB+", riskLevel: 3, primaryCondition: "Diabetes" },
  { name: "Rahul Deshmukh", age: 35, bloodGroup: "O+", riskLevel: 1, primaryCondition: "Stable" },
  { name: "Amrita Solanke", age: 38, bloodGroup: "B-", riskLevel: 2, primaryCondition: "Fracture" },
  { name: "Vinay Pathak", age: 29, bloodGroup: "A-", riskLevel: 1, primaryCondition: "Fever" },
  { name: "Nitin Deshmukh", age: 50, bloodGroup: "O+", riskLevel: 3, primaryCondition: "Heart Blockage" },
  { name: "Shikha Pandey", age: 33, bloodGroup: "AB-", riskLevel: 2, primaryCondition: "Migraine" },
  { name: "Rohit Pawar", age: 45, bloodGroup: "B+", riskLevel: 3, primaryCondition: "Trauma" },
  { name: "Yash Naik", age: 22, bloodGroup: "A+", riskLevel: 3, primaryCondition: "Cardiac Arrest" },
  { name: "Mohit Joshi", age: 41, bloodGroup: "O-", riskLevel: 1, primaryCondition: "Sprain" },
  { name: "Ram Chendke", age: 20, bloodGroup: "B+", riskLevel: 1, primaryCondition: "Fatigue" },
  { name: "Aditya Gawner", age: 20, bloodGroup: "AB+", riskLevel: 2, primaryCondition: "Mental Stress" },
  { name: "Sujal Vyas", age: 42, bloodGroup: "O+", riskLevel: 3, primaryCondition: "Aging" }
];

export async function seedDemoData() {
  // Strictly clear and re-seed all collections to avoid duplicates and stale data
  await Promise.all([
    Bed.deleteMany({}),
    Doctor.deleteMany({}),
    Patient.deleteMany({})
  ]);

  // Randomize some fields for dynamic feel
  const dynamicPatients = seedPatients.map(p => ({
    ...p,
    age: p.age + Math.floor(Math.random() * 5) - 2, // Vary age by +/- 2 years
    riskLevel: Math.floor(Math.random() * 3) + 1 // Vary risk level
  })).sort(() => Math.random() - 0.5); // Shuffle

  const salt = await bcrypt.genSalt(10);
  const defaultPassword = await bcrypt.hash("password123", salt);

  const dynamicDoctors = [...seedDoctors].sort(() => Math.random() - 0.5).map(doc => ({
    ...doc,
    password: defaultPassword,
    role: "doctor"
  }));

  const adminPassword = await bcrypt.hash("admin123", salt);
  dynamicDoctors.push({
    name: "Sanjay Gupta",
    specialization: "Administration",
    availability: 0,
    gender: "Male",
    password: adminPassword,
    role: "admin",
    available: false
  });

  await Promise.all([
    Bed.insertMany(seedBeds),
    Doctor.insertMany(dynamicDoctors),
    Patient.insertMany(dynamicPatients)
  ]);

  await logSystemEvent("SEED_COMPLETE", "Fresh demo data seeded", {
    beds: 15,
    doctors: 10,
    patients: 15
  });
}

export async function resetDemoData() {
  await Promise.all([
    Emergency.deleteMany({}),
    ActionLog.deleteMany({}),
    SystemEvent.deleteMany({})
  ]);

  await Bed.deleteMany({});
  await Bed.insertMany(seedBeds);

  await Doctor.deleteMany({});
  await Doctor.insertMany(seedDoctors);

  const patientCount = await Patient.countDocuments();
  if (patientCount < 15) {
    await Patient.deleteMany({});
    await Patient.insertMany(seedPatients);
  }

  await logSystemEvent("DEMO_RESET", "Demo state reset with fresh resources", {
    beds: 15,
    doctors: 10,
    patients: 15
  });
}
