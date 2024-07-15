import { ChangeDetectionStrategy,Component } from '@angular/core';
import { FloatLabelModule } from 'primeng/floatlabel';

import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AutoCompleteCompleteEvent, AutoCompleteModule } from 'primeng/autocomplete';
import { NgFor, NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { DataserviceService } from '../../../services/dataservice.service';
import { IPurposeList } from '../../../Models/IPurposeList';
import { IItemList } from '../../../Models/IItemList';



@Component({
  selector: 'app-form-component',
  standalone: true,
  imports: [RouterLink,NgFor,NgIf,FormsModule,ReactiveFormsModule, AutoCompleteModule,FloatLabelModule],
  templateUrl: './form-component.component.html',
  styleUrl: './form-component.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormComponentComponent {

 
  addvisitorForm: FormGroup;
  
  

  // items = [{ selectedItem: '' }];
  showItemOtherInput: boolean = false;
  contacts: string[] = [];
  filteredContacts: string[] = [];
  selectedContact: string[]  | null = null;

  purposes: IPurposeList[] = [];
  filteredPurposes: IPurposeList[] = [];
  selectedPurpose: IPurposeList | null = null;

  itemsCarried: IItemList[] = [];
  filteredItem: IItemList[] = [];
  selectedItem: IItemList | null = null;

  // items: { selectedItem: string, showItemOtherInput: boolean }[] = [];
 

  constructor(private apiService: DataserviceService,private fb: FormBuilder,private router: Router) {

    this.addvisitorForm = this.fb.group({
      name: new FormControl('', Validators.required),
      phoneNumber: new FormControl('', Validators.required),
      personInContact: new FormControl('', Validators.required),
      purposeofvisit: new FormControl('', Validators.required),
      items: this.fb.array([this.createItemFormGroup()]), // Initialize with one item
      policy: new FormControl('', Validators.required)
    });
  }

  ngOnInit() {
   
   this.loadContactPerson();
   this.loadVisitPurpose();
   this.loadItemsCarried();
  //  this.items.push({ selectedItem: '', showItemOtherInput: false });
  }


 loadContactPerson(){
  this.apiService.getContactPerson()
      .subscribe((response :any[]) => {
        console.log("API Response:", response);
      this.contacts = response;
    });
  
 }  
  filterContact(event: AutoCompleteCompleteEvent) {
    let query = event.query.toLowerCase();
    this.filteredContacts = this.contacts.filter(contact => contact.toLowerCase().startsWith(query));
    console.log(this.filteredContacts);
    
  }

  loadVisitPurpose(){
    this.apiService.getVisitPurpose()
      .subscribe((response :IPurposeList[]) => {
        console.log("API Response:", response);
      this.purposes = response;
    });
   }  
    filterPurpose(event: AutoCompleteCompleteEvent) {
      let query = event.query.toLowerCase();
      this.filteredPurposes = this.purposes.filter(purpose => purpose.name.toLowerCase().includes(query));
       console.log(this.filteredPurposes);
       
    }
    
    loadItemsCarried(){
      this.apiService.getItemsCarried()
      .subscribe((response: IItemList[]) => {
        console.log("API Response:", response);
      this.itemsCarried = response;
    });
     }  
      filterItem(event: AutoCompleteCompleteEvent) {
        let query = event.query.toLowerCase();
        this.filteredItem = this.itemsCarried.filter(itemCarried => itemCarried.itemName.toLowerCase().startsWith(query));
         console.log(this.filteredItem);
         
      }

      get items(): FormArray {
        return this.addvisitorForm.get('items') as FormArray;
      }
    
      createItemFormGroup(): FormGroup {
        return this.fb.group({
          itemscarried: new FormControl('', Validators.required),
          itemSerialnumber: new FormControl(''),
          selectedItem:'',
          selectedItemId: '', // Store the item ID
          showItemOtherInput: false
        });
      }
    
      onItemChange(event: any, index: number): void {
        console.log('onSelect event:', event);
        const value = event.value;
        this.items.at(index).patchValue({
          selectedItem:value,
          selectedItemId: value.id, // Store the item ID
          showItemOtherInput: !!value
        });
        console.log(this.items.at(index).value.selectedItemId);
        console.log(this.items.at(index).value.showItemOtherInput);
      }
    
      addItem(): void {
        this.items.push(this.createItemFormGroup());
      }

    onPurposeChange(event: any): void {
    console.log('onPurposeSelect event:', event);
    // Store the selected purpose object for display
    const value = event.value;
    this.addvisitorForm.patchValue({
      selectedPurpose :value,
      purposeofvisit: value.id // Store the purpose ID in the form control
    });
    console.log(this.addvisitorForm.value.purposeofvisit);
  }

      
  onSubmit() {
    console.log(this.addvisitorForm.value);
    if (this.addvisitorForm.valid) {
        const formData = this.addvisitorForm.value;

        const visitorPayload = {
            name: formData.name,
            phoneNumber: formData.phoneNumber,
            purposeOfVisitId: formData.purposeofvisit,
            personInContact: formData.personInContact,
            policy: formData.policy,
            selectedItems: formData.items.map((item: any) => ({
                itemId: item.selectedItem.id, // Make sure this maps to the correct item ID
                serialNumber: item.itemSerialnumber
            }))
        };
         
        console.log(visitorPayload);
        
        this.apiService.createVisitorAndAddItem(visitorPayload).subscribe(
            (response) => {
              console.log(response);
                alert("Added Successfully");
                console.log('Visitor and item added successfully:', response);
                this.router.navigate(['/thankyou'])
                // Optionally, redirect to a different page or refresh data
            },
            (error) => {
                console.error('Error adding visitor and item:', error);
                // Handle error as needed
            }
        );
    } else {
        console.error('Form is invalid.');
        // Optionally, display error messages to the user
    }
}


  }
  
 

 
