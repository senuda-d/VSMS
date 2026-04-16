const Customer = require('../models/Customer');

// Helper function to auto-generate the custom ID (e.g., CUST-1001)
const generateCustomerId = async () => {
    // Find customers with the correct format and sort them
    const lastCustomer = await Customer.findOne({ customerId: /^CUST-\d+$/ })
        .sort({ createdAt: -1 });
    
    if (!lastCustomer || !lastCustomer.customerId) {
        return 'CUST-1001'; 
    }
    
    const parts = lastCustomer.customerId.split('-');
    const lastIdNumber = parseInt(parts[1]);
    
    if (isNaN(lastIdNumber)) return 'CUST-1001';
    
    return `CUST-${lastIdNumber + 1}`;
};

// 1. CREATE CUSTOMER (POST)
const createCustomer = async (req, res) => {
    try {
        const { firstName, lastName, email, phone, address, nic } = req.body;

        // RUBRIC REQUIREMENT: Strict Backend Validation (Returns 400 Bad Request)
        if (!firstName || !lastName || !email || !phone || !address || !nic) {
            return res.status(400).json({ message: 'All fields are strictly required.' });
        }

        // Generate the logical ID automatically
        const newId = await generateCustomerId();

        // Package the data up
        const newCustomer = new Customer({
            customerId: newId,
            firstName,
            lastName,
            email,
            phone,
            address,
            nic
        });

        // Save to MongoDB
        await newCustomer.save();
        
        // 201 means "Created Successfully"
        res.status(201).json(newCustomer);

    } catch (error) {
        // Mongoose error code 11000 means they tried to use an existing Email or NIC
        if (error.code === 11000) {
            return res.status(400).json({ message: 'A customer with this Email or NIC already exists!' });
        }
        res.status(500).json({ message: 'Server error while creating customer.', error: error.message });
    }
};

// 2. READ / GET ALL CUSTOMERS (GET)
const getCustomers = async (req, res) => {
    try {
        // Find all customers, sort them by newest first
        const customers = await Customer.find().sort({ createdAt: -1 });
        res.status(200).json(customers);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch customers.' });
    }
};

// 3. UPDATE CUSTOMER (PUT)
const updateCustomer = async (req, res) => {
    try {
        // Find by the secret MongoDB _id, update it, and run our schema validation rules again
        const updatedCustomer = await Customer.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true, runValidators: true } 
        );

        if (!updatedCustomer) {
            return res.status(404).json({ message: 'Customer not found.' });
        }
        res.status(200).json(updatedCustomer);
    } catch (error) {
        res.status(400).json({ message: 'Failed to update customer.', error: error.message });
    }
};

// 4. DELETE CUSTOMER (DELETE)
const deleteCustomer = async (req, res) => {
    try {
        const deletedCustomer = await Customer.findByIdAndDelete(req.params.id);
        if (!deletedCustomer) {
            return res.status(404).json({ message: 'Customer not found.' });
        }
        res.status(200).json({ message: 'Customer successfully deleted.' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete customer.' });
    }
};

// Export these functions so our "Routes" file can see them
module.exports = {
    createCustomer,
    getCustomers,
    updateCustomer,
    deleteCustomer
};