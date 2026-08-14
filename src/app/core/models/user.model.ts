// Refleja Contracts/Users/*.cs (UserDto, CreateUserRequest, UpdateUserRequest)

export interface User {
  id: string;
  name: string;
  lastName: string | null;
  lastName1: string | null;
  login: string;
  email: string | null;
  phone: string | null;
  active: boolean;
}

export interface CreateUserRequest {
  name: string;
  lastName: string | null;
  lastName1: string | null;
  login: string;
  password: string;
  email: string | null;
  phone: string | null;
}

export interface UpdateUserRequest {
  name: string;
  lastName: string | null;
  lastName1: string | null;
  email: string | null;
  phone: string | null;
  active: boolean;
}

// Un Admin fija la contraseña de cualquier usuario (PUT /api/users/{id}/password), sin
// necesidad de conocer la actual.
export interface ResetPasswordRequest {
  newPassword: string;
}
