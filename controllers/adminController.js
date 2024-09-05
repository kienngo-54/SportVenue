const { MongoClient, ServerApiVersion, ObjectId} = require('mongodb');
const mongoose = require('mongoose');
const Team= require('../models/field');
const Venue = require('../models/venue');
const Trainer = require('../models/trainer');
const Refeere = require('../models/referee');
require('dotenv').config();
const client = new MongoClient(process.env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function connectToDB() {
  try {
    await client.connect();
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
    throw err;
  }
}
async function createField(req, res) {
  try {
    const { name, sport,location, capacity, price} = req.body;

    
    if (!name || !location || !sport || !price||!capacity) {
      return res.status(400).json({ message: 'Thiếu thông tin cần thiết' });
    }

  
    await connectToDB();
    const fieldsCollection =  client.db('managefield').collection('field');

    
    const newField = {
      name: name,
      sport:sport,
      location: location,
      capacity: capacity,
      price: price,
    };

    // Thêm sân mới vào cơ sở dữ liệu
    const result = await fieldsCollection.insertOne(newField);

    console.log(`New field added with ID ${result.insertedId}`);

    res.json({ message: 'Sân mới đã được thêm thành công', fieldId: result.insertedId });
  } catch (err) {
    console.error('Error adding new field:', err);
    res.status(500).json({ message: 'Lỗi khi thêm sân mới' });
  } finally {
    await client.close();
  }

}
async function removeField(req, res) {
  try {
    const { fieldId } = req.body;

    // Kiểm tra nếu fieldId không được cung cấp
    if (!fieldId) {
      return res.status(400).json({ message: 'Thiếu ID của sân cần xóa' });
    }

    await connectToDB();
    const fieldsCollection = client.db('managefield').collection('field');

    // Xóa sân dựa trên fieldId
    const result = await fieldsCollection.deleteOne({ _id: ObjectId.createFromHexString(fieldId) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Không tìm thấy sân để xóa' });
    }

    console.log(`Field with ID ${fieldId} has been deleted`);

    res.json({ message: 'Sân đã được xóa thành công' });
  } catch (err) {
    console.error('Error deleting field:', err);
    res.status(500).json({ message: 'Lỗi khi xóa sân' });
  } finally {
    await client.close();
  }
}
async function createVenue(req, res) {
  try {
    const { name, location } = req.body;

    // Kiểm tra nếu thông tin cần thiết không được cung cấp
    if (!name || !location) {
      return res.status(400).json({ message: 'Thiếu thông tin cần thiết' });
    }

    await connectToDB();
    const fieldsCollection = client.db('managefield').collection('venue');
    const newVenue = new Venue({ name, location });
    const existingVenue = await fieldsCollection.findOne({ location });
    if (existingVenue) {
      return res.status(400).json({ message: 'Địa điểm đã tồn tại tại vị trí này' });
    }
    // Lưu địa điểm vào cơ sở dữ liệu
    const result = await fieldsCollection.insertOne(newVenue);
    console.log(`New venue added with ID ${result._id}`);

    res.json({ message: 'Địa điểm mới đã được thêm thành công', venueId: result._id });
  } catch (err) {
    console.error('Error adding new venue:', err);
    res.status(500).json({ message: 'Lỗi khi thêm địa điểm mới' });
  }
}
async function removeVenue(req, res) {
  try {
    const { venueId } = req.body;

    // Kiểm tra nếu venueId không được cung cấp
    if (!venueId) {
      return res.status(400).json({ message: 'Thiếu ID của địa điểm cần xóa' });
    }

    // Xóa địa điểm dựa trên venueId
    const result = await Venue.findByIdAndDelete(ObjectId.createFromHexString(venueId));

    if (!result) {
      return res.status(404).json({ message: 'Không tìm thấy địa điểm để xóa' });
    }

    console.log(`Venue with ID ${venueId} has been deleted`);

    res.json({ message: 'Địa điểm đã được xóa thành công' });
  } catch (err) {
    console.error('Error deleting venue:', err);
    res.status(500).json({ message: 'Lỗi khi xóa địa điểm' });
  }
}
// trainers
async function addTrainer(req, res) {
  try {
    const { name, sport, contact, pricePerMatch } = req.body;

    if (!name || !sport || !contact || !pricePerMatch) {
      return res.status(400).json({ message: 'Thiếu thông tin cần thiết' });
    }

    await connectToDB();
    const trainersCollection = client.db('managefield').collection('trainers');
    
    const newTrainer = new Trainer(name,sport,contact,pricePerMatch);

    const result = await trainersCollection.insertOne(newTrainer);
    res.json({ message: 'Huấn luyện viên đã được thêm thành công', trainerId: result.insertedId });
  } catch (err) {
    console.error('Lỗi khi thêm huấn luyện viên:', err);
    res.status(500).json({ message: 'Lỗi khi thêm huấn luyện viên' });
  } finally {
    await client.close();
  }
}
async function updateTrainer(req, res) {
  try {
    const { id } = req.params;
    const { name, sport, contact, pricePerMatch } = req.body;

    if (!id || !name || !sport || !contact || !pricePerMatch) {
      return res.status(400).json({ message: 'Thiếu thông tin cần thiết' });
    }

    await connectToDB();
    const trainersCollection = client.db('managefield').collection('trainer');

    const result = await trainersCollection.updateOne(
      { _id: new ObjectId.createFromHexString(id) },
      { $set: { name, sport, contact, pricePerMatch } }
    );

    const existingTrainer = await trainersCollection.findOne({ _id: new ObjectId.createFromHexString(id) });
    if (!existingTrainer) {
    return res.status(404).json({ message: 'Không tìm thấy huấn luyện viên' });
    }
    if (result.modifiedCount === 0) {
      return res.status(200).json({ message: 'Không có thay đổi nào được thực hiện' });
    }

    res.json({ message: 'Cập nhật huấn luyện viên thành công' });
  } catch (err) {
    console.error('Lỗi khi cập nhật huấn luyện viên:', err);
    res.status(500).json({ message: 'Lỗi khi cập nhật huấn luyện viên' });
  } finally {
    await client.close();
  }
}
async function deleteTrainer(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Thiếu ID huấn luyện viên' });
    }

    await connectToDB();
    const trainersCollection = client.db('managefield').collection('trainer');

    const result = await trainersCollection.deleteOne({ _id: new ObjectId.createFromHexString(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Không tìm thấy huấn luyện viên' });
    }

    res.json({ message: 'Xóa huấn luyện viên thành công' });
  } catch (err) {
    console.error('Lỗi khi xóa huấn luyện viên:', err);
    res.status(500).json({ message: 'Lỗi khi xóa huấn luyện viên' });
  } finally {
    await client.close();
  }
}
//refeere
async function addReferee(req, res) {
  try {
    const { name, sport, contact, pricePerMatch } = req.body;

    if (!name || !sport || !contact || !pricePerMatch) {
      return res.status(400).json({ message: 'Thiếu thông tin cần thiết' });
    }

    await connectToDB();
    const refereesCollection = client.db('managefield').collection('referee');
    
    const newReferee = new Refeere(
      name,
      sport,
      contact,
      pricePerMatch
    );

    const result = await refereesCollection.insertOne(newReferee);
    res.json({ message: 'Trọng tài đã được thêm thành công', refereeId: result.insertedId });
  } catch (err) {
    console.error('Lỗi khi thêm trọng tài:', err);
    res.status(500).json({ message: 'Lỗi khi thêm trọng tài' });
  } finally {
    await client.close();
  }
}
async function updateReferee(req, res) {
  try {
    const { id } = req.params;
    const { name, sport, contact, pricePerMatch } = req.body;

    if (!id || !name || !sport || !contact || !pricePerMatch) {
      return res.status(400).json({ message: 'Thiếu thông tin cần thiết' });
    }

    await connectToDB();
    const refereesCollection = client.db('managefield').collection('referees');

    const result = await refereesCollection.updateOne(
      { _id: ObjectId.createFromHexString(id) },
      { $set: { name, sport, contact, pricePerMatch } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: 'Không tìm thấy trọng tài' });
    }

    res.json({ message: 'Cập nhật trọng tài thành công' });
  } catch (err) {
    console.error('Lỗi khi cập nhật trọng tài:', err);
    res.status(500).json({ message: 'Lỗi khi cập nhật trọng tài' });
  } finally {
    await client.close();
  }
}








module.exports = {createField,removeField,createVenue,removeVenue,addTrainer,updateTrainer,deleteTrainer};