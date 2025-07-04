
require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/item.js");
const Category = require("./models/category.js")
const User = require("./models/customer.js");

const seedItems = require("./seed/item.js")
const seedUsers = require("./seed/user.js")


const categories = [
  { name: "clothes" },
  { name: "car" },
  { name: "electronics" },
  { name: "stationary" },
  { name: "furniture" },
];
const categoryMap = {
  clothes: "6866bb594438c66fbff03dce",
  car: "6866bb654438c66fbff03ddf",
  electronics: "6866bb6c4438c66fbff03df0",
  stationary: "6866bb714438c66fbff03e01",
  furniture: "6866bb764438c66fbff03e12"
}



async function seedDB() {
  // 1. Clear categories and products
  // await Category.deleteMany();
  // await Product.deleteMany();

  // 2. Insert categories and keep mapping
  // const insertedCategories = await Category.insertMany(categories);
  // const categoryMap = {};
  // insertedCategories.forEach(cat => {
  //   categoryMap[cat.name] = cat._id;
  // });
  //
  // 3. Replace category names in seedItems with ObjectId


  const productsWithCategoryId = seedItems.seedItems.map(item => ({
    ...item,
    category: categoryMap[item.category], // <-- here
  }));
  console.log(productsWithCategoryId)

  // 4. Insert products
  await Product.insertMany(productsWithCategoryId);
  // await Product.save()
}
seedDB()
