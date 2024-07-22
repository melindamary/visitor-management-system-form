import { Component } from '@angular/core';
import { DatePipe } from '@angular/common';
@Component({
  selector: 'app-redheader-component',
  standalone: true,
  imports: [],
  templateUrl: './redheader-component.component.html',
  styleUrl: './redheader-component.component.scss'
})
export class RedheaderComponentComponent {
  currentDateandTime!: string;
  

  constructor(private datePipe: DatePipe) {}

  ngOnInit() {
    this.updateDate();
    setInterval(() => this.updateDate(), 1000); // Update every second
  }

  updateDate() {
    this.currentDateandTime = this.datePipe.transform(new Date(), 'dd-MM-yyyy   HH:mm:ss')!;
    
  }
}
