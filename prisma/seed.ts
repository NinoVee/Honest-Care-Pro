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

  // 20 tablets in rotation, all available at first.
  for (let i = 1; i <= 20; i++) {
    await prisma.tablet.create({
      data: { identifier: `TABLET-${String(i).padStart(2, "0")}` },
    });
  }

  const tablet1 = await prisma.tablet.findUniqueOrThrow({ where: { identifier: "TABLET-01" } });

  const patient = await prisma.patient.create({
    data: {
      organizationId: org.id,
      firstName: "Sample",
      lastName: "Patient-A",
      medicalRecordNumber: "MRN-TEST-0001",
      dateOfBirth: new Date("1950-01-01"),
      phone: "+15550001234",
      allergies: ["Penicillin (fictional test data)"],
      precautions: ["Fall risk (fictional test data)"],
      assignedTabletId: tablet1.id,
    },
  });
  await prisma.tablet.update({ where: { id: tablet1.id }, data: { status: "ASSIGNED" } });

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

  console.log("Seeded fictional demo data + 20 tablets.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });