import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ParkingSummary } from '../models/parking-summary.model';

// Refleja Controllers/ParkingSummariesController.cs -> [Route("api/parking-summaries")]
// Solo lectura: no expone Create/Update/Delete.
@Injectable({ providedIn: 'root' })
export class ParkingSummaryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/parking-summaries`;

  getAll(): Observable<ParkingSummary[]> {
    return this.http.get<ParkingSummary[]>(this.baseUrl);
  }
}
