const { MongoClient, ServerApiVersion, ObjectId} = require('mongodb');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const Team= require('../models/team');
const Field = require('../models/field');
const Booking = require('../models/booking');
const Equipment = require('../models/equipment');
const Matching = require('../models/matching');
const jwt= require('jsonwebtoken');
require('dotenv').config();

// connect
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
// user
async function registerUser(req, res) {
  try {
    await connectToDB();
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Invalid user input' });
    }
    const usersCollection = client.db('managefield').collection('users');
    const existingUser = await usersCollection.findOne({email});
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({ username, email, salt, hashedPassword, role:'user' });
    const result = await usersCollection.insertOne(user);
    console.log(`New user added with ID ${result.insertedId}`);
    res.json({ message: 'User created successfully' });
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ message: 'Error creating user:', err });
  } finally {
    await client.close();
  }
}
async function loginUser(req, res) {
  try {
    await connectToDB();
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Invalid login credentials' });
    }

    const usersCollection = client.db('managefield').collection('users');
    const user = await usersCollection.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const hashedPassword = user.hashedPassword;
    const salt = user.salt;
    const isValidPassword = await bcrypt.compare(password, hashedPassword);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate a JSON Web Token (JWT) for the user
    const token = jwt.sign({ userId: user._id, email: user.email, role: user.role }, process.env.SECRET_KEY, {
      expiresIn: '3h'
    });

    res.json({ message: 'Login successful', token });
  } catch (err) {
    console.error('Error logging in user:', err);
    res.status(500).json({ message: 'Error logging in user:', err });
  } finally {
    await client.close();
  }
}

async function changePassword(req, res) {
  try {
    await connectToDB();
    const { oldPassword, newPassword } = req.body;
    const email = req.user.email; // assuming req.user is set from the JWT token

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Invalid password credentials' });
    }

    const usersCollection = client.db('managefield').collection('users');
    const user = await usersCollection.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid user' });
    }

    const hashedOldPassword = user.hashedPassword;
    const salt = user.salt;
    const isValidOldPassword = await bcrypt.compare(oldPassword, hashedOldPassword);
    if (!isValidOldPassword) {
      return res.status(401).json({ message: 'Invalid old password' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, salt);
    
    const filter = { _id: new ObjectId(user._id) };
    const update = { $set: { hashedPassword: hashedNewPassword } };
    
    await usersCollection.updateOne(filter, update);

    res.json({ message: 'Password changed successfully' });
  }catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ message: 'Error changing password' });
  } finally {
    await client.close();
  }
}
async function getUserInfo(req, res) {
  try {
    await connectToDB();
    const userId = req.user.userId;  // Lấy userId từ JWT token

    const usersCollection = client.db('managefield').collection('users');
    const objectId = ObjectId.createFromHexString(userId);

    // Tìm người dùng theo userId
    const user = await usersCollection.findOne({ _id: objectId });

    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    // Trả về thông tin người dùng (không trả về mật khẩu)
    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi lấy thông tin cá nhân' });
  } finally {
    await client.close();
  }
}
async function addOrUpdateAddress(req, res) {
  try {
    await connectToDB();
    const { address } = req.body;
    const userId = req.user.userId; // Lấy userId từ JWT token

    if (!address) {
      return res.status(400).json({ message: 'Địa chỉ không được để trống' });
    }

    const usersCollection = client.db('managefield').collection('users');
    const objectId = ObjectId.createFromHexString(userId);

    // Tìm người dùng hiện tại
    const user = await usersCollection.findOne({ _id: objectId });

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // Cập nhật hoặc thêm địa chỉ
    const update = user.address 
      ? { $set: { address: address } } // Cập nhật địa chỉ hiện có
      : { $set: { address: address } }; // Thêm địa chỉ mới

    const result = await usersCollection.updateOne(
      { _id: objectId },
      update
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({ message: 'Cập nhật địa chỉ không thành công' });
    }

    res.json({ message: 'Địa chỉ đã được cập nhật thành công' });
  } catch (err) {
    console.error('Lỗi khi cập nhật địa chỉ:', err);
    res.status(500).json({ message: 'Lỗi khi cập nhật địa chỉ' });
  } finally {
    await client.close();
  }
}
async function addOrUpdatePhoneNumber(req, res) {
  try {
    await connectToDB();
    const phoneNumber  = req.body.phoneNumber;
    const userId = req.user.userId; // Lấy userId từ JWT token
    console.log(phoneNumber);
    if (!phoneNumber) {
      return res.status(400).json({ message: 'Số điện thoại không được để trống' });
    }

    const usersCollection = client.db('managefield').collection('users');
    const objectId = ObjectId.createFromHexString(userId);

    // Tìm người dùng hiện tại
    const user = await usersCollection.findOne({ _id: objectId });

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // Cập nhật hoặc thêm số điện thoại
    const update = user.phoneNumber 
      ? { $set: { phoneNumber: phoneNumber } } // Cập nhật số điện thoại hiện có
      : { $set: { phoneNumber: phoneNumber } }; // Thêm số điện thoại mới

    const result = await usersCollection.updateOne(
      { _id: objectId },
      update
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({ message: 'Cập nhật số điện thoại không thành công' });
    }

    res.json({ message: 'Số điện thoại đã được cập nhật thành công' });
  } catch (err) {
    console.error('Lỗi khi cập nhật số điện thoại:', err);
    res.status(500).json({ message: 'Lỗi khi cập nhật số điện thoại' });
  } finally {
    await client.close();
  }
}
async function updateUserName(req, res) {
  try {
    await connectToDB();
    const { newName } = req.body;
    const userId = req.user.userId; // Lấy userId từ JWT token

    if (!newName) {
      return res.status(400).json({ message: 'Tên mới không được để trống' });
    }

    const usersCollection = client.db('managefield').collection('users');
    const objectId = ObjectId.createFromHexString(userId);

    // Tìm người dùng hiện tại
    const user = await usersCollection.findOne({ _id: objectId });

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // Cập nhật tên người dùng
    const result = await usersCollection.updateOne(
      { _id: objectId },
      { $set: { name: newName } }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({ message: 'Cập nhật tên người dùng không thành công' });
    }

    res.json({ message: 'Tên người dùng đã được cập nhật thành công' });
  } catch (err) {
    console.error('Lỗi khi cập nhật tên người dùng:', err);
    res.status(500).json({ message: 'Lỗi khi cập nhật tên người dùng' });
  } finally {
    await client.close();
  }
}




