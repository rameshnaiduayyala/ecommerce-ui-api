import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seeding...");

  // 1. Seed Roles & Permissions
  const permissionsData = [
    { name: "ALL_PRIVILEGES", description: "Super Admin privileges" },
    { name: "READ_PRODUCTS", description: "Can view catalog products" },
    { name: "WRITE_PRODUCTS", description: "Can create/edit/delete products" },
    { name: "READ_ORDERS", description: "Can view customer orders" },
    { name: "WRITE_ORDERS", description: "Can manage orders status/shipments" },
    { name: "READ_INVENTORY", description: "Can view inventory logs" },
    { name: "WRITE_INVENTORY", description: "Can adjust stock levels" },
    { name: "READ_CUSTOMERS", description: "Can view customers and addresses" },
    { name: "WRITE_CMS", description: "Can edit CMS pages and blog posts" },
    { name: "MANAGE_COUPONS", description: "Can create/edit coupon codes" }
  ];

  const permissions = [];
  for (const perm of permissionsData) {
    const record = await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm
    });
    permissions.push(record);
  }
  console.log(`Seeded ${permissions.length} permissions.`);

  // Create Roles
  const rolesData = [
    { name: "Super Admin", description: "Root user with all permissions", isCustom: false, perms: ["ALL_PRIVILEGES"] },
    { name: "Admin", description: "Store administrator", isCustom: false, perms: ["READ_PRODUCTS", "WRITE_PRODUCTS", "READ_ORDERS", "WRITE_ORDERS", "READ_INVENTORY", "WRITE_INVENTORY", "READ_CUSTOMERS", "WRITE_CMS", "MANAGE_COUPONS"] },
    { name: "Warehouse Manager", description: "Manages stock and shipping", isCustom: true, perms: ["READ_INVENTORY", "WRITE_INVENTORY", "READ_ORDERS", "WRITE_ORDERS"] },
    { name: "Customer", description: "Standard end user customer", isCustom: false, perms: ["READ_PRODUCTS"] }
  ];

  const roles = {};
  for (const r of rolesData) {
    const roleRecord = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: { name: r.name, description: r.description, isCustom: r.isCustom }
    });
    roles[r.name] = roleRecord;

    // Link permissions to roles
    for (const pName of r.perms) {
      const perm = permissions.find(p => p.name === pName);
      if (perm) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: roleRecord.id,
              permissionId: perm.id
            }
          },
          update: {},
          create: {
            roleId: roleRecord.id,
            permissionId: perm.id
          }
        });
      }
    }
  }
  console.log("Seeded roles and mapped permissions.");

  // 2. Seed Users
  const saltRounds = 10;
  const hashPassword = async (pass) => await bcrypt.hash(pass, saltRounds);

  const adminPass = await hashPassword("AdminPassword123!");
  const customerPass = await hashPassword("CustomerPassword123!");

  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@ecommerce.com" },
    update: {},
    create: {
      email: "superadmin@ecommerce.com",
      password: adminPass,
      phone: "+15550100",
      firstName: "Super",
      lastName: "Admin",
      isEmailVerified: true,
      isPhoneVerified: true,
      roleId: roles["Super Admin"].id,
      status: "ACTIVE"
    }
  });

  const demoCustomer = await prisma.user.upsert({
    where: { email: "customer@ecommerce.com" },
    update: {},
    create: {
      email: "customer@ecommerce.com",
      password: customerPass,
      phone: "+15550200",
      firstName: "John",
      lastName: "Doe",
      isEmailVerified: true,
      isPhoneVerified: true,
      roleId: roles["Customer"].id,
      status: "ACTIVE"
    }
  });

  console.log("Seeded administrative and client users.");

  // Seed Customer Address
  const address = await prisma.address.upsert({
    where: { id: "a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1" }, // Arbitrary static UUID for upsert id stability
    update: {},
    create: {
      id: "a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1",
      userId: demoCustomer.id,
      addressName: "Home Address",
      firstName: "John",
      lastName: "Doe",
      phone: "+15550200",
      addressLine1: "123 Maple Street",
      city: "San Francisco",
      state: "California",
      country: "US",
      postalCode: "94102",
      isDefault: true
    }
  });

  // Seed wallets
  await prisma.wallet.upsert({
    where: { userId: demoCustomer.id },
    update: {},
    create: {
      userId: demoCustomer.id,
      balance: 500.00
    }
  });

  // 3. Seed Categories
  const categoriesData = [
    { name: "Electronics", slug: "electronics", isFeatured: true },
    { name: "Apparel & Fashion", slug: "apparel-fashion", isFeatured: true },
    { name: "Home & Garden", slug: "home-garden", isFeatured: false }
  ];

  const categories = {};
  for (const cat of categoriesData) {
    const record = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat
    });
    categories[cat.slug] = record;
  }

  // Seed nested categories
  const subCategoriesData = [
    { name: "Smartphones", slug: "smartphones", parentId: categories["electronics"].id },
    { name: "Laptops", slug: "laptops", parentId: categories["electronics"].id },
    { name: "Mens T-Shirts", slug: "mens-tshirts", parentId: categories["apparel-fashion"].id }
  ];

  for (const sub of subCategoriesData) {
    const record = await prisma.category.upsert({
      where: { slug: sub.slug },
      update: {},
      create: sub
    });
    categories[sub.slug] = record;
  }
  console.log("Seeded product categories tree.");

  // 4. Seed Brands
  const brandsData = [
    { name: "Apple", slug: "apple", description: "Think Different" },
    { name: "Nike", slug: "nike", description: "Just Do It" },
    { name: "Dell", slug: "dell", description: "The Power To Do More" }
  ];

  const brands = {};
  for (const b of brandsData) {
    const record = await prisma.brand.upsert({
      where: { slug: b.slug },
      update: {},
      create: b
    });
    brands[b.slug] = record;
  }
  console.log("Seeded brands.");

  // 5. Seed Settings
  const settingsData = [
    { key: "store_name", value: { text: "Enterprise E-Commerce" }, group: "GENERAL", description: "Name of the e-commerce store" },
    { key: "default_currency", value: { currency: "USD", symbol: "$" }, group: "GENERAL", description: "Base store currency" },
    { key: "enable_guest_checkout", value: { enabled: true }, group: "CHECKOUT", description: "Allow checkouts without login" },
    { key: "tax_rate", value: { rate: 18.0 }, group: "TAX", description: "Standard HSN/GST tax percentage" }
  ];

  for (const s of settingsData) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value, description: s.description },
      create: s
    });
  }
  console.log("Seeded system settings.");

  // 6. Seed Coupons
  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: {
      code: "WELCOME10",
      type: "PERCENTAGE",
      value: 10.0,
      minOrderAmount: 50.0,
      maxDiscountAmount: 20.0,
      usageLimit: 1000,
      perUserLimit: 1,
      startsAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      status: "ACTIVE"
    }
  });

  // 7. Seed Warehouses
  const primaryWarehouse = await prisma.warehouse.upsert({
    where: { code: "WH-NORTH-01" },
    update: {},
    create: {
      name: "Primary Northern Warehouse",
      code: "WH-NORTH-01",
      address: "456 Industrial Blvd, Chicago, IL"
    }
  });
  console.log("Seeded warehouses.");

  // 8. Seed Products & Variants
  const laptopProduct = await prisma.product.upsert({
    where: { slug: "dell-xps-15" },
    update: {},
    create: {
      name: "Dell XPS 15 Laptop",
      slug: "dell-xps-15",
      description: "Dell XPS 15 high performance developer laptop.",
      baseSku: "DELL-XPS-15-BASE",
      basePrice: 1499.99,
      brandId: brands["dell"].id,
      hsn: "84713010",
      gst: 18.0,
      status: "PUBLISHED",
      countryOrigin: "US",
      categories: {
        create: [
          { categoryId: categories["laptops"].id }
        ]
      },
      images: {
        create: [
          { url: "/uploads/products/dell-xps-15-thumbnail.webp", type: "THUMBNAIL", altText: "Dell XPS 15" }
        ]
      },
      attributes: {
        create: [
          { name: "RAM", values: ["16GB", "32GB"] },
          { name: "Storage", values: ["512GB SSD", "1TB SSD"] }
        ]
      }
    }
  });

  // Seed variants for Dell XPS 15
  const variant1 = await prisma.productVariant.upsert({
    where: { sku: "DELL-XPS-15-V1" },
    update: {},
    create: {
      productId: laptopProduct.id,
      sku: "DELL-XPS-15-V1",
      price: 1499.99,
      weight: 1.8,
      attributeValues: { RAM: "16GB", Storage: "512GB SSD" },
      images: {
        create: [
          {
            url: "/uploads/products/dell-xps-15-v1-silver.webp",
            altText: "Dell XPS 15 16GB RAM Silver Variant",
            productId: laptopProduct.id
          }
        ]
      }
    }
  });

  const variant2 = await prisma.productVariant.upsert({
    where: { sku: "DELL-XPS-15-V2" },
    update: {},
    create: {
      productId: laptopProduct.id,
      sku: "DELL-XPS-15-V2",
      price: 1899.99,
      weight: 1.8,
      attributeValues: { RAM: "32GB", Storage: "1TB SSD" },
      images: {
        create: [
          {
            url: "/uploads/products/dell-xps-15-v2-grey.webp",
            altText: "Dell XPS 15 32GB RAM Grey Variant",
            productId: laptopProduct.id
          }
        ]
      }
    }
  });

  // Seed inventory for variants
  await prisma.inventory.upsert({
    where: {
      warehouseId_variantId: {
        warehouseId: primaryWarehouse.id,
        variantId: variant1.id
      }
    },
    update: {},
    create: {
      warehouseId: primaryWarehouse.id,
      variantId: variant1.id,
      physicalStock: 50,
      reservedStock: 2,
      availableStock: 48,
      minStock: 5,
      maxStock: 100
    }
  });

  await prisma.inventory.upsert({
    where: {
      warehouseId_variantId: {
        warehouseId: primaryWarehouse.id,
        variantId: variant2.id
      }
    },
    update: {},
    create: {
      warehouseId: primaryWarehouse.id,
      variantId: variant2.id,
      physicalStock: 25,
      reservedStock: 0,
      availableStock: 25,
      minStock: 3,
      maxStock: 50
    }
  });

  console.log("Seeded products, variants, and stock balances.");

  // 9. Seed Demo Order
  const demoOrder = await prisma.order.upsert({
    where: { orderNumber: "ORD-2026-0001" },
    update: {},
    create: {
      orderNumber: "ORD-2026-0001",
      userId: demoCustomer.id,
      status: "PENDING",
      subtotal: 1499.99,
      taxAmount: 269.99,
      shippingAmount: 15.0,
      discountAmount: 0.0,
      totalAmount: 1784.98,
      shippingAddressId: address.id,
      billingAddressId: address.id,
      paymentStatus: "PENDING",
      paymentMethod: "STRIPE",
      items: {
        create: [
          {
            variantId: variant1.id,
            sku: "DELL-XPS-15-V1",
            name: "Dell XPS 15 Laptop (16GB RAM, 512GB SSD)",
            quantity: 1,
            unitPrice: 1499.99,
            taxAmount: 269.99,
            discountAmount: 0.0,
            totalAmount: 1769.98
          }
        ]
      },
      statusHistory: {
        create: [
          { status: "PENDING", notes: "Order placed by customer." }
        ]
      }
    }
  });
  console.log(`Seeded demo order ${demoOrder.orderNumber}.`);

  console.log("Database seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
