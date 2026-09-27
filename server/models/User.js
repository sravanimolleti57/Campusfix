import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your full name'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Do not return password by default in queries
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    role: {
      type: String,
      enum: {
        values: ['student', 'staff', 'admin'],
        message: '{VALUE} is not a recognized role',
      },
      default: 'student',
    },
    studentId: {
      type: String,
      trim: true,
      sparse: true, // Allows null/unique index only for documents with this field
    },
    employeeId: {
      type: String,
      trim: true,
      sparse: true,
    },
    department: {
      type: String,
      required: [true, 'Please specify your department or division'],
      trim: true,
    },
    profileImage: {
      type: String,
      default: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook: Hash password with bcryptjs before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method: compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Instance method: return safe user JSON representation
userSchema.methods.toSafeObject = function () {
  const userObj = this.toObject ? this.toObject() : { ...this };
  delete userObj.password;
  return userObj;
};

const User = mongoose.model('User', userSchema);

export default User;