////////team
async function createTeam(req, res) {
  try {
    await connectToDB();
    const { name, description, sport } = req.body;

    if (!name || !description || !sport) {
      return res.status(400).json({ message: 'Thiếu thông tin cần thiết' });
    }

    const teamCollection = client.db('managefield').collection('team');    
    const captainId = req.user.userId;
    const objectId = ObjectId.createFromHexString(captainId);

    const existingTeam = await teamCollection.findOne({ captain: objectId });
    if (existingTeam) {
      return res.status(400).json({ message: 'Người tạo đã là đội trưởng của đội khác' });
    }

    const team = {
      name: name,
      description: description,
      sport: sport,
      captain: objectId,
      members: []
    };

    const result = await teamCollection.insertOne(team); 
    console.log(`New team added with ID ${result.insertedId}`);

    res.json({ message: 'Team created successfully', teamId: result.insertedId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi tạo đội' });
  } finally {
    await client.close();
  }
}
async function addMember(req, res) {
  try {
    await connectToDB();
    const { memberId } = req.params;
    const captainId = req.user.userId;

    if (!memberId) {
      return res.status(400).json({ message:'Thiếu thông tin cần thiết' });
    }

    const teamCollection = client.db('managefield').collection('team');
    const captainObjectId = ObjectId.createFromHexString(captainId);

    // Tìm đội mà người dùng là đội trưởng
    const team = await teamCollection.findOne({ captain: captainObjectId });

    if (!team) {
      return res.status(404).json({ message: 'Đội không tồn tại hoặc người dùng không phải đội trưởng' });
    }

    const memberObjectId = ObjectId.createFromHexString(memberId);

    if (team.members.includes(memberObjectId)) {
      return res.status(400).json({ message: 'Thành viên đã có trong đội' });
    }

    const result = await teamCollection.updateOne(
      { _id: team._id },
      { $push: { members: memberObjectId } }
    );

    res.json({ message: 'Thành viên được thêm thành công', result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi thêm thành viên' });
  } finally {
    await client.close();
  }
}
async function removeMember(req, res) {
  try {
    await connectToDB();
    const { memberId } = req.params;
    const captainId = req.user.userId;

    if (!memberId) {
      return res.status(400).json({ message: 'Thiếu thông tin cần thiết' });
    }

    const teamCollection = client.db('managefield').collection('team');
    const captainObjectId = ObjectId.createFromHexString(captainId);

    // Tìm đội mà người dùng là đội trưởng
    const team = await teamCollection.findOne({ captain: captainObjectId });

    if (!team) {
      return res.status(404).json({ message: 'Đội không tồn tại hoặc người dùng không phải đội trưởng' });
    }

    const memberObjectId = ObjectId.createFromHexString(memberId);

    if (!team.members.includes(memberObjectId)) {
      return res.status(400).json({ message: 'Thành viên không có trong đội' });
    }

    const result = await teamCollection.updateOne(
      { _id: team._id },
      { $pull: { members: memberObjectId } }
    );

    res.json({ message: 'Thành viên đã được xóa thành công', result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi xóa thành viên' });
  } finally {
    await client.close();
  }
}
async function getTeamInfo(req, res) {
  try {
    await connectToDB();
    const userId = req.user.userId;

    const teamCollection = client.db('managefield').collection('team');
    const objectId = ObjectId.createFromHexString(userId);

    
    const team = await teamCollection.findOne({
      $or: [{ captain: objectId }, { members: objectId }]
    });

    if (!team) {
      return res.status(404).json({ message: 'Người dùng không thuộc bất kỳ đội nào' });
    }

    // Trả về thông tin đội
    res.json({
      teamId: team._id,
      name: team.name,
      description: team.description,
      sport: team.sport,
      captain: team.captain,
      members: team.members
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi lấy thông tin đội' });
  } finally {
    await client.close();
  }
}
//field
async function searchField(req, res) {
  try {
    const { date, startTime, endTime, location, sport, capacity } = req.query;

    if (!date || !startTime || !endTime) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }

    // Chuyển đổi tham số thành Date
    const startDateTime = new Date(`${date}T${startTime}:00`);
    const endDateTime = new Date(`${date}T${endTime}:00`);

    await connectToDB(); // Kết nối đến MongoDB

    const bookingsCollection = client.db('managefield').collection('booking');

    // Tìm các sân đã được đặt trong khoảng thời gian này
    const bookedFields = await bookingsCollection.aggregate([
      {
        $match: {
          startTime: { $lt: endDateTime },
          endTime: { $gt: startDateTime }
        }
      },
      {
        $group: {
          _id: "$field" // Nhóm theo sân
        }
      }
    ]).toArray(); // Chuyển đổi kết quả thành mảng

    const bookedFieldIds = bookedFields.map(field => field._id);

    // Xây dựng điều kiện tìm kiếm cho các sân trống
    const searchCriteria = {
      _id: { $nin: bookedFieldIds } // Loại bỏ các sân đã được đặt
    };

    if (location) {
      searchCriteria.location = location;
    }
    if (sport) {
      searchCriteria.sport = sport;
    }
    if (capacity) {
      searchCriteria.capacity = { $gte: parseInt(capacity) }; // Sức chứa >= yêu cầu
    }

    const fieldsCollection = client.db('managefield').collection('field');
    const availableFields = await fieldsCollection.find(searchCriteria).toArray();

    if (availableFields.length === 0) {
      return res.status(404).json({ message: 'No available fields found' });
    }

    res.status(200).json({ fields: availableFields });
  } catch (err) {
    console.error('Error searching fields:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}
//equipmment
async function searchEquipment(req, res) {
  try {
    // Lấy tham số sport từ query
    const { sport } = req.query;

    // Kiểm tra nếu sport không có giá trị
    if (!sport) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu tham số sport.',
      });
    }

    await connectToDB();
    const equipmentCollection = client.db('managefield').collection('equipment');

    // Tìm kiếm trong cơ sở dữ liệu
    const equipments = await equipmentCollection.find({ sport }).toArray();

    // Kiểm tra nếu không tìm thấy thiết bị nào
    if (equipments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thiết bị nào.',
      });
    }

    // Trả về kết quả tìm kiếm
    res.status(200).json({
      equipment: equipments,
    });
  } catch (error) {
    // Xử lý lỗi
    console.error('Error searching equipment:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tìm kiếm thiết bị.',
    });
  }
}
//referee
async function searchReferee(req, res) {
  try {
    // Lấy tham số sport và area từ query
    const { sport, area } = req.query;

    // Xây dựng điều kiện tìm kiếm
    const searchCriteria = {};
    
    if (sport) {
      searchCriteria.sport = sport;
    }
    
    if (area) {
      // area có thể là một chuỗi phân tách bằng dấu phẩy, chuyển đổi thành mảng
      const areaArray = area.split(',').map(a => a.trim());
      searchCriteria.area = { $in: areaArray };
    }

    await connectToDB();
    const refereeCollection = client.db('managefield').collection('referee');

    // Tìm kiếm trong cơ sở dữ liệu
    const referees = await refereeCollection.find(searchCriteria).toArray();

    // Kiểm tra nếu không tìm thấy trọng tài nào
    if (referees.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy trọng tài nào.',
      });
    }

    // Trả về kết quả tìm kiếm
    res.status(200).json({
      success: true,
      referees: referees,
    });
  } catch (error) {
    // Xử lý lỗi
    console.error('Error searching referees:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tìm kiếm trọng tài.',
    });
  }
}
//trainer
async function searchTrainer(req, res) {
  try {
    
    const { sport, area } = req.query;

   
    const searchCriteria = {};
    
    if (sport) {
      searchCriteria.sport = sport;
    }
    
    if (area) {
     
      const areaArray = area.split(',').map(a => a.trim());
      searchCriteria.area = { $in: areaArray };
    }

    await connectToDB();
    const refereeCollection = client.db('managefield').collection('trainer');

    
    const referees = await refereeCollection.find(searchCriteria).toArray();


    if (referees.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy.',
      });
    }

   
    res.status(200).json({
      success: true,
      referees: referees,
    });
  } catch (error) {
    // Xử lý lỗi
    console.error('Error searching:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tìm kiếm.',
    });
  }
}
//booking
async function createBooking(req, res) {
  try {
    // Lấy dữ liệu từ body request
    const {  fieldId, startTime, endTime, equipmentId, refereeId, trainerId } = req.body;
    const userId = req.user.userId
    // Kiểm tra các tham số cần thiết
    if ( !fieldId || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin cần thiết.',
      });
    }

    // Kiểm tra nếu thời gian đặt sân hợp lệ
    if (new Date(startTime) >= new Date(endTime)) {
      return res.status(400).json({
        success: false,
        message: 'Thời gian kết thúc phải sau thời gian bắt đầu.',
      });
    }

    // Kết nối đến cơ sở dữ liệu
    await connectToDB();

    // Khởi tạo biến tính tổng giá tiền
    let totalPrice = 0;

    // Tìm thông tin sân
    const fieldCollection = client.db('managefield').collection('field');
    const field = await fieldCollection.findOne({ _id: ObjectId.createFromHexString(fieldId) });
    if (!field) {
      return res.status(404).json({
        success: false,
        message: 'Sân không tồn tại.',
      });
    }
    totalPrice += field.price;

    // Tìm thông tin thiết bị nếu có
    if (equipmentId) {
      const equipmentCollection = client.db('managefield').collection('equipment');
      const equipment = await equipmentCollection.findOne({ _id: ObjectId.createFromHexString(equipmentId) });
      if (equipment) {
        totalPrice += equipment.price;
      }
    }

    // Tìm thông tin trọng tài nếu có
    if (refereeId) {
      const refereeCollection = client.db('managefield').collection('referee');
      const referee = await refereeCollection.findOne({ _id: ObjectId.createFromHexString(refereeId) });
      if (referee) {
        totalPrice += referee.price;
      }
    }

    // Tìm thông tin huấn luyện viên nếu có
    if (trainerId) {
      const trainerCollection = client.db('managefield').collection('trainer');
      const trainer = await trainerCollection.findOne({ _id:ObjectId.createFromHexString(trainerId) });
      if (trainer) {
        totalPrice += trainer.price;
      }
    }

    // Tạo một booking mới
    const newBooking = new Booking({
      user: ObjectId.createFromHexString(userId),
      field: fieldId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      equipment: equipmentId ? ObjectId.createFromHexString(equipmentId) : null,
      referee: refereeId ? ObjectId.createFromHexString(refereeId) : null,
      trainer: trainerId ? ObjectId.createFromHexString(trainerId) : null,
      totalPrice,
      status: 'unpaid',
    });

    // Lưu vào cơ sở dữ liệu
    const bookingsCollection=client.db('managefield').collection('booking')
    const result= bookingsCollection.insertOne(newBooking);

    // Trả về kết quả thành công
    res.status(201).json({
      result: result,
      message: 'Đặt sân thành công.',
      booking: newBooking,
    });
  } catch (error) {
    // Xử lý lỗi
    console.error('Error booking field:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi đặt sân.',
    });
  }
}
//matching
 
