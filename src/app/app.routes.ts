import { Routes } from '@angular/router';
import { VisitorFormComponent } from './pages/visitor-form/visitor-form.component';
import { ThankyouPageComponent } from './pages/thankyou-page/thankyou-page.component';


export const routes: Routes = [
    {
        path:'',component:VisitorFormComponent
    },
    {
        path:'thankyou',component:ThankyouPageComponent
    }
    
   

];
