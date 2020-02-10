import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators, AbstractControl, ValidatorFn, FormArray } from '@angular/forms';

import { debounceTime } from "rxjs/operators";

import { Customer } from './customer';

function ratingRange(min: number, max: number): ValidatorFn {
  return (control: AbstractControl):  { [key: string]: boolean } | null => {
    if (control.value !== null && (isNaN(control.value) || control.value < min || control.value > max)) {
      return {'range': true}
    }
    
    return null;
  }
}

function emailMatcher(control: AbstractControl):  { [key: string]: boolean } | null {
  let emailControl = control.get('email');
  let confirmEmail = control.get('confirmEmail');
  
  if (emailControl.pristine || confirmEmail.pristine) {
    return null;
  }
  
  if (emailControl.value === confirmEmail.value) {
    return null;
  }
  return {'match': true };
}

@Component({
  selector: 'app-customer',
  templateUrl: './customer.component.html',
  styleUrls: ['./customer.component.css']
})
export class CustomerComponent implements OnInit {
  customer: Customer = new Customer();
  customerForm: FormGroup;
  emailMessage: any;

  get addresses(): FormArray{
    return <FormArray>this.customerForm.get('addresses');
  }

  private validationMessages = {
    required: 'Please enter your email address.',
    email: 'Please enter a valid email address.'
  }

  constructor(private formBuilder: FormBuilder) { }

  ngOnInit() {
     this.customerForm = this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(3)]],
      lastName: ['', [Validators.required, Validators.maxLength(50)]],
      emailGroup: this.formBuilder.group({
        email: ['', [Validators.required, Validators.email]],
        confirmEmail: ['', Validators.required]
      }, {validator: emailMatcher}),
      phone: '',
      notification: 'email',
      rating: [null, ratingRange(1,5)],
      sendCatalog: true,
      addresses: this.formBuilder.array([ this.buildAddress() ])
    });

    this.customerForm.get('notification').valueChanges.subscribe(value => {
      this.setNotification(value);
    });

    const emailControl = this.customerForm.get('emailGroup.email');
    emailControl.valueChanges.pipe(
      debounceTime(1000)
    ).subscribe(value => {
      this.setMessage(emailControl);
    })
  }

  addAddress(): void {
    this.addresses.push(this.buildAddress());
  }

  buildAddress(): FormGroup {
    return this.formBuilder.group({
      addressType: 'home',
      street1: '',
      street2: '',
      city: '',
      state: '',
      zip: ''
    });
  }

  setMessage(control: AbstractControl): void {
    this.emailMessage = '';
    if ((control.touched || control.dirty) && control.errors) {
      this.emailMessage = Object.keys(control.errors).map(key => this.validationMessages[key]).join(' ');
    }
  }

  populateTestData(): void {
    this.customerForm.patchValue({
      firstName: "Testy",
      lastName: "McTesterson",
      emailGroup: {
        email: "testy@test.com"
      },
      sendCatalog: true
    });

    this.addresses.clear();
    this.addresses.push(this.formBuilder.group({
      addressType: 'home',
      street1: '123 Fake Street',
      street2: 'Apt #2',
      city: 'Los Angeles',
      state: 'CA',
      zip: '99999'
    }));
  }

  setNotification(notifyVia: string): void {
    const phoneControl = this.customerForm.get('phone');
    
    if (notifyVia === 'text') {
      phoneControl.setValidators(Validators.required);
    } else {
      phoneControl.clearValidators();
    }
    phoneControl.updateValueAndValidity();
  }

  save() {
    console.log(this.customerForm);
    console.log('Saved: ' + JSON.stringify(this.customerForm.value));
  }
}
