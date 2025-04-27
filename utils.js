// Sample data structure that the SectionList expects
export const SECTION_LIST_MOCK_DATA = [
  {
    title: 'Appetizers',
    data: [
      { id: '1', title: 'Spinach Artichoke Dip', price: '10.99' },
      { id: '2', title: 'Bruschetta', price: '7.99' },
      { id: '3', title: 'Stuffed Mushrooms', price: '9.99' },
    ],
  },
  {
    title: 'Main Dishes',
    data: [
      { id: '4', title: 'Grilled Salmon', price: '19.99' },
      { id: '5', title: 'Chicken Parmesan', price: '16.99' },
      { id: '6', title: 'Beef Tenderloin', price: '25.99' },
    ],
  },
  {
    title: 'Sides',
    data: [
      { id: '7', title: 'Garlic Mashed Potatoes', price: '4.99' },
      { id: '8', title: 'Steamed Vegetables', price: '3.99' },
      { id: '9', title: 'Caesar Salad', price: '5.99' },
    ],
  },
  {
    title: 'Desserts',
    data: [
      { id: '10', title: 'Chocolate Lava Cake', price: '8.99' },
      { id: '11', title: 'Tiramisu', price: '7.99' },
      { id: '12', title: 'Cheesecake', price: '6.99' },
    ],
  },
];

/**
 * Transforms raw menu item data from the database into the format expected by SectionList
 * @param {Array} data - Raw menu item data from the database
 * @returns {Array} - Data formatted for SectionList with sections by category
 */
export function getSectionListData(data) {
  // Group the menu items by category
  const groupedData = data.reduce((acc, item) => {
    // If this category doesn't exist in our accumulator yet, create it
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    
    // Add the current item to its category array
    acc[item.category].push({
      id: item.id,
      title: item.title,
      price: item.price,
    });
    
    return acc;
  }, {});
  
  // Convert the grouped data object into an array of section objects
  // Each section has a title (category) and data array (menu items)
  const sectionListData = Object.entries(groupedData).map(([category, items]) => {
    return {
      title: category,
      data: items,
    };
  });
  
  return sectionListData;
}
