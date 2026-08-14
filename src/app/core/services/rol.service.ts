import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateRolRequest, Rol, UpdateRolRequest } from '../models/rol.model';

// Refleja Controllers/RolesController.cs -> [Route("api/roles")]
@Injectable({ providedIn: 'root' })
export class RolService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/roles`;

  getAll(): Observable<Rol[]> {
    return this.http.get<Rol[]>(this.baseUrl);
  }

  getById(id: string): Observable<Rol> {
    return this.http.get<Rol>(`${this.baseUrl}/${id}`);
  }

  create(request: CreateRolRequest): Observable<Rol> {
    return this.http.post<Rol>(this.baseUrl, request);
  }

  update(id: string, request: UpdateRolRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
