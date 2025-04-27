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

  // Initialize database and fetch data
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsLoading(true);

        // Import database functions
        const {
          createTable,
          saveMenuItems,
          getMenuItems,
        } = require("./database");

        // Import API functions
        const { fetchData } = require("./api");

        // Create the database table (will be skipped if SQLite is not available)
        await createTable();

        // Try to fetch data from the API
        let menuItems = [];
        try {
          menuItems = await fetchData();

          // Try to save to SQLite (will be skipped if SQLite is not available)
          await saveMenuItems(menuItems);
        } catch (apiError) {
          console.error("Error fetching from API:", apiError);
          // If API fetch fails, we'll rely on getMenuItems to provide fallback data
        }

        // Get menu items (from SQLite if available, otherwise from local data)
        const items = await getMenuItems();

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
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Filter data based on search text and selected categories
  useEffect(() => {
    if (!data.length) return;

    const filterData = async () => {
      try {
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
      }
    };

    filterData();
  }, [searchText, selectedCategories, data]);

  // Toggle category selection
  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  // Render a menu item
  const renderItem = ({ item }: { item: MenuItem }) => (
    <View style={styles.menuItem}>
      <Text style={styles.menuItemTitle}>{item.title}</Text>
      <Text style={styles.menuItemPrice}>${item.price}</Text>
    </View>
  );

  // Render a section header
  const renderSectionHeader = ({
    section: { title },
  }: {
    section: { title: string };
  }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Little Lemon</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F4CE14" />
          <Text style={styles.loadingText}>Loading menu...</Text>
        </View>
      ) : (
        <>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search menu items..."
              value={searchText}
              onChangeText={setSearchText}
              placeholderTextColor="#888"
            />
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
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Menu List */}
          <SectionList
            sections={filteredData}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            renderSectionHeader={renderSectionHeader}
            stickySectionHeadersEnabled={true}
            style={styles.sectionList}
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
  searchContainer: {
    padding: 16,
    backgroundColor: "#495E57",
  },
  searchInput: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    fontSize: 16,
  },
  categoriesContainer: {
    padding: 16,
    backgroundColor: "#495E57",
  },
  categoriesTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#fff",
  },
  categoriesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#3A474E",
    marginRight: 8,
    marginBottom: 8,
  },
  categoryButtonSelected: {
    backgroundColor: "#F4CE14",
  },
  categoryButtonText: {
    color: "#fff",
    fontSize: 14,
  },
  categoryButtonTextSelected: {
    color: "#333",
  },
  sectionList: {
    flex: 1,
    backgroundColor: "#fff",
  },
  sectionHeader: {
    backgroundColor: "#F4CE14", // Little Lemon yellow
    padding: 10,
  },
  sectionHeaderText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
  },
  menuItemTitle: {
    fontSize: 16,
    color: "#333",
  },
  menuItemPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#495E57", // Little Lemon green
  },
});
