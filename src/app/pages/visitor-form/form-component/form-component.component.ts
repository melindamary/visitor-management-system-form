import { ChangeDetectionStrategy,ChangeDetectorRef,Component } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, FormsModule,ReactiveFormsModule, Validators } from '@angular/forms';
import { AsyncPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { DataserviceService } from '../../../services/VisitorFormServices/dataservice.service';
import { PurposeResponse } from '../../../Models/IPurposeResponse';
import { DeviceResponse } from '../../../Models/IDeviceResponse';
import {CustomKeyboardEvent} from '../../../Models/ICustomKeyboardEvent'
import { DeviceChangeEvent } from '../../../Models/IDeviceChangeEvent';
import {MatRadioModule} from '@angular/material/radio';
import { WebcamImage, WebcamModule } from 'ngx-webcam';
import { MatDialog } from '@angular/material/dialog';
import { Message, MessageService } from 'primeng/api';
import { MessagesModule } from 'primeng/messages';
import { CapturePhotoDialogComponentComponent } from '../capture-photo-dialog-component/capture-photo-dialog-component.component';
import { ToastModule } from 'primeng/toast';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import { debounceTime, map, Observable, startWith, Subject } from 'rxjs';
import {MatCheckboxModule} from '@angular/material/checkbox';

@Component({
  selector: 'app-form-component',
  standalone: true,
  imports: [RouterLink,NgFor,NgIf,FormsModule,ReactiveFormsModule,NgClass,MatAutocompleteModule,
     MatFormFieldModule,MatIconModule,MatInputModule,AsyncPipe,MatRadioModule,MatCheckboxModule,
   WebcamModule,MessagesModule,ToastModule],
  templateUrl: './form-component.component.html',
  styleUrl: './form-component.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormComponentComponent {
  messages!:Message[] ;
  addvisitorForm: FormGroup;  
  showItemOtherInput: boolean = false;

  isOtherPurposeSelected = false;
  isOtherDeviceSelected = false;
  isDeviceCarried = false;

  myControl = new FormControl('');
  deviceControl= new FormControl('')
  filteredPurposes!: Observable<PurposeResponse[]>;
  filteredDevice!: Observable<DeviceResponse[]>
  contacts: string[] = [];
  filteredContacts: string[] = [];
  selectedContact: string[]  | null = null;

  purposes: PurposeResponse[] = [];
  // filteredPurposes: PurposeResponse[] = [];
  selectedPurpose: PurposeResponse | undefined ;

  Devices: DeviceResponse[] = [];
  // filteredDevice: DeviceResponse[] = [];
  selectedDevice: DeviceResponse | null = null;

  permissionStatus : string="";
  camData:any = null;
  capturedImage : any ='';
  trigger : Subject<void> = new Subject();
 

  constructor(private apiService: DataserviceService,public dialog: MatDialog,private messageService: MessageService,
    private fb: FormBuilder,private router: Router,private cdr: ChangeDetectorRef) 
  {
    this.addvisitorForm = this.fb.group({
      name: ['', Validators.required],
      phoneNumber: ['', Validators.required],
      personInContact: ['', Validators.required],
      purposeofvisit: ['', Validators.required],
      purposeofvisitId: ['', Validators.required],
      carryDevice: [false],
      otherPurpose: [''],
      items: this.fb.array([this.createItemFormGroup()]), // Initialize with one item
      policy: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.loadVisitPurpose();
    this.loadDevicesCarried();

    this.filteredPurposes=this.myControl.valueChanges
    .pipe(startWith(''),map(value => this._filterPurpose(value || '')));
  
    this.filteredDevice = this.deviceControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterDevice(value || ''))
    );
  
    // Subscribe to changes in the 'otherPurpose' field to handle 'Other' purpose
    this.addvisitorForm.get('otherPurpose')?.valueChanges.pipe(debounceTime(1000)).subscribe(value => {
      if (this.isOtherPurposeSelected && value) {
        this.storeOtherPurpose(value);
      }
    });
  
    // Subscribe to changes in each item's 'otherDevice' field
    this.items.controls.forEach((control: AbstractControl, index: number) => {
      const formGroup = control as FormGroup;
      formGroup.addControl('isOtherDeviceSelected', new FormControl(false));
      formGroup.get('otherDevice')?.valueChanges.pipe(debounceTime(1000)).subscribe(value => {
        if (formGroup.get('isOtherDeviceSelected')?.value && value) {
          this.storeOtherDevice(value, index);
        }
      });
    });
  }

openDialog(): void {
  const dialogRef = this.dialog.open(CapturePhotoDialogComponentComponent);

  dialogRef.afterClosed().subscribe((result: WebcamImage | null) => {
    if (result) {
      this.capturedImage = result.imageAsDataUrl;
      console.log("captured event", this.capturedImage);
    }
  });
}
 loadContactPerson(){
  this.apiService.getContactPerson()
      .subscribe((response :string[]) => {
        console.log("Contact Person Response:", response);
      this.contacts = response;
    });  
 } 

  loadVisitPurpose(){
    this.apiService.getVisitPurpose()
      .subscribe((response :PurposeResponse[]) => {
        console.log("API Response:", response);
      this.purposes = response;
    });
   }  

   private _filterPurpose(value: string | PurposeResponse): PurposeResponse[] {
    const filterValue = typeof value === 'string' ? value.toLowerCase() : '';
    return this.purposes.filter(option => option.purposeName.toLowerCase().includes(filterValue));
  }   
    
  storeOtherPurpose(value: string): void {
    this.apiService.addPurpose(value).subscribe(
      (response: any) => {
        console.log("Other purpose added successfully:", response);
        this.addvisitorForm.patchValue({
          purposeofvisitId: response.id,
          selectedPurpose: value
        });
        // console.log("other pid ",this.purposeofvisitId);
        
      },
      (error) => {
        console.error('Error adding other purpose:', error);
      }
    );
  }


    
  displayPurpose(purpose?: any): string  {
    return purpose ? purpose.purposeName : undefined;
  }
  onPurposeSelected(selectedOption: any): void {
    console.log('Selected purpose:', selectedOption);
  
    if (selectedOption.purposeName === 'Other') {
      this.isOtherPurposeSelected = true;
      this.addvisitorForm.patchValue({
        selectedPurpose: '',
        purposeofvisitId: null,
        otherPurpose: ''
      });
    } else {
      this.isOtherPurposeSelected = false;
      const value = selectedOption.purposeName;
      const purposeId = selectedOption.purposeId;
  
      // Update the form with the selected purpose details
      this.addvisitorForm.patchValue({
        selectedPurpose: value,
        purposeofvisitId: purposeId,
        otherPurpose: ''
      });
  
      console.log('Purpose entered:', value);
      console.log('Purpose ID:', purposeId);
    }
  }
  
  
  loadDevicesCarried(){
    this.apiService.getDevice()
    .subscribe((response: DeviceResponse[]) => {
      console.log("API Response:", response);
    this.Devices = response;
  });
   }  

  
    private _filterDevice(value: string| DeviceResponse): DeviceResponse []{
      const filterValue = typeof value === 'string' ? value.toLowerCase() : '';
      return this.Devices.filter(device => device.deviceName.toLowerCase().includes(filterValue));
    }

    get items(): FormArray {
      return this.addvisitorForm.get('items') as FormArray;
    }
  
    createItemFormGroup(): FormGroup {
      return this.fb.group({
        deviceCarried: ['', Validators.required],
        DeviceSerialnumber: [''],
        otherDevice: [''],
        isOtherDeviceSelected: [false]
      });
    }
  
    onCarryDeviceChange(value: boolean): void {
      if (value) {
        console.log('Carrying device:', value);
        // this.addItem(); // Add an initial item if necessary
      } else {
        this.items.clear(); // Clear items if "No"
      }
    }
  
    addItem(): void {
      const newItemGroup = this.createItemFormGroup();
      this.items.push(newItemGroup);
    
      newItemGroup.get('otherDevice')?.valueChanges.pipe(debounceTime(1000)).subscribe(value => {
        if (newItemGroup.get('isOtherDeviceSelected')?.value && value) {
          this.storeOtherDevice(value, this.items.length - 1);
        }
      });
    }
    
  
    displayDevice(device?: any): string  {
      return device ? device.deviceName : undefined;
    }
  

    subscribeToSerialNumberChanges(group: FormGroup, index: number): void {
      group.get('DeviceSerialnumber')?.valueChanges.subscribe(serialNumber => {
        if (serialNumber) {
          const deviceCarried = group.get('deviceCarried')?.value;
          console.log(`Device Index: ${index}, Name: ${deviceCarried}, Serial Number: ${serialNumber}`);
        }
      });
    }
   
    onDeviceSelected(selectedOption: any, index: number): void {
      const items = this.addvisitorForm.get('items') as FormArray;
      const item = items.at(index);
    
      console.log('Selected Option:', selectedOption);
      
      if (selectedOption.deviceName === 'Other') {
        item.patchValue({
          isOtherDeviceSelected: true,
          otherDevice: '', // Clear the field for "Other"
          DeviceSerialnumber: '', // Clear serial number
          deviceCarried: { deviceId: null, deviceName: 'Other' }, // Store as an object
        });
      } else {
        item.patchValue({
          isOtherDeviceSelected: false, // Reset 'Other' flag
          otherDevice: '', // Clear 'Other' device input
          deviceCarried: { deviceId: selectedOption.deviceId, deviceName: selectedOption.deviceName }, // Store as an object
        });
      }
      this.logFormDataBeforeSubmit();
    }
    
    
    storeOtherDevice(value: string, index: number): void {
      this.apiService.addDevice(value).subscribe(
        (response: any) => {
          console.log('Other device added successfully:', response);
          const formGroup = this.items.at(index) as FormGroup;
          formGroup.patchValue({
            deviceCarried: { deviceId: response.id, deviceName: value },
          });
          this.logFormDataBeforeSubmit();
        },
        (error) => {
          console.error('Error adding other device:', error);
        }
      );
    }


// Method to log relevant data before submission
logFormDataBeforeSubmit(): void {
  const formData = this.addvisitorForm.value;
  const imageData = this.capturedImage;
  const policy = formData.policy;
  
  console.log("Logging form data before submission:");
  console.log("Form Data:", formData); // Log the entire form data
  console.log("Captured Image:", imageData); // Log the captured image
  console.log("Policy:", policy); // Log the policy confirmation

  const selectedDevice = formData.items
    .filter((item: any) => item.deviceCarried && item.DeviceSerialnumber)
    .map((item: any) => ({
      deviceId: item.deviceCarried.deviceId,
      serialNumber: item.DeviceSerialnumber
    }));

  console.log("Selected Devices:", selectedDevice); // Log the selected devices
}


onSubmit(): void {
  const formData = this.addvisitorForm.value;
  const imageData = this.capturedImage;
  const policy = formData.policy;
  
  console.log('Purpose ID:', formData.purposeofvisitId);
  console.log('Form Data:', formData);

  if (!policy) {
    console.error('Policy not marked is empty.');
    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Please indicate your confirmation..' });
    return;
  }

  if (!imageData) {
    console.error('Image data is empty.');
    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Image data is required.' });
    return;
  }

  const officeLocationId = localStorage.getItem('officeLocationId');
  if (!officeLocationId) {
    console.error('Office location ID not found in local storage.');
    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Office location ID is required.' });
    return;
  }

  const selectedDevice = formData.items
    .filter((item: any) => item.deviceCarried && item.DeviceSerialnumber)
    .map((item: any) => ({
      deviceId: item.deviceCarried.deviceId, // Access deviceId
      serialNumber: item.DeviceSerialnumber
    }));

  console.log('Selected Devices:', selectedDevice); // Log the selected devices
  const visitorPayload = {
    name: formData.name,
    phoneNumber: formData.phoneNumber,
    personInContact: formData.personInContact,
    purposeOfVisitId: formData.purposeofvisitId,
    officeLocationId: Number(officeLocationId),
    selectedDevice: selectedDevice,
    imageData: imageData
  };

  console.log('Visitor Payload:', visitorPayload);

  this.apiService.createVisitorAndAddItem(visitorPayload).subscribe(
    (response) => {
      console.log('Visitor and item added successfully:', response);
      this.router.navigate(['/thankyou']);
    },
    (error) => {
      this.messages = [{ severity: 'error', detail: 'Please fill all the details!' }];
      console.error('Error adding visitor and item:', error);
    }
  );
}
   

    


  }
    //   onDeviceSelected(selectedOption: any, index: number): void {
  //     const formGroup = this.items.at(index) as FormGroup;
  
  //     if (selectedOption.deviceName === 'Other') {
  //      this.isOtherDeviceSelected=true
  //         formGroup.patchValue({
  //             deviceCarried: { deviceName: 'Other', deviceId: null },
  //             DeviceSerialnumber: '',
  //             otherDevice: ''  // Ensure this is cleared
  //         });
  //         formGroup.get('otherDevice')?.updateValueAndValidity();
  //         this.storeOtherDevice(formGroup.get('otherDevice')?.value, index);
  //     } else {
  //         formGroup.patchValue({
  //             deviceCarried: { deviceName: selectedOption.deviceName, deviceId: selectedOption.deviceId },
  //             DeviceSerialnumber: '',
  //             otherDevice: ''  // Clear the `otherDevice` field if not "Other"
  //         });
  //     }
  
  //     const deviceCarried = formGroup.get('deviceCarried')?.value;
  //     const deviceSerialnumber = formGroup.get('DeviceSerialnumber')?.value;
  //     const deviceId = selectedOption.deviceId;
  //     console.log(`Device ID: ${deviceId}, Name: ${deviceCarried.deviceName}, Serial Number: ${deviceSerialnumber}`);
  // }
  
 // onDeviceSelected(selectedOption: any, index: number): void {
    //   const formGroup = this.items.at(index) as FormGroup;
    
    //   if (selectedOption.deviceName === 'Other') {
    //     formGroup.patchValue({
    //       deviceCarried: { deviceName: 'Other', deviceId: null },
    //       DeviceSerialnumber: '',
    //       otherDevice: ''  // Ensure this is cleared
    //     });
    //     formGroup.get('isOtherDeviceSelected')?.setValue(true);
    //     formGroup.get('otherDevice')?.updateValueAndValidity();
    //   } else {
    //     formGroup.patchValue({
    //       deviceCarried: { deviceName: selectedOption.deviceName, deviceId: selectedOption.deviceId },
    //       DeviceSerialnumber: '',
    //       otherDevice: ''  // Clear the `otherDevice` field if not "Other"
    //     });
    //     formGroup.get('isOtherDeviceSelected')?.setValue(false);
    //   }
    
    //   const deviceCarried = formGroup.get('deviceCarried')?.value;
    //   const deviceSerialnumber = formGroup.get('DeviceSerialnumber')?.value;
    //   const deviceId = selectedOption.deviceId;
    
    //   console.log(`Device ID: ${deviceId}, Name: ${deviceCarried.deviceName}, Serial Number: ${deviceSerialnumber}`);
    // }
    // onDeviceSelected(selectedOption: any, index: number): void {
    //   const formGroup = this.items.at(index) as FormGroup;
  
    //   if (selectedOption.deviceName === 'Other') {
    //     formGroup.patchValue({
    //       deviceCarried: { deviceName: 'Other', deviceId: null },
    //       DeviceSerialnumber: '',
    //       otherDevice: ''
    //     });
    //     formGroup.get('otherDevice')?.updateValueAndValidity();
    //   } else {
    //     formGroup.patchValue({
    //       deviceCarried: { deviceName: selectedOption.deviceName, deviceId: selectedOption.deviceId },
    //       DeviceSerialnumber: '',
    //       otherDevice: ''
    //     });
    //   }
  
    //   const deviceCarried = formGroup.get('deviceCarried')?.value;
    //   const deviceSerialnumber = formGroup.get('DeviceSerialnumber')?.value;
    //   const deviceId = selectedOption.deviceId;
    //   console.log(`Device ID: ${deviceId}, Name: ${deviceCarried.deviceName}, Serial Number: ${deviceSerialnumber}`);
    // }
  
    // onDeviceInput(value: string, index: number): void {
    //   const formGroup = this.items.at(index) as FormGroup;
    //   if (value !== 'Other') {
    //     formGroup.patchValue({
    //       deviceCarried: { deviceName: value, deviceId: null },
    //       DeviceSerialnumber: '',
    //       otherDevice: ''
    //     });
    //   }
    // }
  
    // storeOtherDevice(value: string, index: number): void {
    //   this.apiService.addDevice(value).subscribe(
    //     (response: any) => {
    //       const formGroup = this.items.at(index) as FormGroup;
    //       formGroup.patchValue({
    //         deviceCarried: { deviceName: value, deviceId: response.id },
    //         otherDevice: '',
    //         DeviceSerialnumber: ''
    //       });
    //     },
    //     (error) => {
    //       console.error('Error adding other device:', error);
    //     }
    //   );
    // }
   //   onItemChange(event: DeviceChangeEvent, index: number): void {
    //     console.log('onSelect event:', event);
    //     const value = event.value;
    
    //     // Check if the selected device is "none"
    //     const isNone = value.deviceName.toLowerCase() === 'none' || value.deviceId === null; // Adjust the condition as necessary
    
    //     // Get the form group for the current item
    //     const currentItem = this.items.at(index) as FormGroup;
    
    //     // Update the form group values
    //     currentItem.patchValue({
    //       selectedDevice: value.deviceName,
    //       selectedDeviceId: value.deviceId, // Store the item ID
    //       showItemOtherInput: !isNone && !!value // Set to false if "none" is selected, otherwise true
    //     });
    
    //     // Set or clear the required validator for the DeviceSerialnumber control
    //     const serialNumberControl = currentItem.get('DeviceSerialnumber');
    //     if (serialNumberControl) { // Check if serialNumberControl is not null
    //       if (value.deviceName === 'Laptop') {
    //         serialNumberControl.setValidators([Validators.required]);
    //       } else {
    //         serialNumberControl.clearValidators();
    //       }
    //       serialNumberControl.updateValueAndValidity();
    //     }
    //     console.log(currentItem.value.selectedDeviceId);
    //     console.log(currentItem.value.showItemOtherInput);
    //   }
      
    //   onKeyUpHandlerDevice(event: KeyboardEvent, i: number) {
    //     if (event.key === 'Enter') {
    //       const customEvent: CustomKeyboardEvent = {
    //         key: event.key,
    //         target: {
    //             value: (event.target as HTMLInputElement).value.trim()
    //         }
    //     };
    //     this.onItemBlur(customEvent, i);
    //     }
    //   }
    
    //   onItemBlur(event:CustomKeyboardEvent, index: number): void {
    //     console.log('onBlur event:', event);
    //     const value = (event.target as HTMLInputElement).value.trim();
    
    //     // Check if the device name is empty or not provided
    //     if (!value) {
    //         return;
    //     }
    
    //     // Check if the entered device exists in the list
    //     const existingDevice = this.Devices.find(device => device.deviceName.toLowerCase() === value.toLowerCase());
    //     console.log("existing device on blur", existingDevice);
    
    //     // Get the form group for the current item
    //     const currentItem = this.items.at(index) as FormGroup;
    
    //     if (!existingDevice) {
    //         // Device does not exist in the list, add it via API
    //         this.apiService.addDevice({ deviceName: value }).subscribe(
    //             (response: DeviceResponse) => {
    //                 console.log("Device added successfully:", response);
    
    //                 // Update local devices list and form values
    //                 this.Devices.push({ deviceId: response.deviceId, deviceName: value });
    //                 currentItem.patchValue({
    //                     selectedDevice: value,
    //                     selectedDeviceId: response.deviceId, // Update form with the new device ID
    //                     showItemOtherInput: true // Set to true to show the serial number input
    //                 });
    
    //                 // Trigger change detection
    //                 this.cdr.detectChanges();
    
    //                 console.log("new device", currentItem.value.selectedDeviceId);
    //             },
    //             (error) => {
    //                 console.error('Error adding device:', error);
    //                 // Handle error as needed
    //             }
    //         );
    //     }
    // }
     
    // filterItem(event: AutoCompleteCompleteEvent) {
      //   let query = event.query.toLowerCase();
      //   this.filteredDevice = this.Devices
      //   .filter(Device => Device.deviceName.toLowerCase().includes(query))
      //   .sort((a, b) => {
      //       if (a.deviceName.toLowerCase() === 'none') return 1;
      //       if (b.deviceName.toLowerCase() === 'none') return -1;
      //       return a.deviceName.localeCompare(b.deviceName);
      //   });
      //    console.log(this.filteredDevice);
         
      // }
       // filterPurpose(event: AutoCompleteCompleteEvent) {
    //   let query = event.query.toLowerCase();
    //   this.filteredPurposes = this.purposes
    //   .filter(purpose => purpose.purposeName.toLowerCase().includes(query.toLowerCase()))
    //   .sort((a, b) => a.purposeName.localeCompare(b.purposeName));
    //    console.log(this.filteredPurposes);
       // get $trigger():Observable<void>{
//   return this.trigger.asObservable();
// }

// checkPermission(){
//   navigator.mediaDevices.getUserMedia({video:{width:500,height:500}}).then((response)=>
//   {
//     this.permissionStatus ='Allowed';
//     this.camData = response;
//     console.log(this.camData);
//   }).catch(err=>{
//     this.permissionStatus = 'Not Allowed';
//     console.log(this.permissionStatus);
    
//   })
// }

// capture(event:WebcamImage){
//   console.log("captured event",event);
//   this.capturedImage = event.imageAsDataUrl;
    
// }

// captureImage(){
//   this.trigger.next();
// }
// import { FloatLabelModule } from 'primeng/floatlabel';
// import { InputTextModule } from 'primeng/inputtext';// import { AutoCompleteCompleteEvent, AutoCompleteModule, AutoCompleteSelectEvent } from 'primeng/autocomplete';

// import { PurposeChangeEvent } from '../../../Models/IPurposeChangeEvent';NgModelGroup,, MatAutocompleteSelectedEvent


  // filterContact(event: AutoCompleteCompleteEvent) {
  //   let query = event.query.toLowerCase();
  //   this.filteredContacts = this.contacts
  //   .filter(contact => contact.toLowerCase().includes(query))
  //   .sort((a, b) => a.localeCompare(b));
  //   console.log(this.filteredContacts);
    
  // }

    // }

      // onPurposeChange(event: any): void {
  //   const selectedOption = event.option.value;
  //   console.log("function claaed",selectedOption);
  // //   let value: string;
  // //   let purposeId: number | null = null;
  // // console.log(selectedOption);
  
  // //   if (selectedOption && selectedOption.purposeName) {
  // //     value = selectedOption.purposeName;
  // //     purposeId = selectedOption.purposeId;
  // //   } else if (typeof event === 'string') {
  // //     value = event;
  // //   } else {
  // //     value = event?.option.value.purposeName || '';
  // //   }
  
  // //   console.log('Purpose entered:', value);
  
  // //   const trimmedValue = value.trim();
  // //   if (trimmedValue === '') {
  // //     return; // Handle empty value case
  // //   }
  
  // //   // Check if the entered purpose exists in the list
  // //   const existingPurpose = this.purposes.
  // //   find(purpose => purpose.purposeName.toLowerCase() === trimmedValue.toLowerCase());
  // //   console.log("existing purpose", existingPurpose);
  
  // //   if (existingPurpose) {
  // //     // Purpose exists in the list, update form values
  // //     this.addvisitorForm.patchValue({
  // //       selectedPurpose: existingPurpose.purposeName,
  // //       purposeofvisitId: existingPurpose.purposeId // Store the purpose ID in the form control
  // //     });
  // //     console.log(this.addvisitorForm.value.purposeofvisitId);
  // //   } else {
  // //     // Purpose does not exist in the list, add it via API
  // //     this.apiService.addPurpose(value).subscribe(
  // //       (response: PurposeResponse) => {
  // //         console.log("Purpose added successfully:", response);
  
  // //         // Update local purposes list and form values
  // //         this.purposes.push({ purposeId: response.purposeId, purposeName: trimmedValue });
  // //         this.addvisitorForm.patchValue({
  // //           selectedPurpose: trimmedValue,
  // //           purposeofvisitId: response.purposeId // Update form with the new purpose ID
  // //         });
  
  // //         console.log("new purpose", this.addvisitorForm.value.purposeofvisitId);
  // //       },
  // //       (error) => {
  // //         console.error('Error adding purpose:', error);
  // //         // Handle error as needed
  // //       }
  // //     );
  // //   }
  // }
  
   //   onKeyUpHandlerPurpose(event: KeyboardEvent): void {
    //     if (event.key === 'Enter') {
    //         const inputElement = event.target as HTMLInputElement;
    //         const value = inputElement.value;
    //       //   const autoCompleteEvent: PurposeChangeEvent = {
    //       //      // Assuming event is the original event you want to pass
    //       //    purposeName: value 
    //       // };
    //       // this.onPurposeChange(value);
    //     }
    // }

    // isItemEntered(index: number): boolean {
    //   return this.items?.at(index)?.get('Device')?.value?.trim() !== '';
    // }
  //   onPurposeChange(event: any): void {
  //     let value: string;
    
  //     // Check if the event is an AutoCompleteSelectEvent
  //     if (event && event.originalEvent && event.originalEvent instanceof Event && event.item && event.item.purposeName) {
  //       value = event.item.purposeName;
  //     } else if (event && typeof event === 'string') {
  //       value = event;
  //     } else {
  //       value = event?.purposeName || '';
  //     }
  //     console.log('Purpose entered:', value);

  // const trimmedValue = value.trim();
  // if (trimmedValue === '') {
  //   return; // Handle empty value case
  // }
  
  //     // Check if the entered purpose exists in the list
  //     const existingPurpose = this.purposes.find(purpose => purpose.purposeName.toLowerCase() === trimmedValue.toLowerCase());
  //     console.log("existing purpose", existingPurpose);
  
  //     if (existingPurpose) {
  //         // Purpose exists in the list, update form values
  //         this.addvisitorForm.patchValue({
  //             selectedPurpose: existingPurpose.purposeName,
  //             purposeofvisitId: existingPurpose.purposeId // Store the purpose ID in the form control
  //         });
  //         console.log(this.addvisitorForm.value.purposeofvisitId);
  //     } else {
  //         // Purpose does not exist in the list, add it via API
  //         this.apiService.addPurpose(value).subscribe(
  //             (response: PurposeResponse) => {
  //                 console.log("Purpose added successfully:", response);
  
  //                 // Update local purposes list and form values
  //                 this.purposes.push({ purposeId: response.purposeId, purposeName: trimmedValue });
  //                 this.addvisitorForm.patchValue({
  //                     selectedPurpose: trimmedValue,
  //                     purposeofvisitId: response.purposeId // Update form with the new purpose ID
  //                 });
  
  //                 console.log("new purpose", this.addvisitorForm.value.purposeofvisitId);
  //             },
  //             (error) => {
  //                 console.error('Error adding purpose:', error);
  //                 // Handle error as needed
  //             }
  //         );
  //     }
  // }
 
