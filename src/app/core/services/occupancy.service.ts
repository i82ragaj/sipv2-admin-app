import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CurrentOccupancy } from '../models/current-occupancy.model';

// Refleja Controllers/OccupancyController.cs -> [Route("api/occupancy")]
// Solo lectura: foto del estado actual, sin paginar.
@Injectable({ providedIn: 'root' })
export class OccupancyService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/occupancy`;

  getCurrent(parkingId?: string | null): Observable<CurrentOccupancy[]> {
    let params = new HttpParams();
    if (parkingId) {
      params = params.set('parkingId', parkingId);
    }
    return this.http.get<CurrentOccupancy[]>(`${this.baseUrl}/current`, { params });
  }
}
