import { ChangeDetectionStrategy,ChangeDetectorRef,Component } from '@angular/core';
import {  AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, FormsModule,isFormControl,ReactiveFormsModule, Validators } from '@angular/forms';
import { AsyncPipe, DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { IConfig, NgxCountriesDropdownModule } from 'ngx-countries-dropdown';
import { Router, RouterLink } from '@angular/router';
import { DataserviceService } from '../../../services/VisitorFormServices/dataservice.service';
import { PurposeResponse } from '../../../Models/IPurposeResponse';
import { DeviceResponse } from '../../../Models/IDeviceResponse';
import { NgxImageCompressService } from 'ngx-image-compress';
import {MatTooltipModule} from '@angular/material/tooltip';
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
import {  map, Observable, of, startWith, Subject } from 'rxjs';
import {MatCheckboxModule} from '@angular/material/checkbox';
import { VisitorConsentModalComponent } from '../../visitor-consent-modal/visitor-consent-modal.component';
import { alphabetValidator, numberValidator } from '../custom-validators';

@Component({
  selector: 'app-form-component',
  standalone: true,
  imports: [RouterLink,NgFor,NgIf,FormsModule,ReactiveFormsModule,NgClass,MatAutocompleteModule,MatTooltipModule,
     MatFormFieldModule,MatIconModule,MatInputModule,AsyncPipe,MatRadioModule,MatCheckboxModule,NgxCountriesDropdownModule,
   WebcamModule,MessagesModule,ToastModule],
  templateUrl: './form-component.component.html',
  styleUrl: './form-component.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})



export class FormComponentComponent {

  messages!:Message[] ;
  addvisitorForm: FormGroup;  
  showItemOtherInput: boolean = false;
  showDeviceOption:boolean= false;
  isOtherPurposeSelected = false;
  isOtherDeviceSelected = false;
  isDeviceCarried = false;
  isPlusClicked: boolean = false;
  myControl = new FormControl('');
  deviceControl= new FormControl('')
  filteredPurposes!: Observable<PurposeResponse[]>;
  filteredDevice!: Observable<DeviceResponse[]>
  contacts: string[] = [];
  filteredContacts: string[] = [];
  selectedContact: string[]  | null = null;
  isInputFilled :boolean= false;
  purposes: PurposeResponse[] = [];
  countryCode:string=''
  selectedPurpose: PurposeResponse | undefined ;

  Devices: DeviceResponse[] = [];
  
  selectedDevice: DeviceResponse | null = null;

  permissionStatus : string="";
  camData:any = null;
  capturedImage : any ='';
  trigger : Subject<void> = new Subject();
  showSerialInput: boolean=false;
 

  constructor(private apiService: DataserviceService,private imageCompress: NgxImageCompressService,
    public dialog: MatDialog,private messageService: MessageService,private datePipe: DatePipe,
    private fb: FormBuilder,private router: Router,private cdr: ChangeDetectorRef) 
  {
    this.addvisitorForm = this.fb.group({
      name: ['', [Validators.required,alphabetValidator()]],
      fullNumber:['', Validators.required],
      countryCode:['', Validators.required],
      phoneNumber: ['', [Validators.required,numberValidator()]],
      personInContact: ['',[ Validators.required,alphabetValidator()]],
      purposeofvisit: ['', Validators.required],
      purposeofvisitId: ['', Validators.required],
      deviceCarried:['',Validators.required],
      otherDevice:['',Validators.required],
      carryDevice: ['',Validators.required],
      otherPurpose: ['',Validators.required],
      items: this.fb.array([this.createItemFormGroup()]), // Initialize with one item
      policy: ['', Validators.required]
    });
  }

  // onInput() {
  //   const value = this.deviceControl.value;
  //   console.log('onInput called:', this.deviceControl.value);
    
  // }
  selectedCountryConfig: IConfig = {
    hideCode: true,
    hideName: true,
    
  };
  countryListConfig: IConfig = {
    hideCode: true,
    
  };


  onCountryChange(country: any) {
    // console.log(country.dialling_code);  
     this.countryCode = country.dialling_code; 
     this.fullPhoneNumber();
    
  }
   fullPhoneNumber() {
    const Number = this.addvisitorForm.get('phoneNumber')?.value;
    const fullNumber =this.countryCode+"-"+Number
    console.log(fullNumber);   
    this.addvisitorForm.patchValue({
      fullNumber:fullNumber
           // Clear other purpose field
    });    
  }

  getDeviceCarriedControl(index: number): FormControl {
    const control = this.items.at(index).get('deviceCarried');
    if (isFormControl(control)) {
      return control;
    } else {
      throw new Error('Control is not an instance of FormControl');
    }
  }
  ngOnInit() {
    this.loadVisitPurpose();
    
    this.filteredPurposes=this.myControl.valueChanges
    .pipe(startWith(''),map(value => this._filterPurpose(value || '')));


    this.loadDevicesCarried();  
    
  }

  onFocus(index:number){
    this.updateFilteredDevice(index);

  }
  updateFilteredDevice(index: number): void {
    const deviceCarriedControl = this.items.at(index)?.get('deviceCarried');
    
    if (deviceCarriedControl) {
      this.filteredDevice = deviceCarriedControl.valueChanges.pipe(
        startWith(''),
        map(value => this._filterDevice(value || ''))
      );
    } else {
      this.filteredDevice = of([]);
    }
  }


openDialog(): void {
  const dialogRef = this.dialog.open(CapturePhotoDialogComponentComponent);

  dialogRef.afterClosed().subscribe((result: WebcamImage | null) => {
    if (result) {
      this.capturedImage = result.imageAsDataUrl;
      // Compress the image
      this.imageCompress.compressFile(this.capturedImage, 0, 50, 50).then(
        (compressedImage) => {
          this.capturedImage = compressedImage;
          console.log("compressed image", this.capturedImage);
          // Store the compressed image
          // this.storeImage(this.capturedImage);
          this.cdr.detectChanges();
        }
      );
    }
  });
  this.capturedImage = this.capturedImage;
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
        console.log(" purpose API Response:", response);
      this.purposes = response;
    });
   }  

   private _filterPurpose(value: string | PurposeResponse): PurposeResponse[] {
    const filterValue = typeof value === 'string' ? value.toLowerCase() : '';
    return this.purposes.filter(option => option.purposeName.toLowerCase().includes(filterValue));
  }   


  onPurposeFocusOut(): void {
    const otherPurpose = this.addvisitorForm.get('otherPurpose')?.value;
    if (this.isOtherPurposeSelected && otherPurpose) {
      this.storeOtherPurpose(otherPurpose);
    }
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


  onInputFocus() {
    // Trigger the filtering logic, or ensure that the options are populated.
    this.myControl.setValue(this.myControl.value || ''); // This will trigger the valueChanges observable and filter the options.
  }
  displayPurpose(purpose?: any): string  {
    return purpose ? purpose.purposeName : undefined;
  }
  onPurposeSelected(selectedOption: any): void {
    console.log('Selected purpose:', selectedOption);
    const value = selectedOption.purposeName;
    if (selectedOption.purposeName === 'Other') {
      this.isOtherPurposeSelected = true;
      this.addvisitorForm.patchValue({
        purposeofvisit: value,
        purposeofvisitId: null, // Clear the purpose ID
        otherPurpose: ''       // Clear other purpose field
      });
    } else {
      this.isOtherPurposeSelected = false;
      const value = selectedOption.purposeName;
      const purposeId = selectedOption.purposeId;
  
      // Update the form with the selected purpose details
      this.addvisitorForm.patchValue({
        purposeofvisit: value, // Ensure this matches your form control name
        purposeofvisitId: purposeId,
        otherPurpose: ''       // Clear other purpose field
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
        DeviceSerialnumber: ['', Validators.required],
        otherDevice: ['',Validators.required],
        otherDeviceCarried:[''],
        isOtherDeviceSelected: [false],
        deviceControl: this.fb.control('')
      });
    }
  
    onCarryDeviceChange(value:number): void {
      if (value === 1) {
        this.showDeviceOption = !this.showDeviceOption;
        // this.addItem(); // Add an initial item if necessary
        if (this.items.length === 0) {
          this.items.push(this.createItemFormGroup());
        }
      } else if(value === 0) {
        this.showDeviceOption = !this.showDeviceOption;
        this.items.clear(); // Clear items if "No"
      }
    }
  
    addItem(index: number): void {
      if (this.isInputFilled) {
        this.isPlusClicked = true;        
        // Create a new item form group with empty initial values
        
        const newItemGroup = this.createItemFormGroup();        
        // Push the newly created group to the form array
        
        this.items.push(newItemGroup);    
        // Clear the value of the new form control (this should be redundant but ensures it's empty)
        newItemGroup.get('deviceCarried')?.reset('');   
        
        const deviceControl = new FormControl('');
        newItemGroup.setControl('deviceControl', deviceControl);
        
      }
    }

    removeItem(index: number) {
      this.items.removeAt(index);
      if (this.items.length === 0) {
        this.isPlusClicked = false; // Reset to false when no items are left
      }
      
    }
    
  
    displayDevice(device?: any): string {
      if (!device) {
        return '';
      }
      
      // If the device is 'Other', display 'Other' regardless of its database status
      if (device.deviceName === 'Other') {
        return 'Other';
      }
      
      // Otherwise, return the actual device name
      return device.deviceName;
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
      this.isInputFilled = true;
      this.showSerialInput = !this.showSerialInput;
      const items = this.addvisitorForm.get('items') as FormArray;
      const item = items.at(index);
    
      console.log('Selected Option:', selectedOption);
      
      if (selectedOption.deviceName === 'Other') {
        item.patchValue({
          isOtherDeviceSelected: true,
           // Clear the field for "Other"
          DeviceSerialnumber: '', // Clear serial number
         
        });
      } else {
        item.patchValue({
          isOtherDeviceSelected: false, // Reset 'Other' flag
          otherDevice: '', // Clear 'Other' device input
          deviceCarried: { deviceId: selectedOption.deviceId, deviceName: selectedOption.deviceName }, // Store as an object
        });
      }
      // this.logFormDataBeforeSubmit();
      this.updateFilteredDevice(index);
    }
    
    onOtherDeviceFocusOut(index: number): void {
      const formGroup = this.items.controls[index] as FormGroup;
      const isOtherDeviceSelected = formGroup.get('isOtherDeviceSelected')?.value;
      const otherDeviceValue = formGroup.get('otherDevice')?.value;
    console.log("other device",otherDeviceValue);
    
      if (isOtherDeviceSelected && otherDeviceValue) {
        this.storeOtherDevice(otherDeviceValue, index);
      }
    }
    
    storeOtherDevice(value: string, index: number): void {
      this.apiService.addDevice(value).subscribe(
        (response: any) => {
          console.log('Other device added successfully:', response);
          const formGroup = this.items.at(index) as FormGroup;
          formGroup.patchValue({
            otherDeviceCarried: { deviceId: response.id, deviceName: value },
          });
          // this.logFormDataBeforeSubmit();
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

openPrivacyPolicyDialog(): void {
  this.dialog.open(VisitorConsentModalComponent);
}
isFormValid(): boolean {
  const formData = this.addvisitorForm.value;
  return this.addvisitorForm.valid && formData.policy && this.capturedImage && localStorage.getItem('officeLocationId');
}
transformDate(): string {
  // Use DatePipe to format the date
  const date = new Date()
  date.setHours(0, 0, 0, 0);
  return this.datePipe.transform(date, 'yyyy-MM-ddTHH:mm:ss') ?? '';
}
onSubmit(): void {
  const formData = this.addvisitorForm.value;
  const imageData = this.capturedImage;
  const policy = formData.policy;
  const formSubmissionMode = "Kiosk";
  const officeLocationId = localStorage.getItem('officeLocationId');
  console.log('Purpose ID:', formData.purposeofvisitId);
  console.log('Form Data:', formData);
   // This is a Date object

  // Transform the date to the desired format
  const formattedDate = this.transformDate();
  console.log("formattedDate ", formattedDate);
  
  if(!this.countryCode)
  {
    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Please fill the country code!' });
    return;
  }
  if (!formData.name || !formData.phoneNumber || !formData.personInContact || !formData.purposeofvisitId || !policy || !imageData) {
    console.error('One or more required fields are missing.');
    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Please fill all the details!' });
    return;
  }

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

  
  if (!officeLocationId) {
    console.error('Office location ID not found in local storage.');
    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Office location ID is required.' });
    return;
  }
  // Check if any of the required fields are missing
 
  console.log("formdata items",formData.items);
  
  let selectedDevice = formData.items.map((item: any) => {
    let deviceId = null;
    let serialNumber = item.DeviceSerialnumber || null;
  
    if (item.deviceCarried && item.deviceCarried.deviceId) {
      deviceId = item.deviceCarried.deviceId;
    }
  
    if (item.otherDeviceCarried && item.otherDeviceCarried.deviceId) {
      deviceId = item.otherDeviceCarried.deviceId;
    }
  
    console.log("Constructed deviceId:", deviceId);
  
    return {
      deviceId,
      serialNumber,
    };
  });
  
  console.log("Final selectedDevice array:", selectedDevice);
  
  




  // Log the selected devices
  const visitorPayload = {
    name: formData.name,
    phoneNumber: formData.fullNumber,
    personInContact: formData.personInContact,
    purposeOfVisitId: formData.purposeofvisitId,
    officeLocationId: Number(officeLocationId),
    selectedDevice: selectedDevice,
    formSubmissionMode:formSubmissionMode,
    visitDate:formattedDate,
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
// Filter out any items that didn't have a valid deviceId or serialNumber
  // selectedDevice = selectedDevice.filter((item: any) => item.deviceId || item.serialNumber);
  
  // console.log("selectedDevice2", selectedDevice);
  
  // this.filteredDevice = this.items.at(0)?.get('deviceCarried')?.valueChanges.pipe(
    //   startWith(''),
    //   map(value => this._filterDevice(value || ''))
    // ) ?? of([]);

    // Subscribe to changes in the 'otherPurpose' field to handle 'Other' purpose
    // this.addvisitorForm.get('otherPurpose')?.valueChanges.pipe(debounceTime(1000)).subscribe(value => {
    //   if (this.isOtherPurposeSelected && value) {
    //     this.storeOtherPurpose(value);
    //   }
    // });
  
    // Subscribe to changes in each item's 'otherDevice' field
    // this.items.controls.forEach((control: AbstractControl, index: number) => {
    //   const formGroup = control as FormGroup;
    //   formGroup.addControl('isOtherDeviceSelected', new FormControl(false));
    //   formGroup.get('otherDevice')?.valueChanges.pipe(debounceTime(1000)).subscribe(value => {
    //     if (formGroup.get('isOtherDeviceSelected')?.value && value) {
    //       this.storeOtherDevice(value, index);
    //     }
    //   });
    // });
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
 
