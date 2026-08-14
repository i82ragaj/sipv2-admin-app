import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ParkingStatus } from '../models/parking-status.model';

// Refleja Controllers/ParkingStatusesController.cs -> [Route("api/parking-statuses")]
// Solo lectura: no expone Create/Update/Delete.
@Injectable({ providedIn: 'root' })
export class ParkingStatusService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/parking-statuses`;

  getAll(): Observable<ParkingStatus[]> {
    return this.http.get<ParkingStatus[]>(this.baseUrl);
  }

  getById(id: string): Observable<ParkingStatus> {
    return this.http.get<ParkingStatus>(`${this.baseUrl}/${id}`);
  }
}
