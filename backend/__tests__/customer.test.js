const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const Customer = require('../models/Customer');

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('Customer API Tests', () => {
    let customerId;

    it('should create a new customer', async () => {
        const res = await request(app)
            .post('/api/customers')
            .send({
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                phone: '1234567890',
                address: '123 Main St',
                nic: '123456789V'
            });
        
        expect(res.statusCode).toEqual(201);
        expect(res.body).toHaveProperty('customerId');
        expect(res.body.firstName).toEqual('John');
        customerId = res.body._id;
    });

    it('should fetch all customers', async () => {
        const res = await request(app).get('/api/customers');
        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBeTruthy();
        expect(res.body.length).toBeGreaterThan(0);
    });

    it('should update a customer', async () => {
        const res = await request(app)
            .put(`/api/customers/${customerId}`)
            .send({ firstName: 'Johnny' });
        
        expect(res.statusCode).toEqual(200);
        expect(res.body.firstName).toEqual('Johnny');
    });

    it('should delete a customer', async () => {
        const res = await request(app).delete(`/api/customers/${customerId}`);
        expect(res.statusCode).toEqual(200);
        expect(res.body.message).toEqual('Customer successfully deleted.');
    });
});
