import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateUserRolRequest, UpdateUserRolRequest, UserRol } from '../models/user-rol.model';

// Refleja Controllers/UserRolesController.cs -> [Route("api/user-roles")]
@Injectable({ providedIn: 'root' })
export class UserRolService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/user-roles`;

  getAll(): Observable<UserRol[]> {
    return this.http.get<UserRol[]>(this.baseUrl);
  }

  getById(id: string): Observable<UserRol> {
    return this.http.get<UserRol>(`${this.baseUrl}/${id}`);
  }

  create(request: CreateUserRolRequest): Observable<UserRol> {
    return this.http.post<UserRol>(this.baseUrl, request);
  }

  // El backend solo expone activar/desactivar mediante este PUT (UserRolesController.UpdateActive).
  updateActive(id: string, request: UpdateUserRolRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
