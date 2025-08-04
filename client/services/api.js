// API service for backend communication

const API_BASE = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : '');

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;

    // Get current user from localStorage for authentication
    const currentUser = localStorage.getItem('challengeHub_user');
    const userObj = currentUser ? JSON.parse(currentUser) : null;

    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    if (userObj?.username) {
      defaultHeaders['x-user-id'] = userObj.username;
    }

    try {
      const response = await fetch(url, {
        headers: { ...defaultHeaders, ...options.headers },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `API request failed: ${response.status} ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error(`API request failed for ${url}:`, error);
      throw error;
    }
  }

  // Challenge APIs
  async getAllChallenges() {
    const response = await this.request('/api/challenges', {
      method: 'GET'
    });
    return response.data;
  }

  async getChallengeById(id) {
    const response = await this.request(`/api/challenges/${id}`, {
      method: 'GET'
    });
    return response.data;
  }

  async getChallengeAcceptanceStatus(challengeId) {
    const response = await this.request(`/api/challenges/${challengeId}/acceptance-status`, {
      method: 'GET'
    });
    return response.data;
  }

  async createChallenge(challengeData) {
    const response = await this.request('/api/challenges', {
      method: 'POST',
      body: JSON.stringify(challengeData),
    });
    return response.data;
  }

  async acceptChallenge(challengeId, committedDate) {
    const request = { challengeId, committedDate };
    const response = await this.request('/api/challenges/accept', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response.data;
  }

  async getUserAcceptances(username) {
    const response = await this.request(`/api/challenges/acceptances/${username}`);
    return response.data;
  }

  async getChallengeAcceptances(challengeId) {
    const response = await this.request(`/api/challenges/${challengeId}/acceptances`);
    return response.data;
  }

  async updateAcceptanceStatus(acceptanceId, status) {
    const response = await this.request(`/api/challenges/acceptances/${acceptanceId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return response.data;
  }

  async withdrawChallenge(acceptanceId) {
    const response = await this.request(`/api/challenges/accept/${acceptanceId}`, {
      method: 'DELETE'
    });
    return response.data;
  }

  // Submission APIs
  async getAllSubmissions(userId) {
    const query = userId ? `?userId=${userId}` : '';
    const response = await this.request(`/api/submissions${query}`);
    return response.data;
  }

  async getSubmissionById(id) {
    const response = await this.request(`/api/submissions/${id}`);
    return response.data;
  }

  async submitSolution(submissionData) {
    const response = await this.request('/api/submissions', {
      method: 'POST',
      body: JSON.stringify(submissionData),
    });
    return response.submission;
  }

  async getUserSubmissions(username) {
    const response = await this.request(`/api/submissions/user/${username}`);
    return response.data;
  }

  async getChallengeSubmissions(challengeId) {
    const response = await this.request(`/api/submissions/challenge/${challengeId}`);
    return response.data;
  }

  // Review APIs
  async getAllReviews(status) {
    const query = status ? `?status=${status}` : '';
    const response = await this.request(`/api/submissions/reviews${query}`);
    return response.data;
  }

  async reviewSubmission(submissionId, action, comment) {
    const request = { action, comment };
    const response = await this.request(`/api/submissions/${submissionId}/review`, {
      method: 'PATCH',
      body: JSON.stringify(request),
    });
    return response.review;
  }

  // User APIs
  async getUserData(username) {
    const response = await this.request(`/api/users/${username}`);
    return response.data;
  }

  async getAllUsers() {
    const response = await this.request('/api/users');
    return response.data;
  }
}

export const apiService = new ApiService();