const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  // Get or create the user with the provided userId
  const userId = "6950fd02d96840d3eecce003";

  // Check if user exists
  let user = await prisma.user.findUnique({
    where: { id: userId },
  });

  // If user doesn't exist, create it
  if (!user) {
    user = await prisma.user.create({
      data: {
        id: userId,
        email: "akilsabir2207@gmail.com",
        name: "Akil Sabir",
      },
    });
    console.log("User created:", user);
  }

  // Airbnb Schema
  const airbnbSchema = await prisma.databaseSchema.create({
    data: {
      name: "Airbnb",
      description: "Airbnb-like property rental platform schema",
      userId: userId,
      lastModifiedBy: "akilsabir2207@gmail.com",
      models: {
        create: [
          {
            nodeId: "user-node",
            name: "User",
            position: { x: 100, y: 100 },
            fields: {
              create: [
                { name: "id", type: "String", constraints: [{ type: "id" }] },
                { name: "email", type: "String", constraints: [{ type: "unique" }] },
                { name: "firstName", type: "String" },
                { name: "lastName", type: "String" },
                { name: "profilePicture", type: "String", isOptional: true },
                { name: "phoneNumber", type: "String", isOptional: true },
                { name: "dateOfBirth", type: "DateTime", isOptional: true },
                { name: "verified", type: "Boolean", defaultValue: "false" },
                { name: "createdAt", type: "DateTime", constraints: [{ type: "updatedAt" }] },
              ],
            },
          },
          {
            nodeId: "property-node",
            name: "Property",
            position: { x: 400, y: 100 },
            fields: {
              create: [
                { name: "id", type: "String", constraints: [{ type: "id" }] },
                { name: "title", type: "String" },
                { name: "description", type: "String", isOptional: true },
                { name: "address", type: "String" },
                { name: "city", type: "String" },
                { name: "country", type: "String" },
                { name: "latitude", type: "Float" },
                { name: "longitude", type: "Float" },
                { name: "pricePerNight", type: "Decimal" },
                { name: "bedrooms", type: "Int" },
                { name: "bathrooms", type: "Int" },
                { name: "maxGuests", type: "Int" },
                { name: "amenities", type: "String", isList: true },
                { name: "hostId", type: "String" },
                { name: "createdAt", type: "DateTime", constraints: [{ type: "updatedAt" }] },
              ],
            },
          },
          {
            nodeId: "booking-node",
            name: "Booking",
            position: { x: 700, y: 100 },
            fields: {
              create: [
                { name: "id", type: "String", constraints: [{ type: "id" }] },
                { name: "propertyId", type: "String" },
                { name: "guestId", type: "String" },
                { name: "checkInDate", type: "DateTime" },
                { name: "checkOutDate", type: "DateTime" },
                { name: "numberOfGuests", type: "Int" },
                { name: "totalPrice", type: "Decimal" },
                { name: "status", type: "String" },
                { name: "specialRequests", type: "String", isOptional: true },
                { name: "createdAt", type: "DateTime", constraints: [{ type: "updatedAt" }] },
              ],
            },
          },
          {
            nodeId: "review-node",
            name: "Review",
            position: { x: 250, y: 350 },
            fields: {
              create: [
                { name: "id", type: "String", constraints: [{ type: "id" }] },
                { name: "bookingId", type: "String" },
                { name: "guestId", type: "String" },
                { name: "propertyId", type: "String" },
                { name: "rating", type: "Int" },
                { name: "comment", type: "String", isOptional: true },
                { name: "cleanliness", type: "Int", isOptional: true },
                { name: "communication", type: "Int", isOptional: true },
                { name: "location", type: "Int", isOptional: true },
                { name: "createdAt", type: "DateTime", constraints: [{ type: "updatedAt" }] },
              ],
            },
          },
        ],
      },
    },
  });

  console.log("Airbnb schema created:", airbnbSchema.id);

  // Flight Schema
  const flightSchema = await prisma.databaseSchema.create({
    data: {
      name: "Flight Booking",
      description: "Airline flight booking system schema",
      userId: userId,
      lastModifiedBy: "akilsabir2207@gmail.com",
      models: {
        create: [
          {
            nodeId: "airline-node",
            name: "Airline",
            position: { x: 100, y: 100 },
            fields: {
              create: [
                { name: "id", type: "String", constraints: [{ type: "id" }] },
                { name: "name", type: "String", constraints: [{ type: "unique" }] },
                { name: "iataCode", type: "String", constraints: [{ type: "unique" }] },
                { name: "country", type: "String" },
                { name: "website", type: "String", isOptional: true },
                { name: "logoUrl", type: "String", isOptional: true },
              ],
            },
          },
          {
            nodeId: "aircraft-node",
            name: "Aircraft",
            position: { x: 400, y: 100 },
            fields: {
              create: [
                { name: "id", type: "String", constraints: [{ type: "id" }] },
                { name: "airlineId", type: "String" },
                { name: "aircraftType", type: "String" },
                { name: "capacity", type: "Int" },
                { name: "manufacturer", type: "String" },
                { name: "registrationNumber", type: "String", constraints: [{ type: "unique" }] },
              ],
            },
          },
          {
            nodeId: "flight-node",
            name: "Flight",
            position: { x: 700, y: 100 },
            fields: {
              create: [
                { name: "id", type: "String", constraints: [{ type: "id" }] },
                { name: "airlineId", type: "String" },
                { name: "aircraftId", type: "String" },
                { name: "flightNumber", type: "String", constraints: [{ type: "unique" }] },
                { name: "departureAirport", type: "String" },
                { name: "arrivalAirport", type: "String" },
                { name: "departureTime", type: "DateTime" },
                { name: "arrivalTime", type: "DateTime" },
                { name: "duration", type: "Int" },
                { name: "availableSeats", type: "Int" },
                { name: "status", type: "String" },
              ],
            },
          },
          {
            nodeId: "passenger-node",
            name: "Passenger",
            position: { x: 100, y: 350 },
            fields: {
              create: [
                { name: "id", type: "String", constraints: [{ type: "id" }] },
                { name: "firstName", type: "String" },
                { name: "lastName", type: "String" },
                { name: "email", type: "String", constraints: [{ type: "unique" }] },
                { name: "phoneNumber", type: "String", isOptional: true },
                { name: "dateOfBirth", type: "DateTime", isOptional: true },
                { name: "passportNumber", type: "String", constraints: [{ type: "unique" }] },
                { name: "nationality", type: "String" },
              ],
            },
          },
          {
            nodeId: "booking-node",
            name: "Booking",
            position: { x: 400, y: 350 },
            fields: {
              create: [
                { name: "id", type: "String", constraints: [{ type: "id" }] },
                { name: "flightId", type: "String" },
                { name: "passengerId", type: "String" },
                { name: "bookingRef", type: "String", constraints: [{ type: "unique" }] },
                { name: "seatNumber", type: "String" },
                { name: "bookingClass", type: "String" },
                { name: "price", type: "Decimal" },
                { name: "status", type: "String" },
                { name: "bookingDate", type: "DateTime" },
              ],
            },
          },
        ],
      },
    },
  });

  console.log("Flight schema created:", flightSchema.id);

  // E-Commerce Schema
  const ecommerceSchema = await prisma.databaseSchema.create({
    data: {
      name: "E-Commerce",
      description: "Online shopping platform schema",
      userId: userId,
      lastModifiedBy: "akilsabir2207@gmail.com",
      models: {
        create: [
          {
            nodeId: "customer-node",
            name: "Customer",
            position: { x: 100, y: 100 },
            fields: {
              create: [
                { name: "id", type: "String", constraints: [{ type: "id" }] },
                { name: "email", type: "String", constraints: [{ type: "unique" }] },
                { name: "firstName", type: "String" },
                { name: "lastName", type: "String" },
                { name: "phoneNumber", type: "String", isOptional: true },
                { name: "createdAt", type: "DateTime", constraints: [{ type: "updatedAt" }] },
                { name: "verificationStatus", type: "Boolean", defaultValue: "false" },
              ],
            },
          },
          {
            nodeId: "product-node",
            name: "Product",
            position: { x: 400, y: 100 },
            fields: {
              create: [
                { name: "id", type: "String", constraints: [{ type: "id" }] },
                { name: "name", type: "String" },
                { name: "description", type: "String", isOptional: true },
                { name: "sku", type: "String", constraints: [{ type: "unique" }] },
                { name: "price", type: "Decimal" },
                { name: "stock", type: "Int" },
                { name: "categoryId", type: "String" },
                { name: "images", type: "String", isList: true },
                { name: "isActive", type: "Boolean", defaultValue: "true" },
              ],
            },
          },
          {
            nodeId: "category-node",
            name: "Category",
            position: { x: 700, y: 100 },
            fields: {
              create: [
                { name: "id", type: "String", constraints: [{ type: "id" }] },
                { name: "name", type: "String", constraints: [{ type: "unique" }] },
                { name: "description", type: "String", isOptional: true },
                { name: "parentCategoryId", type: "String", isOptional: true },
                { name: "imageUrl", type: "String", isOptional: true },
              ],
            },
          },
          {
            nodeId: "order-node",
            name: "Order",
            position: { x: 250, y: 350 },
            fields: {
              create: [
                { name: "id", type: "String", constraints: [{ type: "id" }] },
                { name: "customerId", type: "String" },
                { name: "orderNumber", type: "String", constraints: [{ type: "unique" }] },
                { name: "totalAmount", type: "Decimal" },
                { name: "status", type: "String" },
                { name: "shippingAddress", type: "String" },
                { name: "orderDate", type: "DateTime", constraints: [{ type: "updatedAt" }] },
                { name: "estimatedDelivery", type: "DateTime", isOptional: true },
              ],
            },
          },
          {
            nodeId: "order-item-node",
            name: "OrderItem",
            position: { x: 550, y: 350 },
            fields: {
              create: [
                { name: "id", type: "String", constraints: [{ type: "id" }] },
                { name: "orderId", type: "String" },
                { name: "productId", type: "String" },
                { name: "quantity", type: "Int" },
                { name: "unitPrice", type: "Decimal" },
                { name: "totalPrice", type: "Decimal" },
              ],
            },
          },
        ],
      },
    },
  });

  console.log("E-Commerce schema created:", ecommerceSchema.id);

  // Social Media Schema
  const socialMediaSchema = await prisma.databaseSchema.create({
    data: {
      name: "Social Media",
      description: "Social networking platform schema",
      userId: userId,
      lastModifiedBy: "akilsabir2207@gmail.com",
      models: {
        create: [
          {
            nodeId: "user-node",
            name: "User",
            position: { x: 100, y: 100 },
            fields: {
              create: [
                { name: "id", type: "String", constraints: [{ type: "id" }] },
                { name: "username", type: "String", constraints: [{ type: "unique" }] },
                { name: "email", type: "String", constraints: [{ type: "unique" }] },
                { name: "displayName", type: "String" },
                { name: "bio", type: "String", isOptional: true },
                { name: "profilePictureUrl", type: "String", isOptional: true },
                { name: "coverPhotoUrl", type: "String", isOptional: true },
                { name: "followers", type: "Int", defaultValue: "0" },
                { name: "following", type: "Int", defaultValue: "0" },
                { name: "createdAt", type: "DateTime", constraints: [{ type: "updatedAt" }] },
              ],
            },
          },
          {
            nodeId: "post-node",
            name: "Post",
            position: { x: 400, y: 100 },
            fields: {
              create: [
                { name: "id", type: "String", constraints: [{ type: "id" }] },
                { name: "userId", type: "String" },
                { name: "content", type: "String" },
                { name: "images", type: "String", isList: true },
                { name: "likes", type: "Int", defaultValue: "0" },
                { name: "comments", type: "Int", defaultValue: "0" },
                { name: "isPublic", type: "Boolean", defaultValue: "true" },
                { name: "createdAt", type: "DateTime", constraints: [{ type: "updatedAt" }] },
                { name: "updatedAt", type: "DateTime", constraints: [{ type: "updatedAt" }] },
              ],
            },
          },
          {
            nodeId: "comment-node",
            name: "Comment",
            position: { x: 700, y: 100 },
            fields: {
              create: [
                { name: "id", type: "String", constraints: [{ type: "id" }] },
                { name: "postId", type: "String" },
                { name: "userId", type: "String" },
                { name: "content", type: "String" },
                { name: "likes", type: "Int", defaultValue: "0" },
                { name: "parentCommentId", type: "String", isOptional: true },
                { name: "createdAt", type: "DateTime", constraints: [{ type: "updatedAt" }] },
              ],
            },
          },
          {
            nodeId: "like-node",
            name: "Like",
            position: { x: 250, y: 350 },
            fields: {
              create: [
                { name: "id", type: "String", constraints: [{ type: "id" }] },
                { name: "userId", type: "String" },
                { name: "postId", type: "String", isOptional: true },
                { name: "commentId", type: "String", isOptional: true },
                { name: "createdAt", type: "DateTime", constraints: [{ type: "updatedAt" }] },
              ],
            },
          },
          {
            nodeId: "follow-node",
            name: "Follow",
            position: { x: 550, y: 350 },
            fields: {
              create: [
                { name: "id", type: "String", constraints: [{ type: "id" }] },
                { name: "followerId", type: "String" },
                { name: "followingId", type: "String" },
                { name: "createdAt", type: "DateTime", constraints: [{ type: "updatedAt" }] },
              ],
            },
          },
        ],
      },
    },
  });

  console.log("Social Media schema created:", socialMediaSchema.id);

  // Hospital Management Schema
  const hospitalSchema = await prisma.databaseSchema.create({
    data: {
      name: "Hospital Management",
      description: "Hospital management system schema",
      userId: userId,
      lastModifiedBy: "akilsabir2207@gmail.com",
      models: {
        create: [
          {
            nodeId: "patient-node",
            name: "Patient",
            position: { x: 100, y: 100 },
            fields: {
              create: [
                { name: "id", type: "String", constraints: [{ type: "id" }] },
                { name: "firstName", type: "String" },
                { name: "lastName", type: "String" },
                { name: "dateOfBirth", type: "DateTime" },
                { name: "email", type: "String", constraints: [{ type: "unique" }] },
                { name: "phoneNumber", type: "String", isOptional: true },
                { name: "gender", type: "String", isOptional: true },
                { name: "bloodType", type: "String", isOptional: true },
                { name: "address", type: "String", isOptional: true },
                { name: "emergencyContact", type: "String", isOptional: true },
              ],
            },
          },
          {
            nodeId: "doctor-node",
            name: "Doctor",
            position: { x: 400, y: 100 },
            fields: {
              create: [
                { name: "id", type: "String", constraints: [{ type: "id" }] },
                { name: "firstName", type: "String" },
                { name: "lastName", type: "String" },
                { name: "specialization", type: "String" },
                { name: "licenseNumber", type: "String", constraints: [{ type: "unique" }] },
                { name: "email", type: "String", constraints: [{ type: "unique" }] },
                { name: "phoneNumber", type: "String" },
                { name: "departmentId", type: "String" },
                { name: "yearsOfExperience", type: "Int" },
              ],
            },
          },
          {
            nodeId: "appointment-node",
            name: "Appointment",
            position: { x: 700, y: 100 },
            fields: {
              create: [
                { name: "id", type: "String", constraints: [{ type: "id" }] },
                { name: "patientId", type: "String" },
                { name: "doctorId", type: "String" },
                { name: "appointmentDate", type: "DateTime" },
                { name: "duration", type: "Int" },
                { name: "reason", type: "String", isOptional: true },
                { name: "status", type: "String" },
                { name: "notes", type: "String", isOptional: true },
              ],
            },
          },
          {
            nodeId: "department-node",
            name: "Department",
            position: { x: 250, y: 350 },
            fields: {
              create: [
                { name: "id", type: "String", constraints: [{ type: "id" }] },
                { name: "name", type: "String", constraints: [{ type: "unique" }] },
                { name: "head", type: "String", isOptional: true },
                { name: "floor", type: "Int", isOptional: true },
                { name: "phoneExtension", type: "String", isOptional: true },
                { name: "description", type: "String", isOptional: true },
              ],
            },
          },
          {
            nodeId: "medical-record-node",
            name: "MedicalRecord",
            position: { x: 550, y: 350 },
            fields: {
              create: [
                { name: "id", type: "String", constraints: [{ type: "id" }] },
                { name: "patientId", type: "String" },
                { name: "diagnosis", type: "String", isOptional: true },
                { name: "treatment", type: "String", isOptional: true },
                { name: "medications", type: "String", isList: true },
                { name: "allergies", type: "String", isList: true },
                { name: "recordDate", type: "DateTime" },
              ],
            },
          },
        ],
      },
    },
  });

  console.log("Hospital schema created:", hospitalSchema.id);

  console.log("✅ All schemas seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
