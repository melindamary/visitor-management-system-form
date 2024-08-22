import { Routes } from '@angular/router';
import { VisitorFormComponent } from './pages/visitor-form/visitor-form.component';
import { ThankyouPageComponent } from './pages/thankyou-page/thankyou-page.component';
import { VisitorConsentModalComponent } from './pages/visitor-consent-modal/visitor-consent-modal.component';
import { WelcomepageComponent } from './pages/welcomepage/welcomepage.component';
import { BootingPageComponent } from './pages/booting-page/booting-page.component';


export const routes: Routes = [
    {
        path:'',component:BootingPageComponent

    },

    {
       path:'welcomepage',component:WelcomepageComponent
    },
    {
        path:'privacy',component:VisitorConsentModalComponent
    },
    {
        path:'visitorForm',component:VisitorFormComponent
    },
    {
        path:'thankyou',component:ThankyouPageComponent
    }
    
   

];
