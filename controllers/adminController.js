const { ObjectId} = require('mongodb');
const mongoose = require('mongoose');
const Team= require('../models/field');
const Venue = require('../models/venue');
const Trainer = require('../models/trainer');
const Refeere = require('../models/referee');
const Promotion = require('../models/promotion'); 
const User = require('../models/user'); 
const bcrypt = require('bcryptjs');
require('dotenv').config();
const { connectToDB } = require('../utils/db');
async function createField(req, res) {
  try {
    const { name, sport, location, capacity, price, venueId } = req.body;
    if (!name || !sport || !location || !capacity || !price || !venueId) {
      return res.status(400).json({
        ec: 1, // Lỗi thiếu thông tin
        msg: 'Thiếu thông tin cần thiết.',
      });
    }
    // Kết nối tới cơ sở dữ liệu
    const db= await connectToDB();
    const fieldsCollection = db.collection('field');

    // Kiểm tra nếu venueId hợp lệ
    const venueCollection = db.collection('venue');
    const venue = await venueCollection.findOne({ _id: ObjectId.createFromHexString(venueId) });
    if (!venue) {
      return res.status(404).json({
        ec: 1, // Lỗi không tìm thấy địa điểm
        msg: 'Không tìm thấy địa điểm với ID đã cung cấp.',
      });
    }
    // Kiểm tra xem sân với tên và venueId đã tồn tại chưa
    const existingField = await fieldsCollection.findOne({
      name: name,
      venueId: ObjectId.createFromHexString(venueId),
    });

    if (existingField) {
      return res.status(400).json({
        ec: 1, // Lỗi sân đã tồn tại
        msg: 'Sân với tên này đã tồn tại tại địa điểm này.',
      });
    }

    // Tạo thông tin sân mới
    const newField = {
      name,
      sport,
      location,
      capacity,
      price,
      venueId: ObjectId.createFromHexString(venueId), // Gắn venueId vào sân
    };

    // Thêm sân mới vào cơ sở dữ liệu
    const result = await fieldsCollection.insertOne(newField);

    console.log(`New field added with ID ${result.insertedId}`);

    res.status(200).json({
      ec: 0, // Thành công
      data: { _id: result.insertedId },
      msg: 'Sân mới đã được thêm thành công.',
    });
  } catch (err) {
    console.error('Error adding new field:', err);
    res.status(500).json({
      ec: 2, // Lỗi server
      msg: 'Lỗi khi thêm sân mới.',
    });
  } 
}
async function removeField(req, res) {
  try {
    const { fieldId } = req.params;   
    if (!fieldId) {
      return res.status(400).json({
        ec: 1, // Lỗi thiếu thông tin
        msg: 'Thiếu ID của sân cần xóa.',
      });
    }

    // Kết nối tới cơ sở dữ liệu
    const db= await connectToDB();
    const fieldsCollection = db.collection('field');

    // Xóa sân dựa trên fieldId
    const result = await fieldsCollection.deleteOne({ _id: ObjectId.createFromHexString(fieldId) });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        ec: 1, // Lỗi không tìm thấy sân
        msg: 'Không tìm thấy sân để xóa.',
      });
    }

    console.log(`Field with ID ${fieldId} has been deleted`);

    res.status(200).json({
      ec: 0, // Thành công
      msg: 'Sân đã được xóa thành công.',
    });
  } catch (err) {
    console.error('Error deleting field:', err);
    res.status(500).json({
      ec: 2, // Lỗi server
      msg: 'Lỗi khi xóa sân.',
    });
  } 
}
async function getFieldsByVenueId(req, res) {
  try {
    const db = await connectToDB(); // Kết nối đến cơ sở dữ liệu
    const fieldsCollection = db.collection('field'); // Collection chứa thông tin sân

    const { venueId} = req.params;  // Lấy venueId từ tham số URL

    
   

    // Lấy danh sách các sân thuộc venueId
    const fields = await fieldsCollection.find({ venueId: ObjectId.createFromHexString(venueId) }).toArray();

    
    

    // Trả về danh sách sân
    res.status(200).json({
      ec: 0, // Thành công
      total: fields.length,
      data: fields, // Dữ liệu sân
      msg: 'Lấy danh sách sân thành công.',
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách sân:', error);
    res.status(500).json({
      ec: 2, // Lỗi server
      msg: 'Đã xảy ra lỗi khi lấy danh sách sân.',
    });
  }
}



async function createVenue(req, res) {
  try {
    const { name, location } = req.body;

    // Kiểm tra nếu thông tin cần thiết không được cung cấp
    if (!name || !location) {
      return res.status(400).json({
        ec: 1, // Lỗi thiếu thông tin
        msg: 'Thiếu thông tin cần thiết.',
      });
    }

    // Kết nối đến cơ sở dữ liệu
    const db= await connectToDB();
    const fieldsCollection = db.collection('venue');

    // Kiểm tra xem địa điểm đã tồn tại chưa
    const existingVenue = await fieldsCollection.findOne({ location });
    if (existingVenue) {
      return res.status(400).json({
        ec: 1, // Lỗi địa điểm đã tồn tại
        msg: 'Địa điểm đã tồn tại tại vị trí này.',
      });
    }

    // Tạo và lưu địa điểm mới
    const newVenue = new Venue( {name, location} );
    const result = await fieldsCollection.insertOne(newVenue);
    console.log(`New venue added with ID ${result.insertedId}`);

    res.status(200).json({
      ec: 0, // Thành công
      data: { venueId: result.insertedId }, // Trả về ID của địa điểm mới
      msg: 'Địa điểm mới đã được thêm thành công.',
    });
  } catch (err) {
    console.error('Error adding new venue:', err);
    res.status(500).json({
      ec: 2, // Lỗi server
      msg: 'Lỗi khi thêm địa điểm mới.',
    });
  }
}
async function removeVenue(req, res) {
  try {
    const { venueId } = req.params;

    // Kiểm tra nếu venueId không được cung cấp
    if (!venueId) {
      return res.status(400).json({
        ec: 1, // Lỗi thiếu thông tin
        msg: 'Thiếu ID của địa điểm cần xóa.',
      });
    }

    // Xóa địa điểm dựa trên venueId
    const db= await connectToDB();
    const venueCollection = db.collection('venue');
    const result = await venueCollection.deleteOne({ _id: ObjectId.createFromHexString(venueId) });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        ec: 1, // Lỗi không tìm thấy địa điểm
        msg: 'Không tìm thấy địa điểm để xóa.',
      });
    }

    console.log(`Venue with ID ${venueId} has been deleted`);

    res.status(200).json({
      ec: 0, // Thành công
      msg: 'Địa điểm đã được xóa thành công.',
    });
  } catch (err) {
    console.error('Error deleting venue:', err);
    res.status(500).json({
      ec: 2, // Lỗi server
      msg: 'Lỗi khi xóa địa điểm.',
    });
  }
}
async function getAllVenue(req, res) {
  try {
    // Kết nối đến cơ sở dữ liệu
    const db = await connectToDB();
    const fieldsCollection = db.collection('venue'); // Collection chứa thông tin sân

    // Lấy tham số phân trang từ query parameters
    const page = parseInt(req.query.page) || 1; // Trang hiện tại, mặc định là trang 1
    const record = parseInt(req.query.record) || 10; // Số bản ghi trên mỗi trang, mặc định là 10

    // Tính toán số lượng địa điểm cần bỏ qua
    const skip = (page - 1) * record;

    // Lấy danh sách địa điểm với phân trang và sắp xếp theo createdAt
    const venues = await fieldsCollection.find({})
      .sort({ createdAt: -1 }) // Sắp xếp theo createdAt, mới nhất lên đầu
      .skip(skip) // Bỏ qua số địa điểm tương ứng với trang
      .limit(record) // Giới hạn số địa điểm trên mỗi trang
      .toArray();

    // Tính tổng số địa điểm để tính toán số trang
    const totalVenues = await fieldsCollection.countDocuments({}); // Đếm tổng số địa điểm

    // Trả về danh sách địa điểm với thông tin phân trang
    res.status(200).json({
      ec: 0, // Thành công
      total: totalVenues, // Tổng số địa điểm trong trang
      data: venues, // Dữ liệu địa điểm
      msg: 'Lấy danh sách địa điểm thành công.',
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách địa điểm:', error);
    res.status(500).json({
      ec: 2, // Lỗi server
      msg: 'Đã xảy ra lỗi khi lấy danh sách địa điểm.',
    });
  }
}







// // trainers
// async function addTrainer(req, res) {
//   try {
//     const { name, sport, contact, pricePerMatch } = req.body;

//     if (!name || !sport || !contact || !pricePerMatch) {
//       return res.status(400).json({ message: 'Thiếu thông tin cần thiết' });
//     }

//     const db= await connectToDB();
//     const trainersCollection = db.collection('trainers');
    
//     const newTrainer = new Trainer(name,sport,contact,pricePerMatch);

//     const result = await trainersCollection.insertOne(newTrainer);
//     res.json({ message: 'Huấn luyện viên đã được thêm thành công', trainerId: result.insertedId });
//   } catch (err) {
//     console.error('Lỗi khi thêm huấn luyện viên:', err);
//     res.status(500).json({ message: 'Lỗi khi thêm huấn luyện viên' });
//   } 
// }
// async function updateTrainer(req, res) {
//   try {
//     const { id } = req.params;
//     const { name, sport, contact, pricePerMatch } = req.body;

//     if (!id || !name || !sport || !contact || !pricePerMatch) {
//       return res.status(400).json({ message: 'Thiếu thông tin cần thiết' });
//     }

//     const db= await connectToDB();
//     const trainersCollection = db.collection('trainer');

//     const result = await trainersCollection.updateOne(
//       { _id: new ObjectId.createFromHexString(id) },
//       { $set: { name, sport, contact, pricePerMatch } }
//     );

//     const existingTrainer = await trainersCollection.findOne({ _id: new ObjectId.createFromHexString(id) });
//     if (!existingTrainer) {
//     return res.status(404).json({ message: 'Không tìm thấy huấn luyện viên' });
//     }
//     if (result.modifiedCount === 0) {
//       return res.status(200).json({ message: 'Không có thay đổi nào được thực hiện' });
//     }

//     res.json({ message: 'Cập nhật huấn luyện viên thành công' });
//   } catch (err) {
//     console.error('Lỗi khi cập nhật huấn luyện viên:', err);
//     res.status(500).json({ message: 'Lỗi khi cập nhật huấn luyện viên' });
//   } 
// }
// async function deleteTrainer(req, res) {
//   try {
//     const { id } = req.params;

//     if (!id) {
//       return res.status(400).json({ message: 'Thiếu ID huấn luyện viên' });
//     }

//     const db= await connectToDB();
//     const trainersCollection = db.collection('trainer');

//     const result = await trainersCollection.deleteOne({ _id: new ObjectId.createFromHexString(id) });

//     if (result.deletedCount === 0) {
//       return res.status(404).json({ message: 'Không tìm thấy huấn luyện viên' });
//     }

//     res.json({ message: 'Xóa huấn luyện viên thành công' });
//   } catch (err) {
//     console.error('Lỗi khi xóa huấn luyện viên:', err);
//     res.status(500).json({ message: 'Lỗi khi xóa huấn luyện viên' });
//   } 
// }
// //refeere
// async function addReferee(req, res) {
//   try {
//     const { name, sport, contact, pricePerMatch } = req.body;

//     if (!name || !sport || !contact || !pricePerMatch) {
//       return res.status(400).json({ message: 'Thiếu thông tin cần thiết' });
//     }

//     const db= await connectToDB();
//     const refereesCollection = db.collection('referee');
    
//     const newReferee = new Refeere(
//       name,
//       sport,
//       contact,
//       pricePerMatch
//     );

//     const result = await refereesCollection.insertOne(newReferee);
//     res.json({ message: 'Trọng tài đã được thêm thành công', refereeId: result.insertedId });
//   } catch (err) {
//     console.error('Lỗi khi thêm trọng tài:', err);
//     res.status(500).json({ message: 'Lỗi khi thêm trọng tài' });
//   } 
// }
// //promotion
async function createPromotion(req, res) {
  try {
    const { name, description, type, value, startDate, endDate } = req.body;

    // Kiểm tra nếu thiếu thông tin cần thiết
    if (!name || !description || !type || !value || !startDate || !endDate) {
      return res.status(400).json({
        ec: 1, // Lỗi thiếu thông tin
        msg: 'Thiếu thông tin cần thiết.',
      });
    }

    const db=await connectToDB();
    const promotionsCollection = db.collection('promotion');

    // Tạo đối tượng khuyến mãi mới
    const newPromotion = { name, description, type, value, startDate, endDate };
    const result = await promotionsCollection.insertOne(newPromotion);

    console.log(`New promotion added with ID ${result.insertedId}`);
    
    // Trả về kết quả thành công
    const response = {
      ec: 0, // Thành công
      msg: 'Khuyến mãi đã được tạo thành công.',
    };

    // Chỉ thêm promotionId nếu nó không rỗng
    if (result.insertedId) {
      response.promotionId = result.insertedId; // Thêm promotionId vào phản hồi
    }

    res.status(201).json(response);
  } catch (err) {
    console.error('Error creating promotion:', err);
    res.status(500).json({
      ec: 2, // Lỗi server
      msg: 'Lỗi khi tạo khuyến mãi.',
    });
  }
}

async function updatePromotion(req, res) {
  try {
    const { id } = req.params;
    const { name, description, discount, startDate, endDate } = req.body;

    // Kiểm tra nếu không có trường nào để cập nhật
    if (!name && !description && !discount && !startDate && !endDate) {
      return res.status(400).json({
        ec: 1, // Lỗi thiếu thông tin
        msg: 'Cần ít nhất một trường để cập nhật.',
      });
    }

    const db = await connectToDB();
    const promotionsCollection = db.collection('promotion');

    // Tạo đối tượng chứa các trường cần cập nhật
    const updateFields = {};
    if (name) updateFields.name = name;
    if (description) updateFields.description = description;
    if (discount) updateFields.discount = discount;
    if (startDate) updateFields.startDate = startDate;
    if (endDate) updateFields.endDate = endDate;

    // Cập nhật thông tin khuyến mãi
    const result = await promotionsCollection.updateOne(
      { _id: ObjectId.createFromHexString(id) },
      { $set: updateFields }
    );

    // Kiểm tra kết quả cập nhật
    if (result.modifiedCount === 0) {
      return res.status(404).json({
        ec: 1, // Lỗi không tìm thấy khuyến mãi
        msg: 'Không tìm thấy khuyến mãi hoặc không có thay đổi nào được thực hiện.',
      });
    }

    res.json({
      ec: 0, // Thành công
      msg: 'Khuyến mãi đã được cập nhật thành công.',
    });
  } catch (err) {
    console.error('Error updating promotion:', err);
    res.status(500).json({
      ec: 2, // Lỗi server
      msg: 'Lỗi khi cập nhật khuyến mãi.',
    });
  } 
}

async function getPromotionById(req, res) {
  try {
    const { id } = req.params;

    // Kiểm tra nếu ID khuyến mãi không được cung cấp
    if (!id) {
      return res.status(400).json({
        ec: 1, // Lỗi thiếu ID
        msg: 'Promotion ID is required',
      });
    }

    const db = await connectToDB();
    const promotionsCollection = db.collection('promotion');

    // Tìm kiếm khuyến mãi theo ID
    const promotion = await promotionsCollection.findOne({ _id: ObjectId.createFromHexString(id) });

    // Kiểm tra nếu không tìm thấy khuyến mãi
    if (!promotion) {
      return res.status(404).json({
        ec: 1, // Lỗi không tìm thấy
        msg: 'Promotion not found',
      });
    }

    res.json({
      ec: 0, // Thành công
      data: promotion, // Dữ liệu khuyến mãi
      msg: 'Promotion fetched successfully',
    });
  } catch (err) {
    console.error('Error fetching promotion:', err);
    res.status(500).json({
      ec: 2, // Lỗi server
      msg: 'Error fetching promotion',
    });
  } 
}

async function getAllPromotion(req, res) {
  try {
    const db = await connectToDB();
    const promotionsCollection = db.collection('promotion');

    // Lấy tất cả khuyến mãi
    const promotions = await promotionsCollection.find().toArray();

    res.json({
      ec: 0, // Thành công
      data: promotions, // Dữ liệu khuyến mãi
      msg: 'Promotions fetched successfully',
    });
  } catch (err) {
    console.error('Error fetching promotions:', err);
    res.status(500).json({
      ec: 2, // Lỗi server
      msg: 'Error fetching promotions',
    });
  } 
}
async function deletePromotion(req, res) {
  try {
    const { id } = req.params;

    // Kiểm tra nếu ID khuyến mãi không được cung cấp
    if (!id) {
      return res.status(400).json({
        ec: 1, // Lỗi thiếu ID
        msg: 'Promotion ID is required',
      });
    }

    const db = await connectToDB();
    const promotionsCollection = db.collection('promotion');

    // Xóa khuyến mãi theo ID
    const result = await promotionsCollection.deleteOne({ _id: ObjectId.createFromHexString(id) });

    // Kiểm tra nếu không tìm thấy khuyến mãi để xóa
    if (result.deletedCount === 0) {
      return res.status(404).json({
        ec: 1, // Lỗi không tìm thấy
        msg: 'Promotion not found',
      });
    }

    res.json({
      ec: 0, // Thành công
      msg: 'Promotion deleted successfully',
    });
  } catch (err) {
    console.error('Error deleting promotion:', err);
    res.status(500).json({
      ec: 2, // Lỗi server
      msg: 'Error deleting promotion',
    });
  } 
}
//user
async function getAllUsers(req, res) {
  try {
    const { page = 1, record = 10 } = req.query;  // Nhận thông tin phân trang từ query parameters và đổi limit thành record
    const db = await connectToDB();
    const usersCollection = db.collection('users');

    // Tính toán để phân trang
    const skip = (parseInt(page) - 1) * parseInt(record);
    const totalUsers = await usersCollection.countDocuments({ role: { $ne: 'admin' } });  // Đếm số người dùng không phải admin
    const users = await usersCollection
      .find({ role: { $ne: 'admin' } }, { projection: {hashedPassword: 0,salt: 0, role: 0 } })  // Loại bỏ người dùng có role là admin và ẩn trường password
      .skip(skip)
      .limit(parseInt(record))
      .toArray();

    // Trả về danh sách người dùng theo format yêu cầu
    res.status(200).json({
      ec: 0,  // Thành công
      total: totalUsers.length,
      data: users,  // Dữ liệu trả về (danh sách người dùng)
      msg: 'Lấy danh sách người dùng thành công',
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({
      ec: 2,  // Lỗi server
      msg: 'Đã xảy ra lỗi khi lấy danh sách người dùng.',
    });
  }
}
async function getUserById(req, res) {
  try {
    const { id } = req.params;

    const db = await connectToDB();
    const usersCollection = db.collection('users');

    // Tìm người dùng theo ID
    const user = await usersCollection.findOne(
      { _id: ObjectId.createFromHexString(id) } // Điều kiện tìm kiếm
    );

    // Kiểm tra nếu không tìm thấy người dùng
    if (!user) {
      return res.status(404).json({
        ec: 1,  // Lỗi không tìm thấy
        msg: 'Không tìm thấy người dùng với ID này.',
      });
    }
    // Trả về thông tin người dùng
    res.status(200).json({
      ec: 0,  // Thành công
      total: 1,  // Tổng số người dùng tìm thấy
      data: user,  // Dữ liệu người dùng
      msg: 'Lấy thông tin người dùng thành công',
    });
  } catch (error) {
    console.error('Error getting user by ID:', error);
    res.status(500).json({
      ec: 2,  // Lỗi server
      msg: 'Đã xảy ra lỗi khi lấy thông tin người dùng.',
    });
  }
}
async function deleteUser(req, res) {
  try {
    const { id } = req.params; // Lấy id từ URL

    // Kiểm tra nếu không có id
    if (!id) {
      return res.status(400).json({
        ec: 1,  // Lỗi dữ liệu đầu vào
        msg: 'Thiếu thông tin id của người dùng.',
      });
    }

    const db = await connectToDB(); // Kết nối tới cơ sở dữ liệu
    const usersCollection = db.collection('users');

    // Xóa người dùng dựa trên id
    const result = await usersCollection.deleteOne({ _id: ObjectId.createFromHexString(id) });

    // Kiểm tra nếu không tìm thấy người dùng
    if (result.deletedCount === 0) {
      return res.status(404).json({
        ec: 1,  // Lỗi không tìm thấy
        msg: 'Không tìm thấy người dùng với ID này.',
      });
    }

    res.status(200).json({
      ec: 0,  // Thành công
      msg: 'Xóa người dùng thành công.',
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      ec: 2,  // Lỗi server
      msg: 'Đã xảy ra lỗi.',
    });
  }
}
async function resetPassword(req, res) {
  try {
    const { id } = req.params;
    const newPassword = "12345678";

    // Kiểm tra các tham số đầu vào
    if (!id) {
      return res.status(400).json({
        ec: 1,  // Lỗi dữ liệu đầu vào
        msg: 'Thiếu thông tin cần thiết (id hoặc mật khẩu mới).',
      });
    }

    // Kết nối cơ sở dữ liệu
    const db = await connectToDB();
    const usersCollection = db.collection('users');

    // Tìm người dùng dựa trên id
    const user = await usersCollection.findOne({ _id: ObjectId.createFromHexString(id) });

    // Nếu không tìm thấy người dùng
    if (!user) {
      return res.status(404).json({
        ec: 1,  // Lỗi không tìm thấy
        msg: 'Không tìm thấy người dùng.',
      });
    }

    // Hash mật khẩu mới
    const salt = user.salt;
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Cập nhật mật khẩu trong cơ sở dữ liệu
    await usersCollection.updateOne(
      { _id: ObjectId.createFromHexString(id) },
      { $set: { hashedPassword } }
    );

    res.status(200).json({
      ec: 0,  // Thành công
      msg: 'Đặt lại mật khẩu thành công.',
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({
      ec: 2,  // Lỗi server
      msg: 'Đã xảy ra lỗi khi đặt lại mật khẩu.',
    });
  }
}
//booking
async function getAllBooking(req, res) {
  try {
    const db = await connectToDB();
    const bookingsCollection = db.collection('booking');

    // Lấy page và limit từ query string, gán giá trị mặc định nếu không có
    const page = parseInt(req.query.page) || 1;  // Trang hiện tại
    const limit = parseInt(req.query.record) || 10;  // Số bản ghi trên mỗi trang

    // Tính toán số bản ghi cần bỏ qua (skip)
    const skip = (page - 1) * limit;

    // Đếm tổng số bản ghi
    const totalBookings = await bookingsCollection.countDocuments();

    // Sử dụng MongoDB để populate dữ liệu từ các ID tham chiếu và phân trang
    const bookings = await bookingsCollection.aggregate([
      {
        $lookup: {
          from: 'users',  // Tên collection 'users' trong database
          localField: 'user',  // Field chứa ObjectId của người dùng trong 'booking'
          foreignField: '_id',  // Field _id trong collection 'users'
          as: 'userDetails'  // Tạo mảng chứa thông tin chi tiết của user
        }
      },
      {
        $lookup: {
          from: 'field',  // Tên collection 'fields'
          localField: 'field',
          foreignField: '_id',
          as: 'fieldDetails'
        }
      },
      {
        $lookup: {
          from: 'referee',  // Tên collection 'referees'
          localField: 'referee',
          foreignField: '_id',
          as: 'refereeDetails'
        }
      },
      {
        $lookup: {
          from: 'trainer',  // Tên collection 'trainers'
          localField: 'trainer',
          foreignField: '_id',
          as: 'trainerDetails'
        }
      },
      {
        $lookup: {
          from: 'equipment',  // Tên collection 'equipment'
          localField: 'equipment',
          foreignField: '_id',
          as: 'equipmentDetails'  // Lấy thông tin chi tiết thiết bị
        }
      },
      { $skip: skip },  // Bỏ qua số bản ghi cần bỏ qua
      { $limit: limit },  // Giới hạn số bản ghi trả về
    ]).toArray();

    // Format lại dữ liệu nếu cần (ví dụ chỉ lấy phần tử đầu tiên trong mảng)
    const formattedBookings = bookings.map(booking => ({
      ...booking,
      user: booking.userDetails[0]?.username || 'Unknown User',  // Lấy tên người dùng
      field: booking.fieldDetails[0]?.name || 'Unknown Field',  // Lấy tên sân
      referee: booking.refereeDetails[0]?.name || 'No Referee',  // Lấy tên trọng tài
      trainer: booking.trainerDetails[0]?.name || 'No Trainer',  // Lấy tên huấn luyện viên
      equipment: booking.equipmentDetails[0]?.name || 'Unknown Equipment'  // Lấy tên thiết bị
    }));

    return res.status(200).json({
      ec: 0, // Thành công
      total: totalBookings,  // Tổng số bản ghi
      data: formattedBookings,  // Dữ liệu trả về
      msg: 'Lấy tất cả thông tin đặt sân thành công.'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      ec: 1, // Lỗi server
      msg: 'Có lỗi xảy ra khi lấy tất cả thông tin đặt sân.',
    });
  }
}
//team
async function getAllTeams(req, res) {
  try {
    const db = await connectToDB();
    const teamCollection = db.collection('team');
    const userCollection = db.collection('users'); // Collection chứa thông tin người dùng

    // Lấy thông tin phân trang từ yêu cầu
    const { page = 1, record = 10 } = req.query; // Mặc định là trang 1 và số bản ghi trên mỗi trang là 10
    const skip = (page - 1) * record; // Tính toán số lượng bản ghi cần bỏ qua

    // Lấy tổng số đội
    const totalTeams = await teamCollection.countDocuments({});
    const totalPages = Math.ceil(totalTeams / record); // Tính tổng số trang

    // Lấy danh sách các đội theo phân trang
    const teams = await teamCollection.find({})
      .skip(skip) // Bỏ qua các bản ghi trước đó
      .limit(parseInt(record)) // Giới hạn số bản ghi được trả về
      .toArray();

    // Kiểm tra nếu không có đội nào
    if (teams.length === 0) {
      return res.status(404).json({
        ec: 1,  // Lỗi: Không tìm thấy đội
        msg: 'Không có đội nào trong hệ thống',
      });
    }

    // Lấy thông tin chi tiết cho từng đội
    const teamDetails = await Promise.all(teams.map(async team => {
      // Lấy thông tin đội trưởng
      const captainInfo = await userCollection.findOne(
        { _id: team.captain },
        { projection: { _id: 1, username: 1 } } // Lấy _id và tên của đội trưởng
      );

      // Lấy thông tin các thành viên
      const memberIds = team.members || [];
      const membersInfo = await userCollection.find(
        { _id: { $in: memberIds } },
        { projection: { _id: 1, username: 1 } } // Chỉ lấy _id và tên của thành viên
      ).toArray();

      return {
        teamId: team._id,
        name: team.name,
        description: team.description,
        sport: team.sport,
        captain: captainInfo ? {
          _id: captainInfo._id,
          username: captainInfo.username // Trả về tên của đội trưởng
        } : null, // Trường hợp không tìm thấy đội trưởng
        members: membersInfo // Trả về thông tin của các thành viên với tên và _id
      };
    }));

    // Trả về danh sách các đội với thông tin phân trang
    res.json({
      ec: 0,  // Thành công
      total: totalTeams, // Tổng số đội
      data: teamDetails, // Dữ liệu đội
      msg: 'Lấy danh sách đội thành công',
    });
  } catch (err) {
    console.error('Lỗi khi lấy danh sách đội:', err);
    res.status(500).json({
      ec: 2,  // Lỗi server
      msg: 'Lỗi server khi lấy danh sách đội',
    });
  }
}
async function adminCreateTeam(req, res) {
  try {
    const db = await connectToDB();
    const { name, description, sport, captainEmail, memberEmails } = req.body;

    // Kiểm tra đầu vào
    if (!name || !description || !sport || !captainEmail) {
      return res.status(400).json({
        ec: 1, // Lỗi: Thiếu thông tin cần thiết       
        msg: 'Thiếu thông tin cần thiết',
      });
    }

    const teamCollection = db.collection('team');
    const userCollection = db.collection('users');

    // Tìm đội trưởng theo email
    const captain = await userCollection.findOne({ email: captainEmail });
    if (!captain) {
      return res.status(404).json({
        ec: 1, // Lỗi: Không tìm thấy đội trưởng
        msg: 'Không tìm thấy đội trưởng với email đã cung cấp',
      });
    }

    const captainId = captain._id;

    // Kiểm tra xem người dùng có phải đội trưởng của đội khác không
    const existingTeam = await teamCollection.findOne({ captain: captainId });
    if (existingTeam) {
      return res.status(400).json({
        ec: 1, // Lỗi: Người dùng đã là đội trưởng của đội khác
        msg: 'Người này đã là đội trưởng của đội khác',
      });
    }

    // Tìm các thành viên dựa trên danh sách email
    const members = await userCollection.find({ email: { $in: memberEmails || [] } }).toArray();
    const memberIds = members.map(member => member._id);

    // Chỉ thêm những thành viên tìm thấy, không trả về lỗi nếu không tìm thấy email nào
    // (Bỏ qua các email không tồn tại)

    // Tạo team mới
    const team = {
      name,
      description,
      sport,
      captain: captainId,
      members: [captainId, ...memberIds], // Đội trưởng và các thành viên
    };

    const result = await teamCollection.insertOne(team);

    // Phản hồi thành công
    res.json({
      ec: 0,
      data: { teamId: result.insertedId },
      msg: 'Tạo đội thành công',
    });
  } catch (err) {
    console.error('Lỗi tạo đội:', err);
    res.status(500).json({
      ec: 2,
      msg: 'Lỗi server khi tạo đội',
    });
  }
}
async function deleteTeam(req, res) {
  try {
    const db = await connectToDB();
    const { teamId } = req.params; // Lấy teamId từ URL params

    if (!teamId) {
      return res.status(400).json({
        ec: 1, // Lỗi: Thiếu thông tin teamId
        msg: 'Thiếu teamId để xóa đội',
      });
    }

    const teamCollection = db.collection('team');
    const objectId = ObjectId.createFromHexString(teamId); // Chuyển teamId sang ObjectId

    // Kiểm tra xem đội có tồn tại không
    const team = await teamCollection.findOne({ _id: objectId });
    if (!team) {
      return res.status(404).json({
        ec: 1, // Lỗi: Không tìm thấy đội
        msg: 'Không tìm thấy đội với teamId đã cung cấp',
      });
    }

    // Xóa đội khỏi collection
    await teamCollection.deleteOne({ _id: objectId });

    // Phản hồi thành công
    res.json({
      ec: 0, // Thành công
      msg: 'Xóa đội thành công',
    });
  } catch (err) {
    console.error('Lỗi khi xóa đội:', err);
    res.status(500).json({
      ec: 2, // Lỗi server
      msg: 'Lỗi server khi xóa đội',
    });
  }
}









async function getTotalRevenue(req, res){
  try {
    // Lấy startDate và endDate từ query params
    const { startDate, endDate } = req.query;

    // Kiểm tra nếu không có startDate hoặc endDate
    if (!startDate || !endDate) {
      return res.status(400).json({
        message: 'Vui lòng cung cấp cả startDate và endDate',
      });
    }

    // Chuyển đổi startDate và endDate sang kiểu Date
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Kiểm tra ngày hợp lệ
    if (isNaN(start) || isNaN(end)) {
      return res.status(400).json({
        message: 'Ngày không hợp lệ',
      });
    }

    // Truy cập trực tiếp vào collection 'booking'
    const bookingCollection = mongoose.connection.collection('booking');

    // Truy vấn MongoDB để tính tổng doanh thu trong khoảng thời gian
    const totalRevenue = await bookingCollection.aggregate([
      {
        $match: {
          createdAt: {
            $gte: start,  // Lớn hơn hoặc bằng ngày bắt đầu
            $lte: end,    // Nhỏ hơn hoặc bằng ngày kết thúc
          },
          status: 'paid',  // Chỉ tính những booking đã thanh toán
        },
      },
      {
        $group: {
          _id: null,  // Không cần group theo field nào
          totalRevenue: { $sum: '$totalPrice' },  // Tổng doanh thu
        },
      },
    ]).toArray();  // Chuyển kết quả từ cursor về mảng

    // Kiểm tra nếu không có giao dịch trong khoảng thời gian này
    if (!totalRevenue.length) {
      return res.json({
        totalRevenue: 0,
        currency: 'VND',
      });
    }

    // Trả về tổng doanh thu
    res.json({
      totalRevenue: totalRevenue[0].totalRevenue,
      currency: 'VND',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Lỗi server',
    });
  }
};
























module.exports = {createField,removeField,getFieldsByVenueId,createVenue,removeVenue,getAllVenue
  ,createPromotion,deletePromotion,getPromotionById,updatePromotion,getAllPromotion,
  getAllUsers,getUserById, deleteUser,resetPassword,
  getAllTeams,adminCreateTeam,deleteTeam,
  getAllBooking,
  getTotalRevenue
}