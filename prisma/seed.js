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