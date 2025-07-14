const User = require('../../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { registerSchema, loginSchema } = require('../../validators/authValidators');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// ✅ Register Controller
exports.register = async (req, res) => {
  try {
    // Validate input
    const { error } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { name, email, password, gender } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already in use.' });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Assign avatar based on gender
    const baseUrl = "https://avatar.iran.liara.run/public";
    const normalizedGender = gender.trim().toLowerCase();

    let profile;
    if (normalizedGender === "male") {
      profile = `${baseUrl}/boy?username=${encodeURIComponent(name)}`;
    } else {
      profile = `${baseUrl}/girl?username=${encodeURIComponent(name)}`;
    }

    // Create user
    const newUser = await User.create({
      name,
      email,
      gender: normalizedGender,
      profile,
      password: hashedPassword
    });

    // Respond with created user
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        gender: newUser.gender,
        profile: newUser.profile
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ✅ Login Controller
exports.login = async (req, res) => {
  try {
    // Validate input
    const { error } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // ✅ false in development
      sameSite: 'lax', // ✅ helps cookies work cross-origin in dev
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });


    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


//logout

exports.logoutUser = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: false,
    sameSite: "lax"
    // path: "/", // ✅ also match this if you set it during login
  });

  // ✅ Always respond
  return res.status(200).json({
    success: true,
    message: "Logged out successfully!",
  });
};
