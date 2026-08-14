import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateParkingRequest, Parking, UpdateParkingRequest } from '../models/parking.model';

// Refleja Controllers/ParkingsController.cs -> [Route("api/parkings")] (Id es string, no Guid)
@Injectable({ providedIn: 'root' })
export class ParkingService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/parkings`;

  getAll(): Observable<Parking[]> {
    return this.http.get<Parking[]>(this.baseUrl);
  }

  getById(id: string): Observable<Parking> {
    return this.http.get<Parking>(`${this.baseUrl}/${id}`);
  }

  create(request: CreateParkingRequest): Observable<Parking> {
    return this.http.post<Parking>(this.baseUrl, request);
  }

  update(id: string, request: UpdateParkingRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
