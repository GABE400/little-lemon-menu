import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  SectionList,
  TextInput,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from "react-native";

// Define interfaces
interface MenuItem {
  id: string;
  title: string;
  price: string;
  category: string;
}

interface SectionData {
  title: string;
  data: MenuItem[];
}

// Sample menu data
const MENU_ITEMS: MenuItem[] = [
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

// Function to transform data for SectionList
function getSectionListData(data: MenuItem[]): SectionData[] {
  // Group the menu items by category
  const groupedData = data.reduce<Record<string, MenuItem[]>>((acc, item) => {
    // If this category doesn't exist in our accumulator yet, create it
    if (!acc[item.category]) {
      acc[item.category] = [];
    }

    // Add the current item to its category array
    acc[item.category].push(item);

    return acc;
  }, {});

  // Convert the grouped data object into an array of section objects
  const sectionListData = Object.entries(groupedData).map(
    ([category, items]) => {
      return {
        title: category,
        data: items,
      };
    }
  );

  return sectionListData;
}

export default function App() {
  const [searchText, setSearchText] = useState("");
  const [data, setData] = useState<SectionData[]>([]);
  const [filteredData, setFilteredData] = useState<SectionData[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<
    Record<string, boolean>
  >({});
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<"api" | "database" | "local">(
    "api"
  );

  // Initialize database and fetch data
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Import database functions
        const {
          createTable,
          saveMenuItems,
          getMenuItems,
        } = require("./database");

        // Import API functions
        const { fetchData } = require("./api");

        // Create the database table (will be skipped if SQLite is not available)
        try {
          await createTable();
        } catch (dbError) {
          console.error("Error creating database table:", dbError);
          // Continue execution - we'll try API next
        }

        // Try to fetch data from the API
        let menuItems = [];
        try {
          // Show loading message for API
          setIsLoading(true);
          setError(null);

          // Fetch data from API
          menuItems = await fetchData();
          setDataSource("api");
          console.log("Successfully fetched data from API");

          // Try to save to SQLite (will be skipped if SQLite is not available)
          try {
            await saveMenuItems(menuItems);
            console.log("Successfully saved data to database");
          } catch (saveError) {
            console.error("Error saving to database:", saveError);
            // Continue execution - we already have data from API
          }
        } catch (apiError) {
          console.error("Error fetching from API:", apiError);

          // Try to get data from database
          try {
            setIsLoading(true);
            setError("Could not fetch from API. Trying database...");

            const dbItems = await getMenuItems();

            if (dbItems && dbItems.length > 0) {
              menuItems = dbItems;
              setDataSource("database");
              console.log("Successfully retrieved data from database");
              setError(null);
            } else {
              throw new Error("No data in database");
            }
          } catch (dbGetError) {
            console.error("Error getting data from database:", dbGetError);

            // Fallback to local data
            setIsLoading(true);
            setError(
              "Could not fetch from API or database. Using local data..."
            );

            menuItems = MENU_ITEMS;
            setDataSource("local");
            console.log("Using local data as fallback");

            // Clear error after 3 seconds
            setTimeout(() => setError(null), 3000);
          }
        }

        // Process the menu items (from whichever source we got them)
        const items = menuItems;

        // Extract unique categories
        const uniqueCategories = [
          ...new Set(items.map((item) => item.category)),
        ];
        setCategories(uniqueCategories);

        // Initialize selected categories (all selected by default)
        const initialCategories: Record<string, boolean> = {};
        uniqueCategories.forEach((category) => {
          initialCategories[category] = true;
        });
        setSelectedCategories(initialCategories);

        // Transform the raw data into the format expected by SectionList
        const sectionListData = getSectionListData(items);
        setData(sectionListData);
        setFilteredData(sectionListData);
      } catch (error) {
        console.error("Error initializing app:", error);
        setError("An unexpected error occurred. Using local data.");

        // Fallback to local data if everything else fails
        const uniqueCategories = [
          ...new Set(MENU_ITEMS.map((item) => item.category)),
        ];
        setCategories(uniqueCategories);

        const initialCategories: Record<string, boolean> = {};
        uniqueCategories.forEach((category) => {
          initialCategories[category] = true;
        });
        setSelectedCategories(initialCategories);

        const sectionListData = getSectionListData(MENU_ITEMS);
        setData(sectionListData);
        setFilteredData(sectionListData);
        setDataSource("local");

        // Clear error after 5 seconds
        setTimeout(() => setError(null), 5000);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Filter data based on search text and selected categories
  useEffect(() => {
    if (!data.length) return;

    // Add a small delay to show loading state for better UX
    const filterTimeout = setTimeout(() => {
      const filterData = async () => {
        try {
          setIsFiltering(true);

          // Import database functions
          const { getMenuItems } = require("./database");

          // Get all menu items (from SQLite if available, otherwise from local data)
          const allItems = await getMenuItems();

          // Filter items based on search text and selected categories
          const filteredItems = allItems.filter((item) => {
            const matchesSearch = item.title
              .toLowerCase()
              .includes(searchText.toLowerCase());
            const categoryIsSelected = selectedCategories[item.category];
            return matchesSearch && categoryIsSelected;
          });

          // Transform filtered items into section list format
          const filteredSections = getSectionListData(filteredItems);
          setFilteredData(filteredSections);
        } catch (error) {
          console.error("Error filtering data:", error);

          // Fallback to filtering local data if everything else fails
          const filteredItems = MENU_ITEMS.filter((item) => {
            const matchesSearch = item.title
              .toLowerCase()
              .includes(searchText.toLowerCase());
            const categoryIsSelected = selectedCategories[item.category];
            return matchesSearch && categoryIsSelected;
          });

          const filteredSections = getSectionListData(filteredItems);
          setFilteredData(filteredSections);
        } finally {
          setIsFiltering(false);
        }
      };

      filterData();
    }, 300); // 300ms delay for better UX

    // Cleanup function to clear the timeout if the component unmounts or dependencies change
    return () => clearTimeout(filterTimeout);
  }, [searchText, selectedCategories, data]);

  // Get icon for category
  const getCategoryIcon = (category: string): string => {
    switch (category) {
      case "Appetizers":
        return "🍲";
      case "Salads":
        return "🥗";
      case "Beverages":
        return "🥤";
      default:
        return "🍽️";
    }
  };

  // Toggle category selection
  const toggleCategory = (category: string) => {
    // Add haptic feedback if available
    if (
      typeof window !== "undefined" &&
      "navigator" in window &&
      "vibrate" in navigator
    ) {
      navigator.vibrate(50); // Short vibration for feedback
    }

    setSelectedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  // Render a menu item
  const renderItem = ({ item }: { item: MenuItem }) => (
    <TouchableOpacity
      style={styles.menuItem}
      activeOpacity={0.7}
      onPress={() => {
        // In a real app, this would navigate to a detail screen
        alert(`You selected ${item.title}`);
      }}
    >
      <View style={styles.menuItemContent}>
        <Text style={styles.menuItemTitle}>{item.title}</Text>
        <View style={styles.menuItemPriceContainer}>
          <Text style={styles.menuItemPrice}>${item.price}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render a section header
  const renderSectionHeader = ({
    section: { title },
  }: {
    section: { title: string };
  }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>
        {getCategoryIcon(title)} {title}
      </Text>
      <View style={styles.sectionHeaderLine} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Little Lemon</Text>
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Data Source Indicator */}
      {!isLoading && (
        <View style={styles.dataSourceContainer}>
          <Text style={styles.dataSourceText}>
            Data source:{" "}
            {dataSource === "api"
              ? "Server API"
              : dataSource === "database"
              ? "Local Database"
              : "Local Fallback"}
          </Text>
        </View>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F4CE14" />
          <Text style={styles.loadingText}>Loading menu...</Text>
        </View>
      ) : (
        <>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search menu items..."
                value={searchText}
                onChangeText={setSearchText}
                placeholderTextColor="#888"
                returnKeyType="search"
                clearButtonMode="while-editing"
              />
              {searchText.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => setSearchText("")}
                  activeOpacity={0.7}
                >
                  <Text style={styles.clearButtonText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            {searchText.length > 0 && (
              <Text style={styles.searchResultsText}>
                Showing results for "{searchText}"
              </Text>
            )}
          </View>

          {/* Category Filters */}
          <View style={styles.categoriesContainer}>
            <Text style={styles.categoriesTitle}>CATEGORIES</Text>
            <View style={styles.categoriesRow}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    selectedCategories[category]
                      ? styles.categoryButtonSelected
                      : {},
                  ]}
                  onPress={() => toggleCategory(category)}
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      selectedCategories[category]
                        ? styles.categoryButtonTextSelected
                        : {},
                    ]}
                  >
                    {getCategoryIcon(category)} {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Filtering Indicator */}
          {isFiltering && (
            <View style={styles.filteringContainer}>
              <ActivityIndicator size="small" color="#F4CE14" />
              <Text style={styles.filteringText}>Updating results...</Text>
            </View>
          )}

          {/* Menu List */}
          <SectionList
            sections={filteredData}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            renderSectionHeader={renderSectionHeader}
            stickySectionHeadersEnabled={true}
            style={[
              styles.sectionList,
              isFiltering && styles.sectionListFiltering,
            ]}
            ListEmptyComponent={
              <View style={styles.emptyListContainer}>
                <Text style={styles.emptyListText}>No menu items found</Text>
                <Text style={styles.emptyListSubText}>
                  Try changing your search or filters
                </Text>
              </View>
            }
            ListHeaderComponent={
              <View style={styles.listHeader}>
                <Text style={styles.resultCount}>
                  {filteredData.reduce(
                    (count, section) => count + section.data.length,
                    0
                  )}{" "}
                  items found
                </Text>
              </View>
            }
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#495E57", // Little Lemon green background
  },
  header: {
    backgroundColor: "#495E57",
    padding: 16,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#F4CE14", // Little Lemon yellow
  },
  // Error message styles
  errorContainer: {
    backgroundColor: "#FF8A80", // Light red background
    padding: 10,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: "#C41C00", // Dark red text
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  // Data source indicator styles
  dataSourceContainer: {
    backgroundColor: "#81C784", // Light green background
    padding: 6,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  dataSourceText: {
    color: "#2E7D32", // Dark green text
    fontSize: 12,
    fontWeight: "bold",
  },
  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#fff",
  },
  // Empty list styles
  emptyListContainer: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  emptyListText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  emptyListSubText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  searchContainer: {
    padding: 16,
    paddingTop: 8,
    backgroundColor: "#495E57",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    paddingHorizontal: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
    color: "#666",
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: "#333",
  },
  clearButton: {
    padding: 6,
    borderRadius: 15,
    backgroundColor: "#EEEEEE",
    justifyContent: "center",
    alignItems: "center",
    width: 24,
    height: 24,
  },
  clearButtonText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "bold",
  },
  searchResultsText: {
    color: "#EEEEEE",
    fontSize: 12,
    marginTop: 8,
    marginLeft: 4,
    fontStyle: "italic",
  },
  categoriesContainer: {
    padding: 16,
    paddingTop: 8,
    backgroundColor: "#495E57",
  },
  categoriesTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#fff",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  categoriesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
    marginBottom: 8,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#3A474E",
    marginRight: 10,
    marginBottom: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    borderWidth: 1,
    borderColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 90,
  },
  categoryButtonSelected: {
    backgroundColor: "#F4CE14",
    borderColor: "#E4AE04",
    shadowColor: "#E4AE04",
    shadowOpacity: 0.4,
    transform: [{ scale: 1.05 }],
  },
  categoryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  categoryButtonTextSelected: {
    color: "#333",
    fontWeight: "bold",
  },
  filteringContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(73, 94, 87, 0.9)",
    padding: 8,
    borderRadius: 20,
    position: "absolute",
    top: 10,
    alignSelf: "center",
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  filteringText: {
    color: "#fff",
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
  },
  sectionList: {
    flex: 1,
    backgroundColor: "#fff",
  },
  sectionListFiltering: {
    opacity: 0.7,
  },
  listHeader: {
    padding: 10,
    backgroundColor: "#F5F5F5",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  resultCount: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
    textAlign: "center",
  },
  sectionHeader: {
    backgroundColor: "#F4CE14", // Little Lemon yellow
    padding: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#E4AE04",
  },
  sectionHeaderText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    letterSpacing: 0.5,
  },
  sectionHeaderLine: {
    height: 2,
    backgroundColor: "#E4AE04",
    marginTop: 8,
    width: "30%",
    borderRadius: 1,
  },
  menuItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
  },
  menuItemContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  menuItemTitle: {
    fontSize: 16,
    color: "#333",
    flex: 1,
    fontWeight: "500",
  },
  menuItemPriceContainer: {
    backgroundColor: "#EEFBF2",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D0EFD8",
  },
  menuItemPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#495E57", // Little Lemon green
  },
});