async function sendMatchRequest(req, res) {
  try {
    const { teamId, fieldId, startTime, endTime, message, max_number } = req.body;

    // Kiểm tra dữ liệu cần thiết
    if (!teamId || !fieldId || !startTime || !endTime || !max_number) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin cần thiết.',
      });
    }

    // Kiểm tra nếu thời gian bắt đầu và kết thúc hợp lệ
    if (new Date(startTime) >= new Date(endTime)) {
      return res.status(400).json({
        success: false,
        message: 'Thời gian kết thúc phải sau thời gian bắt đầu.',
      });
    }

    await connectToDB();
    const matchCollection= client.db('managefield').collection('matching')
    // Tạo một yêu cầu mới
    const newRequest = new Matching({
      teamId,
      fieldId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      message: message || '', // Đảm bảo message không null
      max_number,
      matchedUser: [], 
      matchedCount: 0// Khởi tạo mảng matchedUser rỗng
    });

    // Lưu vào cơ sở dữ liệu
    const result=await matchCollection.insertOne(newRequest);

    res.status(201).json({
      matching_id :result._id,
      message: 'Gửi yêu cầu thành công.',
      matchRequest: newRequest,
    });
  } catch (error) {
    console.error('Error sending match request:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi gửi yêu cầu.',
    });
  }
}
async function getMatchRequests(req, res) {
  try {
    await connectToDB();
    const currentTime = new Date();
    const matchRequestCollection = client.db('managefield').collection('matching');

    // Lấy danh sách các yêu cầu
    const requests = await matchRequestCollection.find({ startTime: { $gt: currentTime } }).toArray();

    // Lấy danh sách các yêu cầu với startTime chưa diễn ra
   

    res.status(200).json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error('Error getting match requests:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách yêu cầu.',
    });
  }
}



