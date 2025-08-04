import { RequestHandler } from "express";
import { GetUserDataResponse, ErrorResponse } from "@shared/api";

// Mock user data (replace with real DB in production)
const users = {
  'employee01': {
    username: 'employee01',
    displayName: 'John Doe',
    role: 'Employee',
    department: 'Engineering'
  },
  'employee02': {
    username: 'employee02',
    displayName: 'Lisa Thompson',
    role: 'Employee',
    department: 'Engineering'
  },
  'employee03': {
    username: 'employee03',
    displayName: 'Mike Chen',
    role: 'Employee',
    department: 'Product'
  },
  'manager01': {
    username: 'manager01',
    displayName: 'Sarah Wilson',
    role: 'Management',
    department: 'Management'
  }
};

// GET /api/users/:username - Get user data with all related records
export const getUserData: RequestHandler = async (req, res) => {
  const { username } = req.params;
  
  const user = users[username as keyof typeof users];
  if (!user) {
    const error: ErrorResponse = {
      success: false,
      error: 'NOT_FOUND',
      message: 'User not found'
    };
    return res.status(404).json(error);
  }
  
  // In a real implementation, these would be database queries
  // For now, we'll import the data from the other route handlers
  try {
    // Import acceptances and submissions data
    // Note: In production, this should be done via shared database access
    const acceptancesResponse = await fetch(`${req.protocol}://${req.get('host')}/api/challenges/acceptances/${username}`);
    const submissionsResponse = await fetch(`${req.protocol}://${req.get('host')}/api/submissions/user/${username}`);
    const reviewsResponse = await fetch(`${req.protocol}://${req.get('host')}/api/submissions/reviews`);
    
    const acceptances = acceptancesResponse.ok ? (await acceptancesResponse.json()).data : [];
    const submissions = submissionsResponse.ok ? (await submissionsResponse.json()).data : [];
    const allReviews = reviewsResponse.ok ? (await reviewsResponse.json()).data : [];
    const userReviews = allReviews.filter((review: any) => review.username === username);
    
    const response: GetUserDataResponse = {
      user,
      acceptances,
      submissions,
      reviews: userReviews
    };
    
    res.status(200).json({
      success: true,
      data: response
    });
  } catch (error) {
    // Fallback to empty arrays if internal requests fail
    const response: GetUserDataResponse = {
      user,
      acceptances: [],
      submissions: [],
      reviews: []
    };
    
    res.status(200).json({
      success: true,
      data: response
    });
  }
};

// GET /api/users - Get all users (for admin purposes)
export const getAllUsers: RequestHandler = (req, res) => {
  res.status(200).json({
    success: true,
    data: Object.values(users)
  });
};
