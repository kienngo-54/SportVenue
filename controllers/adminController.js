const { MongoClient, ServerApiVersion, ObjectId} = require('mongodb');
const mongoose = require('mongoose');
const Team= require('../models/field');
const Venue = require('../models/venue');
const Trainer = require('../models/trainer');
const Refeere = require('../models/referee');
const Promotion = require('../models/promotion'); 
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
//promotion
async function createPromotion(req, res) {
  try {
    const { name, description, discount, startDate, endDate } = req.body;

    if (!name || !description || !discount || !startDate || !endDate) {
      return res.status(400).json({ message: 'Missing required information' });
    }

    await connectToDB();
    const promotionsCollection = client.db('managefield').collection('promotion');

    const newPromotion = { name, description, discount, startDate, endDate };
    const result = await promotionsCollection.insertOne(newPromotion);

    console.log(`New promotion added with ID ${result.insertedId}`);
    res.json({ message: 'Promotion created successfully', promotionId: result.insertedId });
  } catch (err) {
    console.error('Error creating promotion:', err);
    res.status(500).json({ message: 'Error creating promotion' });
  } finally {
    await client.close();
  }
}
async function updatePromotion(req, res) {
  try {
    const { id } = req.params;
    const { name, description, discount, startDate, endDate } = req.body;

    if (!name && !description && !discount && !startDate && !endDate) {
      return res.status(400).json({ message: 'At least one field is required to update' });
    }

    await connectToDB();
    const promotionsCollection = client.db('managefield').collection('promotion');

    const updateFields = {};
    if (name) updateFields.name = name;
    if (description) updateFields.description = description;
    if (discount) updateFields.discount = discount;
    if (startDate) updateFields.startDate = startDate;
    if (endDate) updateFields.endDate = endDate;

    const result = await promotionsCollection.updateOne(
      { _id:  ObjectId.createFromHexString(id) },
      { $set: updateFields }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: 'Promotion not found or no changes made' });
    }

    res.json({ message: 'Promotion updated successfully' });
  } catch (err) {
    console.error('Error updating promotion:', err);
    res.status(500).json({ message: 'Error updating promotion' });
  } finally {
    await client.close();
  }
}
async function getPromotionById(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Promotion ID is required' });
    }

    await connectToDB();
    const promotionsCollection = client.db('managefield').collection('promotion');

    const promotion = await promotionsCollection.findOne({ _id: ObjectId.createFromHexString(id) });

    if (!promotion) {
      return res.status(404).json({ message: 'Promotion not found' });
    }

    res.json(promotion);
  } catch (err) {
    console.error('Error fetching promotion:', err);
    res.status(500).json({ message: 'Error fetching promotion' });
  } finally {
    await client.close();
  }
}
async function getAllPromotion(req, res) {
  try {
    await connectToDB();
    const promotionsCollection = client.db('managefield').collection('promotion');

    const promotions = await promotionsCollection.find().toArray();

    res.json(promotions);
  } catch (err) {
    console.error('Error fetching promotions:', err);
    res.status(500).json({ message: 'Error fetching promotions' });
  } finally {
    await client.close();
  }
}
async function deletePromotion(req, res) {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ message: 'Promotion ID is required' });
    }

    await connectToDB();
    const promotionsCollection = client.db('managefield').collection('promotion');

    const result = await promotionsCollection.deleteOne({ _id:  ObjectId.createFromHexString(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Promotion not found' });
    }

    res.json({ message: 'Promotion deleted successfully' });
  } catch (err) {
    console.error('Error deleting promotion:', err);
    res.status(500).json({ message: 'Error deleting promotion' });
  } finally {
    await client.close();
  }
}













module.exports = {createField,removeField,createVenue,removeVenue,addTrainer,updateTrainer,deleteTrainer
  ,createPromotion,deletePromotion,getPromotionById,updatePromotion,getAllPromotion
};