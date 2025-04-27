// Simulated API endpoint for menu items
const API_URL =
  "https://raw.githubusercontent.com/Meta-Mobile-Developer-PC/Working-With-Data-API/main/capstone.json";

// Fallback data in case the API call fails
const FALLBACK_DATA = [
  { id: "1", title: "Bruschetta", price: "7.99", category: "Appetizers" },
  {
    id: "2",
    title: "Spinach Artichoke Dip",
    price: "10.99",
    category: "Appetizers",
  },
  {
    id: "3",
    title: "Stuffed Mushrooms",
    price: "9.99",
    category: "Appetizers",
  },
  { id: "4", title: "Grilled Salmon", price: "19.99", category: "Main Dishes" },
  {
    id: "5",
    title: "Chicken Parmesan",
    price: "16.99",
    category: "Main Dishes",
  },
  {
    id: "6",
    title: "Beef Tenderloin",
    price: "25.99",
    category: "Main Dishes",
  },
  {
    id: "7",
    title: "Garlic Mashed Potatoes",
    price: "4.99",
    category: "Sides",
  },
  { id: "8", title: "Steamed Vegetables", price: "3.99", category: "Sides" },
  { id: "9", title: "Caesar Salad", price: "5.99", category: "Sides" },
  {
    id: "10",
    title: "Chocolate Lava Cake",
    price: "8.99",
    category: "Desserts",
  },
  { id: "11", title: "Tiramisu", price: "7.99", category: "Desserts" },
  { id: "12", title: "Cheesecake", price: "6.99", category: "Desserts" },
];

/**
 * Fetches menu items from the server
 * @returns {Promise<Array>} - Array of menu items
 */
export async function fetchMenuItems() {
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();

    // Transform the API response to match our data structure
    return data.menu.map((item, index) => ({
      id: item.id.toString(),
      title: item.title,
      price: item.price.toString(),
      category: item.category,
    }));
  } catch (error) {
    console.error("Error fetching menu items:", error);
    console.log("Using fallback data instead");
    // Return fallback data if the API call fails
    return FALLBACK_DATA;
  }
}