async function respondToMatchRequest(req, res) {
  try {
    const { matchingId, quantity } = req.body;

    // Kiểm tra các tham số cần thiết
    if (!matchingId || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin cần thiết.',
      });
    }

    await connectToDB();
    const matchRequestCollection = client.db('managefield').collection('matching');

    // Tìm kiếm yêu cầu matching theo ID
    const matchRequest = await matchRequestCollection.find({_id:  ObjectId.createFromHexString(matchingId)});

    if (!matchRequest) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu matching.',
      });
    }

    const remainingSlots = matchRequest.max_number - matchRequest.matchedCount;

    // Kiểm tra nếu số lượng yêu cầu vượt quá số slot còn lại
    if (remainingSlots < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Số lượng yêu cầu vượt quá số slot còn lại.',
      });
    }

    // Cập nhật thông tin người dùng và số lượng vào matchedUser
    const updateData = {
      $push: { matchedUser: { userId: req.user.userId, quantity: quantity } },
      $inc: { matchedCount: quantity }, // Cộng thêm quantity vào matchedCount
      $set: { updatedAt: new Date() }
    };

    const result=await matchRequestCollection.updateOne({ _id: ObjectId.createFromHexString(matchingId) }, updateData);

    res.status(200).json({
      success: true,
      message: result,
    });
  } catch (error) {
    console.error('Error responding to match request:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi phản hồi yêu cầu.',
    });
  }
}




































module.exports = { registerUser,loginUser,getUserInfo,addOrUpdateAddress,addOrUpdatePhoneNumber,changePassword,updateUserName,
  createTeam, addMember,removeMember,getTeamInfo,
  searchField,
  searchEquipment,
  searchReferee,
  searchTrainer,
  createBooking,
  sendMatchRequest,getMatchRequests,respondToMatchRequest
};