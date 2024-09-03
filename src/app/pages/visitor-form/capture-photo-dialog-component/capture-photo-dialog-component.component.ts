import { Component } from '@angular/core';
import { Subject } from 'rxjs';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { WebcamImage, WebcamModule } from 'ngx-webcam';
import { NgIf } from '@angular/common';
import {MatSnackBar, MatSnackBarHorizontalPosition, MatSnackBarVerticalPosition} from '@angular/material/snack-bar';
import { Action } from 'rxjs/internal/scheduler/Action';
// import { ImportsModule } from './imports';
// import { ToastModule } from 'primeng/toast';
// import { MessageService } from 'primeng/api';
@Component({
  selector: 'app-capture-photo-dialog-component',
  standalone: true,
  imports: [ MatDialogModule,WebcamModule,NgIf],
  templateUrl: './capture-photo-dialog-component.component.html',
  styleUrl: './capture-photo-dialog-component.component.scss'
})
export class CapturePhotoDialogComponentComponent {
  durationInSeconds = 1;
  public trigger: Subject<void> = new Subject<void>();
  public webcamImage: WebcamImage | null = null;
  horizontalPosition: MatSnackBarHorizontalPosition = 'start';
  verticalPosition: MatSnackBarVerticalPosition = 'bottom';
  
  constructor(private _snackBar: MatSnackBar,public dialogRef: MatDialogRef<CapturePhotoDialogComponentComponent>) {}

  public captureImage(): void {
    this.trigger.next();
  }

  public handleImage(webcamImage: WebcamImage): void {
    const snackbarClass = 'snack-bar-custom';
    const actionClass = 'snack-bar-action';
    this.webcamImage = webcamImage;
    this.adjustDialogHeight();
    this._snackBar.open('Image Taken Successfully', 'Close', {
      duration: this.durationInSeconds * 1000,
      panelClass: [snackbarClass, actionClass]
    });
  }

  public get triggerObservable(): Subject<void> {
    return this.trigger;
  }

  public closeDialog(): void {
    this.dialogRef.close(this.webcamImage);
  }

  private adjustDialogHeight(): void {
    this.dialogRef.updateSize('auto', 'auto');
  }

  openSnackBar() {
    const snackbarClass = 'snack-bar-custom';
    const actionClass = 'snack-bar-action';
    if(this.webcamImage){
      this._snackBar.open('Successfully Uploaded Photo', 'Close', {
        duration: this.durationInSeconds * 1000,
        horizontalPosition: this.horizontalPosition,
        verticalPosition: this.verticalPosition,
        panelClass: [snackbarClass, actionClass]
      });
    }
    else{
      this._snackBar.open('Please upload your photo', 'Close', {
        duration: this.durationInSeconds * 1000,
        panelClass: [snackbarClass, actionClass]
      });
    }
    }
   
}
 

//   show() {
//     this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Message Content' });
// }


