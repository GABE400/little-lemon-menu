import { openDatabase, SQLiteDatabase } from "expo-sqlite";
import { Platform } from "react-native";
import { customMenuItems } from "./api"; // Import local fallback data

// Define the MenuItem interface
export interface MenuItem {
  id: string;
  title: string;
  price: string;
  category: string;
}

// Flag to track if SQLite is available
let isSQLiteAvailable = true;

// Open the database
let db: SQLiteDatabase;

try {
  if (Platform.OS === "web") {
    // SQLite is not available on web
    isSQLiteAvailable = false;
    db = {} as SQLiteDatabase;
  } else {
    // Try to open the database
    db = openDatabase("littlelemon.db");
  }
} catch (error) {
  console.error("Error opening database:", error);
  isSQLiteAvailable = false;
  db = {} as SQLiteDatabase;
}

// Create the menuitems table
export async function createTable(): Promise<void> {
  if (!isSQLiteAvailable) {
    console.log("SQLite not available, skipping table creation");
    return;
  }

  return new Promise<void>((resolve, reject) => {
    try {
      db.transaction(
        (tx) => {
          tx.executeSql(
            "CREATE TABLE IF NOT EXISTS menuitems (id TEXT PRIMARY KEY, title TEXT, price TEXT, category TEXT);",
            [],
            () => {
              console.log("Table created successfully");
              resolve();
            },
            (_, error) => {
              console.error("Error creating table:", error);
              isSQLiteAvailable = false; // Mark SQLite as unavailable
              resolve(); // Resolve anyway to continue the app flow
              return false;
            }
          );
        },
        (error) => {
          console.error("Transaction error:", error);
          isSQLiteAvailable = false; // Mark SQLite as unavailable
          resolve(); // Resolve anyway to continue the app flow
        }
      );
    } catch (error) {
      console.error("Unexpected error in createTable:", error);
      isSQLiteAvailable = false;
      resolve();
    }
  });
}

// Save menu items to the database
export async function saveMenuItems(menuItems: MenuItem[]): Promise<void> {
  if (!isSQLiteAvailable) {
    console.log("SQLite not available, skipping saving menu items");
    return;
  }

  return new Promise<void>((resolve, reject) => {
    try {
      db.transaction(
        (tx) => {
          // Create a single SQL statement to insert multiple rows
          const placeholders = menuItems.map(() => "(?, ?, ?, ?)").join(", ");
          const values = menuItems.flatMap((item) => [
            item.id,
            item.title,
            item.price,
            item.category,
          ]);

          const query = `INSERT OR REPLACE INTO menuitems (id, title, price, category) VALUES ${placeholders}`;

          tx.executeSql(
            query,
            values,
            () => {
              console.log("Menu items saved successfully");
              resolve();
            },
            (_, error) => {
              console.error("Error saving menu items:", error);
              isSQLiteAvailable = false; // Mark SQLite as unavailable
              resolve(); // Resolve anyway to continue the app flow
              return false;
            }
          );
        },
        (error) => {
          console.error("Transaction error:", error);
          isSQLiteAvailable = false; // Mark SQLite as unavailable
          resolve(); // Resolve anyway to continue the app flow
        }
      );
    } catch (error) {
      console.error("Unexpected error in saveMenuItems:", error);
      isSQLiteAvailable = false;
      resolve();
    }
  });
}

