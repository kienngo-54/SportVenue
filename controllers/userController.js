const { MongoClient, ServerApiVersion, ObjectId} = require('mongodb');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const Team= require('../models/team');
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
    const { memberId } = req.body;
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
    const { memberId } = req.body;
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











module.exports = { registerUser,loginUser,getUserInfo,addOrUpdateAddress,addOrUpdatePhoneNumber,changePassword,updateUserName,createTeam, addMember,removeMember,getTeamInfo };