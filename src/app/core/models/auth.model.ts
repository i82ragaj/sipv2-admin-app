// Refleja Contracts/Auth/LoginRequest.cs y LoginResponse.cs

export interface LoginRequest {
  login: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  userId: string;
  name: string;
  roles: string[];
}
