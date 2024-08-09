import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PurposeResponse } from '../../Models/IPurposeResponse';


import { map } from 'rxjs/operators';
import { DeviceResponse } from '../../Models/IDeviceResponse';


@Injectable({
  providedIn: 'root'
})
export class DataserviceService {

  constructor(private http:HttpClient) { }
 

  getContactPerson(): Observable<string[]> {
    const apiUrl = "https://localhost:7121/Visitor/GetPersonInContact";
    return this.http.get<{ $id: string, $values: string[] }>(apiUrl).pipe(
      map((response: { $id: string, $values: string[] }) => response.$values)
    );
  }
       
    
  getVisitPurpose(): Observable<PurposeResponse[]> {
    const apiUrl = "https://localhost:7121/PurposeOfVisit/GetApprovedPurposesIdAndName";
    return this.http.get<{ $id: string, $values: PurposeResponse[] }>(apiUrl).pipe(
      map(response => response.$values)
    );
  }
      
  getDevice():Observable<DeviceResponse[]>{
    const apiUrl="https://localhost:7121/Device/GetDeviceIdAndName";
    return this.http.get<{ $id: string, $values: DeviceResponse[] }>(apiUrl).pipe(
      map(response => response.$values)
    );
   }

   createVisitorAndAddItem(visitor:any):Observable<any[]>{
    console.log("log details",visitor);
    // visitor.OfficeLocationId = 1;
    const apiUrl="https://localhost:7121/Visitor/CreateVisitor";
     return this.http.post<any>(apiUrl,visitor);
   }

  
addPurpose(purpose: string): Observable<PurposeResponse> {
  const apiUrl = "https://localhost:7121/PurposeOfVisit/PostPurpose"; // Adjust URL as per your API endpoint

  return this.http.post<PurposeResponse>(apiUrl, { purposeName: purpose });
}
addDevice(device: string ): Observable<DeviceResponse> {
  return this.http.post<DeviceResponse>('https://localhost:7121/Device/PostDevice', {deviceName:device});
}
   
   

};

