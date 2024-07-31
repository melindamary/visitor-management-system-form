import { NgIf } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms'; // Import FormsModule here
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
@Component({
  selector: 'app-visitor-consent-modal',
  standalone: true,
  imports: [FormsModule,NgIf,MatDialogModule,MatButtonModule,MatInputModule ],
  templateUrl:'./visitor-consent-modal.component.html',
  styleUrl: './visitor-consent-modal.component.scss'
})
export class VisitorConsentModalComponent {
  currentDate: string;
  location:string="Gayathri";
  constructor(private router: Router,public dialogRef: MatDialogRef<VisitorConsentModalComponent>) {
    this.currentDate = new Date().toISOString().split('T')[0];
  }
  closeAndNavigate(): void {
    this.router.navigate(['/shared-table']);
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
