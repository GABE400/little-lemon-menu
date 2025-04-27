import { MenuItem } from "./database";

// GitHub endpoint URL
const API_URL =
  "https://raw.githubusercontent.com/Meta-Mobile-Developer-PC/Working-With-Data-API/main/capstone.json";

// Interface for the API response
interface ApiMenuItem {
  id: number;
  title: string;
  price: string;
  category: {
    title: string;
  };
}

interface ApiResponse {
  menu: ApiMenuItem[];
}

/**
 * Fetches menu items from the server
 * @returns {Promise<MenuItem[]>} - Array of menu items
 */
export async function fetchData(): Promise<MenuItem[]> {
  try {
    // Fetch data from the API
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = (await response.json()) as ApiResponse;

    // Transform the data to flatten the category
    const transformedData = data.menu.map((item) => ({
      id: item.id.toString(),
      title: item.title,
      price: item.price,
      category: item.category.title,
    }));

    return transformedData;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error;
  }
}

/**
 * Custom menu data with the specified categories
 */
export const customMenuItems: MenuItem[] = [
  // Appetizers
  {
    id: "1",
    title: "Spinach Artichoke Dip",
    price: "10.99",
    category: "Appetizers",
  },
  { id: "2", title: "Hummus", price: "8.99", category: "Appetizers" },
  {
    id: "3",
    title: "Fried Calamari Rings",
    price: "12.99",
    category: "Appetizers",
  },
  { id: "4", title: "Fried Mushroom", price: "9.99", category: "Appetizers" },

  // Salads
  { id: "5", title: "Greek Salad", price: "9.99", category: "Salads" },
  { id: "6", title: "Caesar Salad", price: "8.99", category: "Salads" },
  { id: "7", title: "Tuna Salad", price: "11.99", category: "Salads" },
  {
    id: "8",
    title: "Grilled Chicken Salad",
    price: "12.99",
    category: "Salads",
  },

  // Beverages (unchanged)
  { id: "9", title: "Water", price: "1.99", category: "Beverages" },
  { id: "10", title: "Coke", price: "2.99", category: "Beverages" },
  { id: "11", title: "Beer", price: "5.99", category: "Beverages" },
  { id: "12", title: "Ice Tea", price: "3.99", category: "Beverages" },
];
