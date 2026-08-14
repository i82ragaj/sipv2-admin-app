// Refleja Contracts/UserRoles/*.cs (UserRolDto, CreateUserRolRequest, UpdateUserRolRequest)

export interface UserRol {
  id: string;
  userId: string | null;
  userLogin: string | null;
  rolId: string | null;
  rolName: string | null;
  active: boolean;
}

export interface CreateUserRolRequest {
  userId: string;
  rolId: string;
}

// El backend solo permite activar/desactivar la asignación desde el PUT.
export interface UpdateUserRolRequest {
  active: boolean;
}
