// Refleja Contracts/Roles/*.cs (RolDto, CreateRolRequest, UpdateRolRequest)

export interface Rol {
  id: string;
  name: string | null;
  description: string | null;
  active: boolean;
}

export interface CreateRolRequest {
  name: string;
  description: string | null;
}

export interface UpdateRolRequest {
  name: string | null;
  description: string | null;
  active: boolean;
}
