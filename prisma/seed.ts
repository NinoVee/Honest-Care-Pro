// Seeds clearly-fictional test data only, per the spec's clinical safety
// requirement: "Do not populate realistic production patients."

import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const org = await prisma.organization.create({
    data: { name: "Honest Care — Demo Organization" },
  });

  const physician = await prisma.user.create({
    data: {
      organizationId: org.id,
      name: "Dr. Test Physician",
      email: "physician@example.test",
      role: UserRole.PHYSICIAN,
    },
  });

  const nurse = await prisma.user.create({
    data: {
      organizationId: org.id,
      name: "Test Nurse RN",
      email: "nurse@example.test",
      role: UserRole.NURSE,
    },
  });

  await prisma.user.create({
    data: {
      organizationId: org.id,
      name: "Test Scheduler",
      email: "scheduler@example.test",
      role: UserRole.SCHEDULER,
    },
  });

  const patient = await prisma.patient.create({
    data: {
      organizationId: org.id,
      firstName: "Sample",
      lastName: "Patient-A",
      medicalRecordNumber: "MRN-TEST-0001",
      dateOfBirth: new Date("1950-01-01"),
      allergies: ["Penicillin (fictional test data)"],
      precautions: ["Fall risk (fictional test data)"],
    },
  });

  const plan = await prisma.treatmentPlan.create({
    data: {
      patientId: patient.id,
      physicianId: physician.id,
      diagnosis: "Fictional test diagnosis",
      treatmentType: "Wound care",
      description: "Sample treatment plan for local development only.",
      frequency: "3x/week",
      startDate: new Date(),
      requiredVitals: ["blood_pressure", "spo2", "temperature"],
      notifyIfSystolicOver: 180,
      notifyIfSystolicUnder: 90,
      notifyIfSpo2Under: 92,
      status: "ACTIVE",
      signedAt: new Date(),
      signedBy: physician.name,
    },
  });

  await prisma.visit.create({
    data: {
      patientId: patient.id,
      treatmentPlanId: plan.id,
      nurseId: nurse.id,
      serviceType: "Wound Care",
      scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      status: "SCHEDULED",
      instructions: "Redress surgical site, verify vitals within plan thresholds.",
    },
  });

  console.log("Seeded fictional demo data.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
