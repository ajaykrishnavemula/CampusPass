import { User } from '../models';
import { IUser, UserRole, JWTPayload } from '../types';
import { hashPassword, comparePassword } from '../utils/hash';
import { logger } from '../utils/logger';

export class AuthService {
  static async register(userData: {
    name: string;
    email: string;
    password: string;
    phone: string;
    rollNumber?: string;
    department?: string;
    year?: number;
    hostel?: string;
    roomNumber?: string;
    parentPhone?: string;
    role?: UserRole;
  }): Promise<IUser> {
    try {
      // Check if user already exists (single query with $or)
      const conditions: any[] = [{ email: userData.email }];
      if (userData.rollNumber) {
        conditions.push({ rollNumber: userData.rollNumber });
      }

      const existingUser = await User.findOne({ $or: conditions });
      if (existingUser) {
        if (existingUser.email === userData.email) {
          throw new Error('User with this email already exists');
        }
        if (existingUser.rollNumber === userData.rollNumber) {
          throw new Error('User with this roll number already exists');
        }
      }

      // Hash password
      const hashedPassword = await hashPassword(userData.password);

      // Create user
      const user = await User.create({
        ...userData,
        password: hashedPassword,
        role: userData.role || UserRole.STUDENT,
      });

      logger.info(`New user registered: ${user.email}`);
      return user.toJSON() as unknown as IUser;
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  static async login(
    email: string,
    password: string
  ): Promise<IUser> {
    try {
      // Find user with password field and populate hostel
      const user = await User.findOne({ email })
        .select('+password')
        .populate('hostel', 'name code');
        
      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Check if user is active
      if (!user.isActive) {
        throw new Error('Account is deactivated. Please contact administrator');
      }

      // Verify password
      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      logger.info(`User logged in: ${user.email}`);

      // Return user without password
      return user.toJSON() as unknown as IUser;
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  static async getUserById(userId: string): Promise<IUser | null> {
    const user = await User.findById(userId)
      .populate('hostel', 'name code')
      .lean();
    return user as IUser | null;
  }

  static async updateProfile(
    userId: string,
    updates: Partial<IUser>
  ): Promise<IUser> {
    // Remove fields that shouldn't be updated directly
    const { password, email, role, _id, ...allowedUpdates } = updates as any;

    const user = await User.findByIdAndUpdate(userId, allowedUpdates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      throw new Error('User not found');
    }

    logger.info(`User profile updated: ${user.email}`);
    return user.toJSON() as unknown as IUser;
  }

  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    // Validate new password
    if (!newPassword || newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long');
    }

    if (newPassword === currentPassword) {
      throw new Error('New password must be different from current password');
    }

    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash and update new password
    user.password = await hashPassword(newPassword);
    await user.save();

    logger.info(`Password changed for user: ${user.email}`);
  }

  static generateJWTPayload(user: IUser): JWTPayload {
    return {
      id: user._id,
      email: user.email,
      role: user.role,
    };
  }
}

// 
