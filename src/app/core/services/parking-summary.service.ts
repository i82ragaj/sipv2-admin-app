import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ParkingSummary } from '../models/parking-summary.model';
import { ParkingSummaryDetail } from '../models/parking-summary-detail.model';
import { PagedResult } from '../models/paged-result.model';

export interface ParkingSummaryQuery {
  parkingId?: string | null;
  dateFrom?: string | null; // 'yyyy-MM-dd'
  dateTo?: string | null; // 'yyyy-MM-dd'
  pageIndex: number;
  pageSize: number;
}

// Refleja Controllers/ParkingSummariesController.cs -> [Route("api/parking-summaries")]
// Solo lectura: no expone Create/Update/Delete. Filtro y paginación en servidor.
@Injectable({ providedIn: 'root' })
export class ParkingSummaryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/parking-summaries`;

  getPaged(query: ParkingSummaryQuery): Observable<PagedResult<ParkingSummary>> {
    let params = new HttpParams()
      .set('pageIndex', query.pageIndex)
      .set('pageSize', query.pageSize);

    if (query.parkingId) {
      params = params.set('parkingId', query.parkingId);
    }
    if (query.dateFrom) {
      params = params.set('dateFrom', query.dateFrom);
    }
    if (query.dateTo) {
      params = params.set('dateTo', query.dateTo);
    }

    return this.http.get<PagedResult<ParkingSummary>>(this.baseUrl, { params });
  }

  // Desglose por tipo de pago de una fila (panel de detalle desplegable).
  // summaryId es el Id de esa fila; si es null, el backend cae a idpk+date.
  getDetails(idpk: string, date: string, summaryId: string | null): Observable<ParkingSummaryDetail[]> {
    let params = new HttpParams().set('idpk', idpk).set('date', date);
    if (summaryId) {
      params = params.set('summaryId', summaryId);
    }
    return this.http.get<ParkingSummaryDetail[]>(`${this.baseUrl}/details`, { params });
  }
}
