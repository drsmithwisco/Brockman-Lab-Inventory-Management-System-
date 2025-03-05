// server.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the public folder (make sure your index.html is in a folder called "public")
app.use(express.static(path.join(__dirname)));

// Connect to MongoDB using your cluster connection string
mongoose.connect(
  'mongodb+srv://drsmith28:Dosm7503$@brockman-lab-inventory.mbtl6.mongodb.net/?retryWrites=true&w=majority&appName=Brockman-Lab-Inventory',
  { useNewUrlParser: true, useUnifiedTopology: true }
)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// --- Simple Password Protection Middleware ---
// For API endpoints, the client must send header: x-password: BrockmanInventory
function requirePassword(req, res, next) {
  const password = req.headers['x-password'];
  if (password === "BrockmanInventory") {
    next();
  } else {
    res.status(401).json({ error: "Unauthorized. Invalid password." });
  }
}

// --- Mongoose Model ---
const Schema = mongoose.Schema;
const ItemSchema = new Schema({
  category: String,   // e.g., "general", "chemicals", "celllines", etc.
  data: Object,       // Contains the actual item information
  createdAt: { type: Date, default: Date.now }
});
const Item = mongoose.model('Item', ItemSchema);

// --- API Endpoints ---
// Get items by category
app.get('/api/items/:category', requirePassword, async (req, res) => {
  try {
    const items = await Item.find({ category: req.params.category });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new item
app.post('/api/items/:category', requirePassword, async (req, res) => {
  try {
    const newItem = new Item({
      category: req.params.category,
      data: req.body
    });
    await newItem.save();
    res.json(newItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update an existing item
app.put('/api/items/:id', requirePassword, async (req, res) => {
  try {
    const updated = await Item.findByIdAndUpdate(
      req.params.id,
      { data: req.body },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete an item
app.delete('/api/items/:id', requirePassword, async (req, res) => {
  try {
    await Item.findByIdAndDelete(req.params.id);
    res.json({ message: "Item deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fallback: For any other route, serve the index.html from the public folder
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
