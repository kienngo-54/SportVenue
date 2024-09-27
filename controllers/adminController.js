const { MongoClient, ServerApiVersion, ObjectId} = require('mongodb');
const mongoose = require('mongoose');
const Team= require('../models/field');
const Venue = require('../models/venue');
const Trainer = require('../models/trainer');
const Refeere = require('../models/referee');
const Promotion = require('../models/promotion'); 
const User = require('../models/user'); 
const bcrypt = require('bcrypt');
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
    const { name, description, type, value, startDate, endDate } = req.body;

    if (!name || !description || !type||!value || !startDate || !endDate) {
      return res.status(400).json({ message: 'Missing required information' });
    }

    await connectToDB();
    const promotionsCollection = client.db('managefield').collection('promotion');

    const newPromotion = { name, description, type,value, startDate, endDate };
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
    const { id } = req.params;

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



async function getAllUsers(req, res) {
  try {
    await connectToDB();
    const usersCollection = client.db('managefield').collection('users');
    const users = await usersCollection.find({},{ projection: { _id: 1, username: 1 } }).toArray();
    
    // Trả về danh sách người dùng
    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách người dùng.'
    });
  }
}
async function getUserById(req, res) {
  try {
    const { id } = req.params;

    await connectToDB();
    const usersCollection = client.db('managefield').collection('users');

    // Tìm người dùng theo ID và chỉ trả về _id và name
    const user = await usersCollection.findOne(
      { _id: ObjectId.createFromHexString(id) }, // Điều kiện tìm kiếm
      // Chỉ trả về _id và name
    );

    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng với ID này.',
      });
    }

    // Trả về thông tin người dùng
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error getting user by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thông tin người dùng.',
    });
  }
}
async function deleteUser(req, res) {
  try {
    const { id } = req.params; // Lấy id từ URL

    // Kiểm tra nếu không có id
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin id của người dùng.',
      });
    }

    await connectToDB(); // Kết nối tới cơ sở dữ liệu
    const usersCollection = client.db('managefield').collection('users');

    // Xóa người dùng dựa trên id
    const result = await usersCollection.deleteOne({ _id:  ObjectId.createFromHexString(id) });

    // Kiểm tra nếu không tìm thấy người dùng
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng với ID này.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Xóa người dùng thành công.',
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi  ',
    });
  }
}

async function resetPassword(req, res) {
  try {
    const { id } = req.params;
    const newPassword="12345678";

    // Kiểm tra các tham số đầu vào
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin cần thiết (id hoặc mật khẩu mới).',
      });
    }

    // Kết nối cơ sở dữ liệu
    await connectToDB();
    const usersCollection = client.db('managefield').collection('users');

    // Tìm người dùng dựa trên id
    const user = await usersCollection.findOne({ _id: ObjectId.createFromHexString(id) });

    // Nếu không tìm thấy người dùng
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng.',
      });
    }

    // Hash mật khẩu mới
    const saltRounds = user.salt;
    
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Cập nhật mật khẩu trong cơ sở dữ liệu
    await usersCollection.updateOne(
      { _id: ObjectId.createFromHexString(id) },
      { $set: { password: hashedPassword} }
    );

    res.status(200).json({
      success: true,
      message: 'Đặt lại mật khẩu thành công.',
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi đặt lại mật khẩu.',
    });
  }
}
const getAllBooking = async (req, res) => {
  try {
      await connectToDB();
      const bookingsCollection = client.db('managefield').collection('booking');
      const bookings = await bookingsCollection.find().toArray();

      // Tạo một mảng các ID để tìm thông tin liên quan
      const userIds = [...new Set(bookings.map(booking => booking.user))];
      const teamIds = [...new Set(bookings.map(booking => booking.team))];
      const fieldIds = [...new Set(bookings.map(booking => booking.field))];
      const refereeIds = [...new Set(bookings.map(booking => booking.referee))];
      const trainerIds = [...new Set(bookings.map(booking => booking.trainer))];

      // Thực hiện các truy vấn để lấy thông tin từ các collection khác
      const users = await client.db('managefield').collection('users').find({ _id: { $in: userIds.map(id => ObjectId.createFromHexString(id)) } }).toArray();
      const teams = await client.db('managefield').collection('team').find({ _id: { $in: teamIds.map(id => ObjectId.createFromHexString(id)) } }).toArray();
      const fields = await client.db('managefield').collection('field').find({ _id: { $in: fieldIds.map(id => ObjectId.createFromHexString(id)) } }).toArray();
      const referees = await client.db('managefield').collection('referee').find({ _id: { $in: refereeIds.map(id => ObjectId.createFromHexString(id)) } }).toArray();
      const trainers = await client.db('managefield').collection('trainer').find({ _id: { $in: trainerIds.map(id => ObjectId.createFromHexString(id)) } }).toArray();

      // Ghép thông tin vào các booking
      const bookingsWithDetails = bookings.map(booking => ({
          ...booking,
          user: users.find(user => user._id.toString() === booking.user.toString()),
          team: teams.find(team => team._id.toString() === booking.team.toString()),
          field: fields.find(field => field._id.toString() === booking.field.toString()),
          referee: referees.find(referee => referee._id.toString() === booking.referee.toString()),
          trainer: trainers.find(trainer => trainer._id.toString() === booking.trainer.toString()),
      }));

      return res.status(200).json({
          success: true,
          data: bookingsWithDetails
      });
  } catch (error) {
      console.error(error);
      return res.status(500).json({
          success: false,
          message: 'Có lỗi xảy ra khi lấy tất cả thông tin đặt sân',
      });
  }
};





















module.exports = {createField,removeField,createVenue,removeVenue,addTrainer,updateTrainer,deleteTrainer
  ,createPromotion,deletePromotion,getPromotionById,updatePromotion,getAllPromotion,
  getAllUsers,getUserById, deleteUser,resetPassword,
  getAllBooking
}