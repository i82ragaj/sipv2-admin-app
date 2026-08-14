import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CounterConfig,
  CreateCounterConfigRequest,
  UpdateCounterConfigRequest,
} from '../models/counter-config.model';

// Refleja Controllers/CounterConfigsController.cs -> [Route("api/counter-configs")]
@Injectable({ providedIn: 'root' })
export class CounterConfigService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/counter-configs`;

  getAll(): Observable<CounterConfig[]> {
    return this.http.get<CounterConfig[]>(this.baseUrl);
  }

  getById(id: string): Observable<CounterConfig> {
    return this.http.get<CounterConfig>(`${this.baseUrl}/${id}`);
  }

  create(request: CreateCounterConfigRequest): Observable<CounterConfig> {
    return this.http.post<CounterConfig>(this.baseUrl, request);
  }

  update(id: string, request: UpdateCounterConfigRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
