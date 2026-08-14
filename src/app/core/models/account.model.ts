// Refleja Contracts/Users/ChangeOwnPasswordRequest.cs (endpoint PUT /api/account/password)

export interface ChangeOwnPasswordRequest {
  currentPassword: string;
  newPassword: string;
}
