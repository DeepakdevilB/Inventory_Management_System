# Inventory Management System

A simple inventory management system web application with MongoDB, Node.js (Express), and Hadoop integration.

## Features

- Full CRUD operations for inventory items
- Responsive Bootstrap UI
- MongoDB database for persistent storage
- Simulated Hadoop integration for data export and analysis

## Project Structure

```
inventory-management/
├── frontend/                  # Frontend files
│   ├── index.html            # Main HTML page
│   ├── css/                  # CSS files
│   │   └── style.css         # Custom styles
│   └── js/                   # JavaScript files
│       ├── api.js            # API service
│       └── app.js            # Main application logic
│
├── backend/                   # Node.js & Express backend
│   ├── config/               # Configuration files
│   │   └── db.js             # MongoDB connection
│   ├── controllers/          # API controllers
│   │   ├── itemController.js # Item CRUD operations
│   │   └── hadoopController.js # Hadoop export controller
│   ├── models/               # Database models
│   │   └── Item.js           # Item model
│   ├── routes/               # API routes
│   │   ├── itemRoutes.js     # Item routes
│   │   └── hadoopRoutes.js   # Hadoop routes
│   ├── server.js             # Express server
│   └── package.json          # Backend dependencies
│
```

## Tech Stack

- **Frontend**: HTML, CSS, Bootstrap, JavaScript
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Big Data**: Hadoop (Simulated)

## Setup and Installation

### Prerequisites

- Node.js (v14 or later)
- MongoDB (local or Atlas cloud)

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file with the following content
# PORT=5000
# MONGO_URI=mongodb://localhost:27017/inventory-management
# NODE_ENV=development

# Start the development server
npm run dev
```

### Frontend Setup

Simply serve the frontend directory with any HTTP server. For development, you can use:

```bash
# Using Node.js http-server (install globally if not available)
# npm install -g http-server

# Navigate to frontend directory
cd frontend

# Serve the frontend files
http-server -p 8080
```

Or just open the index.html file directly in your browser.

### Hadoop Scripts Setup

```bash
# Navigate to hadoop_scripts directory
cd hadoop_scripts

# Install dependencies
npm install
```

## Usage

1. Start the backend server
2. Open the frontend in a web browser
3. Use the interface to:
   - Add, edit, and delete inventory items
   - View all inventory items in a table
   - Export data to the simulated Hadoop environment

## API Endpoints

- `GET /api/items` - Get all items
- `GET /api/items/:id` - Get a specific item
- `POST /api/items` - Create a new item
- `PUT /api/items/:id` - Update an item
- `DELETE /api/items/:id` - Delete an item
- `GET /api/hadoop/export` - Export data to Hadoop

## Data Model

Each inventory item has the following fields:

- `name`: Name of the item
- `category`: Category the item belongs to
- `quantity`: Number of items in stock
- `price`: Price per item
- `supplier`: Supplier of the item
- `dateAdded`: Date when the item was added

## Hadoop Integration

The Hadoop integration simulates:
1. Exporting data from MongoDB to CSV files
2. Storing this data in a simulated HDFS
3. Running a simplified MapReduce job for data analysis

For detailed information about the Hadoop integration, see the [hadoop_scripts/README.md](hadoop_scripts/README.md) file. 