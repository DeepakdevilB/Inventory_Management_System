/**
 *  Export Script
 * 
 * This script simulates exporting inventory data to Hadoop HDFS.
 * In a real-world scenario, you would use Hadoop's API or command-line tools.
 */

const fs = require('fs-extra');
const path = require('path');
const { Parser } = require('json2csv');
const mongoose = require('mongoose');

// MongoDB connection URI
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/inventory-management';

// Define item schema
const itemSchema = new mongoose.Schema({
  name: String,
  category: String,
  quantity: Number,
  price: Number,
  supplier: String,
  dateAdded: Date
});

const Item = mongoose.model('Item', itemSchema);

// Simulated HDFS path (in a real environment, this would be a Hadoop HDFS path)
const HDFS_PATH = path.join(__dirname, 'hdfs_simulation');

/**
 * Export data from MongoDB to simulated HDFS
 */
const exportToHDFS = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Get all items
    console.log('Fetching inventory items...');
    const items = await Item.find();
    console.log(`Found ${items.length} items to export`);
    
    if (items.length === 0) {
      console.log('No items to export');
      await mongoose.disconnect();
      return;
    }
    
    // Define CSV fields
    const fields = [
      { label: 'ID', value: '_id' },
      { label: 'Name', value: 'name' },
      { label: 'Category', value: 'category' },
      { label: 'Quantity', value: 'quantity' },
      { label: 'Price', value: 'price' },
      { label: 'Supplier', value: 'supplier' },
      { label: 'Date Added', value: 'dateAdded' }
    ];
    
    // Convert to CSV
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(items);
    
    // Create simulation directory if it doesn't exist
    console.log('Creating HDFS simulation directory...');
    await fs.ensureDir(HDFS_PATH);
    
    // Write CSV to simulated HDFS
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = path.join(HDFS_PATH, `inventory_export_${timestamp}.csv`);
    
    console.log(`Writing data to ${filePath}...`);
    await fs.writeFile(filePath, csv);
    
    // Simulate running a MapReduce job
    console.log('Simulating MapReduce job...');
    await simulateMapReduce(filePath, items);
    
    console.log('Export complete!');
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('Export error:', error);
    try {
      await mongoose.disconnect();
    } catch (disconnectError) {
      console.error('Error disconnecting from MongoDB:', disconnectError);
    }
  }
};

/**
 * Simulate a MapReduce job on the exported data
 */
const simulateMapReduce = async (filePath, items) => {
  // In a real environment, you would execute Hadoop MapReduce jobs
  // This is just a simulation for demonstration purposes
  
  // Create a simple analysis file
  const analysis = {
    totalItems: items.length,
    totalValue: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    categoryCounts: {},
    supplierCounts: {},
    averagePrice: items.reduce((sum, item) => sum + item.price, 0) / items.length,
    timestamp: new Date().toISOString()
  };
  
  // Count items by category
  items.forEach(item => {
    if (!analysis.categoryCounts[item.category]) {
      analysis.categoryCounts[item.category] = 0;
    }
    analysis.categoryCounts[item.category]++;
  });
  
  // Count items by supplier
  items.forEach(item => {
    if (!analysis.supplierCounts[item.supplier]) {
      analysis.supplierCounts[item.supplier] = 0;
    }
    analysis.supplierCounts[item.supplier]++;
  });
  
  // Write analysis to file (simulating MapReduce output)
  const analysisPath = path.join(HDFS_PATH, 'analysis_results.json');
  await fs.writeFile(analysisPath, JSON.stringify(analysis, null, 2));
  
  console.log('MapReduce simulation complete');
  console.log('Analysis file created at:', analysisPath);
  console.log('Summary:');
  console.log(`- Total items: ${analysis.totalItems}`);
  console.log(`- Total inventory value: $${analysis.totalValue.toFixed(2)}`);
  console.log(`- Average price: $${analysis.averagePrice.toFixed(2)}`);
  console.log(`- Categories analyzed: ${Object.keys(analysis.categoryCounts).length}`);
  console.log(`- Suppliers analyzed: ${Object.keys(analysis.supplierCounts).length}`);
};

// Execute the export if this script is run directly
if (require.main === module) {
  console.log('Starting Hadoop export process...');
  exportToHDFS().then(() => {
    console.log('Export process finished');
  }).catch(err => {
    console.error('Export process failed:', err);
    process.exit(1);
  });
}

module.exports = { exportToHDFS }; 