import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiResponse,LocationDetails } from '../../Models/location-details.interface';

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private apiUrl = 'https://localhost:7121/Location';

  constructor(private http: HttpClient,
              @Inject(PLATFORM_ID) private platformId: Object) { }

  // Fetch all location details
  getAllLocationDetails(): Observable<LocationDetails[]> {
    return this.http.get<ApiResponse<{ $values: LocationDetails[] }>>(`${this.apiUrl}/LocationList`).pipe(
      map(response => response.result.$values)
    );
  }


}
