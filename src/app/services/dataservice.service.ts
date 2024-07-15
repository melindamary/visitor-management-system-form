import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { IPurposeList } from '../Models/IPurposeList';
import { IItemList } from '../Models/IItemList';

@Injectable({
  providedIn: 'root'
})
export class DataserviceService {

  constructor(private http:HttpClient) { }
 

    getContactPerson() :Observable<string[]>{
      const apiUrl="https://localhost:7174/Visitor/GetPersonInContact";
       return this.http.get<string[]>(apiUrl);
     }
       
    
    getVisitPurpose() :Observable<IPurposeList[]>{
     const apiUrl="https://localhost:7174/Purpose/GetPurposes";
      return this.http.get<IPurposeList[]>(apiUrl);
    }
      
  getItemsCarried():Observable<IItemList[]>{
    const apiUrl=" https://localhost:7174/ItemsCarried/GetItems";
     return this.http.get<IItemList[]>(apiUrl);
   }

   createVisitorAndAddItem(visitor:any):Observable<any[]>{
    console.log("log details",visitor);
    
    const apiUrl="https://localhost:7174/Visitor/CreateVisitorAndAddItem/create-and-add-item";
     return this.http.post<any>(apiUrl,visitor);
   }
   
   

};

