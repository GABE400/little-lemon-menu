// Since we're having issues with SQLite, let's use a simple in-memory database for now
// This is a simplified version that mimics the SQLite interface

// In-memory database
const menuItemsStore = [];

// Mock database object
const db = {
  transaction: (callback, errorCallback, successCallback) => {
    try {
      const tx = {
        executeSql: (query, params, successCallback, errorCallback) => {
          // Simple query parser to handle basic operations
          if (query.includes("CREATE TABLE")) {
            // CREATE TABLE operation - do nothing, table is "created"
            successCallback && successCallback(tx, { rows: { _array: [] } });
          } else if (query.includes("INSERT INTO")) {
            // INSERT operation
            if (query.includes("menuitems")) {
              const item = {
                id: params[0],
                title: params[1],
                price: params[2],
                category: params[3],
              };
              menuItemsStore.push(item);
              successCallback && successCallback(tx, { rows: { _array: [] } });
            }
          } else if (query.includes("SELECT")) {
            // SELECT operation
            if (query.includes("COUNT(*)")) {
              // Count query
              successCallback &&
                successCallback(tx, {
                  rows: { _array: [{ count: menuItemsStore.length }] },
                });
            } else if (query.includes("SELECT * FROM menuitems")) {
              // Filter query
              let filteredItems = [...menuItemsStore];

              // Apply search filter
              if (params.length > 0 && query.includes("title LIKE ?")) {
                const searchTerm = params[0].replace(/%/g, "").toLowerCase();
                filteredItems = filteredItems.filter((item) =>
                  item.title.toLowerCase().includes(searchTerm)
                );
                params.shift(); // Remove the search term from params
              }

              // Apply category filter
              if (params.length > 0 && query.includes("category IN")) {
                filteredItems = filteredItems.filter((item) =>
                  params.includes(item.category)
                );
              }

              successCallback &&
                successCallback(tx, { rows: { _array: filteredItems } });
            }
          }
        },
      };

      callback(tx);
      successCallback && successCallback();
    } catch (error) {
      errorCallback && errorCallback(error);
    }
  },
};

// Initialize the database
export function initDatabase() {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        // Create the menuitems table if it doesn't exist
        tx.executeSql(
          "CREATE TABLE IF NOT EXISTS menuitems (id TEXT PRIMARY KEY, title TEXT, price TEXT, category TEXT);",
          [],
          () => {
            console.log("Table created successfully");
          },
          (_, error) => {
            console.error("Error creating table:", error);
            reject(error);
            return false;
          }
        );
      },
      (error) => {
        console.error("Transaction error:", error);
        reject(error);
      },
      () => {
        console.log("Database initialized successfully");
        resolve();
      }
    );
  });
}

// Insert menu items into the database
export function insertMenuItems(menuItems) {
  return new Promise((resolve, reject) => {
    // First, check if there are already items in the database
    db.transaction((tx) => {
      tx.executeSql(
        "SELECT COUNT(*) as count FROM menuitems;",
        [],
        (_, { rows }) => {
          const count = rows._array[0].count;

          // If there are no items, insert the new ones
          if (count === 0) {
            db.transaction(
              (tx) => {
                menuItems.forEach((item) => {
                  tx.executeSql(
                    "INSERT INTO menuitems (id, title, price, category) VALUES (?, ?, ?, ?);",
                    [item.id, item.title, item.price, item.category],
                    () => {
                      console.log(`Inserted item: ${item.title}`);
                    },
                    (_, error) => {
                      console.error("Error inserting item:", error);
                      return false;
                    }
                  );
                });
              },
              (error) => {
                console.error("Transaction error:", error);
                reject(error);
              },
              () => {
                console.log("All items inserted successfully");
                resolve();
              }
            );
          } else {
            console.log("Database already has items, skipping insertion");
            resolve();
          }
        },
        (_, error) => {
          console.error("Error checking item count:", error);
          reject(error);
          return false;
        }
      );
    });
  });
}

// Get all menu items from the database
export function getMenuItems() {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          "SELECT * FROM menuitems;",
          [],
          (_, { rows }) => {
            resolve(rows._array);
          },
          (_, error) => {
            console.error("Error fetching menu items:", error);
            reject(error);
            return false;
          }
        );
      },
      (error) => {
        console.error("Transaction error:", error);
        reject(error);
      }
    );
  });
}

// Filter menu items by search text and categories
export function filterMenuItems(searchText, selectedCategories) {
  return new Promise((resolve, reject) => {
    // Build the SQL query based on the filters
    let query = "SELECT * FROM menuitems WHERE 1=1";
    const params = [];

    // Add search filter if searchText is provided
    if (searchText && searchText.trim() !== "") {
      query += " AND title LIKE ?";
      params.push(`%${searchText}%`);
    }

    // Add category filter if selectedCategories is provided
    if (selectedCategories && Object.keys(selectedCategories).length > 0) {
      const selectedCategoryNames = Object.entries(selectedCategories)
        .filter(([_, isSelected]) => isSelected)
        .map(([category]) => category);

      if (selectedCategoryNames.length > 0) {
        query += " AND category IN (";
        query += selectedCategoryNames.map(() => "?").join(",");
        query += ")";
        params.push(...selectedCategoryNames);
      }
    }

    db.transaction(
      (tx) => {
        tx.executeSql(
          query,
          params,
          (_, { rows }) => {
            resolve(rows._array);
          },
          (_, error) => {
            console.error("Error filtering menu items:", error);
            reject(error);
            return false;
          }
        );
      },
      (error) => {
        console.error("Transaction error:", error);
        reject(error);
      }
    );
  });
}
