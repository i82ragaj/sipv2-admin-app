import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ParkingType } from '../models/parking-type.model';

// Refleja Controllers/ParkingTypesController.cs -> [Route("api/parking-types")]
// Solo lectura: no hay pantalla de alta/edición de tipos todavía.
@Injectable({ providedIn: 'root' })
export class ParkingTypeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/parking-types`;

  getAll(): Observable<ParkingType[]> {
    return this.http.get<ParkingType[]>(this.baseUrl);
  }
}
