const ManufacturerProduct = require('../models/manufacturerModel'); // Corrected the path

// Frontend JavaScript for Manufacturer Dashboard
function clearTable(tableId) {
    const table = document.getElementById(tableId);
    while (table.rows.length > 1) { // Keep the header row
        table.deleteRow(1);
    }
}

// Fetch orders when the page loads or after the supplier forwards an order to manufacturer
function fetchNewProductionOrders() {
    clearTable('new-orders-table');
    fetch('http://localhost:7001/api/manufacturer/new-production-orders')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Received data:', data); // Debug log
            const newOrdersTable = document.getElementById('new-orders-table');
            if (!data.orders || data.orders.length === 0) {
                console.log('No orders found'); // Debug log
                document.getElementById('no-new-orders-message').style.display = 'block';
                newOrdersTable.innerHTML = '<tr><td colspan="7">No new orders available</td></tr>';
            } else {
                console.log(`Found ${data.orders.length} orders`); // Debug log
                document.getElementById('no-new-orders-message').style.display = 'none';
                data.orders.forEach(order => {
                    console.log('Processing order:', order); // Debug log
                    const row = newOrdersTable.insertRow();
                    row.insertCell(0).textContent = order._id;
                    row.insertCell(1).textContent = order.productName;
                    row.insertCell(2).textContent = order.productMaterial;
                    row.insertCell(3).textContent = order.quantity;
                    row.insertCell(4).textContent = new Date(order.createdAt).toLocaleDateString();
                    row.insertCell(5).textContent = order.status;
                    const actionsCell = row.insertCell(6);
                    actionsCell.innerHTML = `
                        <button class="action-button" onclick="startProduction('${order._id}')">Start Production</button>
                    `;
                });
            }
        })
        .catch(error => {
            console.error('Error fetching new production orders:', error);
            const newOrdersTable = document.getElementById('new-orders-table');
            newOrdersTable.innerHTML = `
                <tr><td colspan="7">Error loading orders: ${error.message}. Please try again later.</td></tr>
            `;
        });
}

// Function to start production
function startProduction(orderId) {
    fetch('http://localhost:7001/api/manufacturer/start-production', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        alert('Production started successfully!');
        fetchNewProductionOrders(); // Refresh the table
    })
    .catch(error => {
        console.error('Error starting production:', error);
        alert('Error starting production. Please try again.');
    });
}

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', () => {
    fetchNewProductionOrders();
    // Set up auto-refresh every 30 seconds
    setInterval(fetchNewProductionOrders, 30000);
});

// Get New Production Orders for Manufacturer
exports.getNewProductionOrders = async (req, res) => {
  try {
    const orders = await ManufacturerProduct.find({ status: 'Pending' });
    res.json({ orders });
  } catch (error) {
    console.error('Error fetching new production orders:', error);
    res.status(500).json({ message: 'Error fetching new production orders' });
  }
};

// Get Orders In Production
exports.getOrdersInProduction = async (req, res) => {
  try {
    const orders = await ManufacturerProduct.find({ status: 'In Production' });
    res.json({ orders });
  } catch (error) {
    console.error('Error fetching orders in production:', error);
    res.status(500).json({ message: 'Error fetching orders in production' });
  }
};

// Update the status to In Production for the manufacturer
exports.startProduction = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await ManufacturerProduct.findByIdAndUpdate(
      orderId,
      { status: 'In Production' },
      { new: true }
    );

    res.json({ order });
  } catch (error) {
    console.error('Error starting production:', error);
    res.status(500).json({ message: 'Error starting production' });
  }
};

// Create a new Manufacturer Product (this will be called when forwarding an order from the supplier)
exports.createManufacturerProduct = async (req, res) => {
  try {
    const { orderId, productName, productMaterial, quantity, manufacturerId } = req.body;

    const newProduct = new ManufacturerProduct({
      orderId,
      productName,
      productMaterial,
      quantity,
      manufacturerId,
    });

    const savedProduct = await newProduct.save();

    res.status(201).json({ message: 'Product created', product: savedProduct });
  } catch (error) {
    console.error('Error creating manufacturer product:', error);
    res.status(500).json({ message: 'Error creating manufacturer product' });
  }
};
