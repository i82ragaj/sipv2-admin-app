import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ChangeOwnPasswordRequest } from '../models/account.model';

// Refleja Controllers/AccountController.cs -> [Route("api/account")]
// Autoservicio: actúa sobre el usuario autenticado (identificado por el JWT), cualquier rol.
@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/account`;

  changeOwnPassword(request: ChangeOwnPasswordRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/password`, request);
  }
}
