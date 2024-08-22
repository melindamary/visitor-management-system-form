import { Component, inject, NgModule } from '@angular/core';
import { LocationService } from '../../services/locationServices/locationservice.service'; // Adjust the import based on your project structure
import { NgFor, NgIf } from '@angular/common';
import { Router } from '@angular/router';
interface LocationDetails {
  id: number;
  name: string;
  address: string;
  phone: string | null;
  createdDate: string;
}
@Component({
  selector: 'app-booting-page',
  standalone: true,
  imports: [NgFor,NgIf],
  templateUrl: './booting-page.component.html',
  styleUrl: './booting-page.component.scss'
})
export class BootingPageComponent {
  locations: any[] = [];
  selectedLocationId: number | null = null;
  selectedLocationName: string = '';
  showConfirmationMessage: boolean = false;
  private router = inject(Router);


  constructor(private locationService: LocationService) { }

  ngOnInit(): void {
    // this.locations = this.getInitialDummyData();

    this.locationService.getAllLocationDetails().subscribe(response => {
      this.locations = response;
    });
  }

  onLocationChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    this.selectedLocationId = Number(selectElement.value);
    const selectedLocation = this.locations.find(location => location.id === this.selectedLocationId);
    if (selectedLocation) {
      this.selectedLocationName = selectedLocation.name;
      this.showConfirmationMessage = true;
    }
  }



  confirmSelection(): void {
    if (this.selectedLocationId && this.selectedLocationName) {
      localStorage.setItem('officeLocationId', this.selectedLocationId.toString());
      localStorage.setItem('LocationName', this.selectedLocationName);
      this.showConfirmationMessage = false; // Hide the message after saving
    }
    this.router.navigate(['/welcomepage'])
  }
}
