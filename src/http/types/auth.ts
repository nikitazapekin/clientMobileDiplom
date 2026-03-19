export interface LoginRequest {
  login: string;  
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  phone: string;
  country: string;
  description?: string;
}

export interface AuthResponse {
  accessToken: string;
  expiresIn: string;
  tokenType: string;
  userId: string;
  email: string;
  role: 'client' | 'admin';
  fullName: string;
}