// Get all menu items from the database or fallback to local data
export async function getMenuItems(): Promise<MenuItem[]> {
  if (!isSQLiteAvailable) {
    console.log("SQLite not available, using local data");
    return customMenuItems; // Return local data as fallback
  }

  return new Promise<MenuItem[]>((resolve, reject) => {
    try {
      db.transaction(
        (tx) => {
          tx.executeSql(
            "SELECT * FROM menuitems;",
            [],
            (_, { rows }) => {
              if (rows._array.length > 0) {
                resolve(rows._array as MenuItem[]);
              } else {
                console.log("No items in database, using local data");
                resolve(customMenuItems); // Fallback to local data if database is empty
              }
            },
            (_, error) => {
              console.error("Error fetching menu items:", error);
              isSQLiteAvailable = false; // Mark SQLite as unavailable
              resolve(customMenuItems); // Fallback to local data
              return false;
            }
          );
        },
        (error) => {
          console.error("Transaction error:", error);
          isSQLiteAvailable = false; // Mark SQLite as unavailable
          resolve(customMenuItems); // Fallback to local data
        }
      );
    } catch (error) {
      console.error("Unexpected error in getMenuItems:", error);
      isSQLiteAvailable = false;
      resolve(customMenuItems);
    }
  });
}

// Filter menu items by category
export async function filterByCategory(category: string): Promise<MenuItem[]> {
  if (!isSQLiteAvailable) {
    console.log("SQLite not available, filtering local data by category");
    return customMenuItems.filter((item) => item.category === category);
  }

  return new Promise<MenuItem[]>((resolve, reject) => {
    try {
      db.transaction(
        (tx) => {
          tx.executeSql(
            "SELECT * FROM menuitems WHERE category = ?;",
            [category],
            (_, { rows }) => {
              if (rows._array.length > 0) {
                resolve(rows._array as MenuItem[]);
              } else {
                // If no results from database, filter local data
                const filteredItems = customMenuItems.filter(
                  (item) => item.category === category
                );
                resolve(filteredItems);
              }
            },
            (_, error) => {
              console.error("Error filtering menu items:", error);
              isSQLiteAvailable = false;
              // Fallback to filtering local data
              const filteredItems = customMenuItems.filter(
                (item) => item.category === category
              );
              resolve(filteredItems);
              return false;
            }
          );
        },
        (error) => {
          console.error("Transaction error:", error);
          isSQLiteAvailable = false;
          // Fallback to filtering local data
          const filteredItems = customMenuItems.filter(
            (item) => item.category === category
          );
          resolve(filteredItems);
        }
      );
    } catch (error) {
      console.error("Unexpected error in filterByCategory:", error);
      isSQLiteAvailable = false;
      const filteredItems = customMenuItems.filter(
        (item) => item.category === category
      );
      resolve(filteredItems);
    }
  });
}

// Search menu items by title
export async function searchMenuItems(searchTerm: string): Promise<MenuItem[]> {
  if (!isSQLiteAvailable) {
    console.log("SQLite not available, searching local data");
    return customMenuItems.filter((item) =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  return new Promise<MenuItem[]>((resolve, reject) => {
    try {
      db.transaction(
        (tx) => {
          tx.executeSql(
            "SELECT * FROM menuitems WHERE title LIKE ?;",
            [`%${searchTerm}%`],
            (_, { rows }) => {
              if (rows._array.length > 0) {
                resolve(rows._array as MenuItem[]);
              } else {
                // If no results from database, search local data
                const filteredItems = customMenuItems.filter((item) =>
                  item.title.toLowerCase().includes(searchTerm.toLowerCase())
                );
                resolve(filteredItems);
              }
            },
            (_, error) => {
              console.error("Error searching menu items:", error);
              isSQLiteAvailable = false;
              // Fallback to searching local data
              const filteredItems = customMenuItems.filter((item) =>
                item.title.toLowerCase().includes(searchTerm.toLowerCase())
              );
              resolve(filteredItems);
              return false;
            }
          );
        },
        (error) => {
          console.error("Transaction error:", error);
          isSQLiteAvailable = false;
          // Fallback to searching local data
          const filteredItems = customMenuItems.filter((item) =>
            item.title.toLowerCase().includes(searchTerm.toLowerCase())
          );
          resolve(filteredItems);
        }
      );
    } catch (error) {
      console.error("Unexpected error in searchMenuItems:", error);
      isSQLiteAvailable = false;
      const filteredItems = customMenuItems.filter((item) =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
      resolve(filteredItems);
    }
  });
}
