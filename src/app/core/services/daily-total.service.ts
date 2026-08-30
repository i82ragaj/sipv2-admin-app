import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DailyTotal } from '../models/daily-total.model';
import { PagedResult } from '../models/paged-result.model';

export interface DailyTotalQuery {
  parkingId?: string | null;
  dateFrom?: string | null; // 'yyyy-MM-dd'
  dateTo?: string | null; // 'yyyy-MM-dd'
  pageIndex: number;
  pageSize: number;
}

// Refleja Controllers/DailyTotalsController.cs -> [Route("api/daily-totals")]
// Solo lectura: no expone Create/Update/Delete. Filtro y paginación en servidor.
@Injectable({ providedIn: 'root' })
export class DailyTotalService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/daily-totals`;

  getPaged(query: DailyTotalQuery): Observable<PagedResult<DailyTotal>> {
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

    return this.http.get<PagedResult<DailyTotal>>(this.baseUrl, { params });
  }

  // Serie sin paginar para el gráfico de evolución: últimos 7 días naturales
  // antes del último dato disponible del parking, ascendente por fecha.
  getSeries(parkingId: string): Observable<DailyTotal[]> {
    const params = new HttpParams().set('parkingId', parkingId);
    return this.http.get<DailyTotal[]>(`${this.baseUrl}/series`, { params });
  }
}
