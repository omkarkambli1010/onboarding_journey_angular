import { Component,NgZone, ChangeDetectorRef,  ViewChild, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { APIService } from '../api.service';
import { AesService } from '../aes.service';
import { Meta, Title } from '@angular/platform-browser';
import { NgOtpInputConfig } from 'ng-otp-input';
import { ToastrService } from 'ngx-toastr';
import { NavigationService } from '../navigation.service';
import { MoengagesdkService } from '../moengagesdk.service';
import { NgModel } from '@angular/forms';

declare let $: any;


@Component({
  selector: 'app-nominee',
  templateUrl: './nominee.component.html',
  styleUrls: ['./nominee.component.css']
})
export class NomineeComponent  implements OnInit  {
    @ViewChild('mobilecloseModal') mobilecloseModal: any;
    @ViewChild('emailclosebutton') emailclosebutton: any;
    @ViewChild('otpMobileInput') otpMobileInput: any | NgModel;
    @ViewChild('otpEmailInput') otpEmailInput: any | NgModel;
  //Generic Declarations
  clientid: any;

  //Nominee Declarations
  ApplicantName : any = '';
  ApplicantPAN : any = '';
  ApplicantMobile : any = '';
  nomineeForm: FormGroup;
  editingIndex: number | null = null;
  nomineeoptout: boolean = false;
  PersonalFormOne: boolean = true;
  PersonalFormTwo: boolean = false;
  // isMinor:boolean = false;
  IsAnyNomineeMajor: boolean = false;
  PersonalResponse: any;
  NomineeOneProofResponse: any = '';        
  NomineeOneResponse: any = '';
  guardianListResponse: any = '';
  
mobileMaxLength = 10;  // default for RI
mobileMinLength = 10;  // default for RI


// NomineeSelect: string | null = null;
NomineeSelect: { id: number; name: string } | null = null;
amountPercent: number | null = null;
amountRupees: number | null = null;

  
  //UTM Source Component Declarations
  utm_source!: any;
  utm_medium!: any;
  utm_campaign!: any;

  //Mobile OTP Declarations
  sendOtp: any = {
    mobile: '',
    email: '',
    fullname: '',
  };
  otpFieldMobile: any;
  isMobileVerifyBtn: boolean = true;
  isWrongOTP: boolean = false;
  isRightOTP: boolean = false;
  config: NgOtpInputConfig = {
    allowNumbersOnly: true,
    length: 6,
    isPasswordInput: false,
    disableAutoFocus: false,
    placeholder: '',
  };
  timeroff: any = true;
  mobileOTPResponse: any;
  displayMobile: any;
  interval: any;
  mobileReq: boolean = false;
  mobileDigitReq: boolean = false;
  timeLeft: number = 30;


  //DOB Calender Declarations
  formattedDOB: any;
  minDate: any;
  maxDate: any;
  minDateGuardian: any;
  dateOfBirthName = 'nomineedob';

  constructor(
    private _http: APIService,
    private aesService: AesService,
    private toastr: ToastrService,
    private navService: NavigationService,
    
    private fb: FormBuilder,
    private spinner: NgxSpinnerService,
    private router: Router,
    private title: Title,
    private meta: Meta,
    private route: ActivatedRoute,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    private MoengageService: MoengagesdkService

    
  ) {

    this.nomineeForm = this.fb.group({
      nominees: this.fb.array([this.createNominee()])
    });

    this.nominees.valueChanges.subscribe(() => this.updateIsAnyNomineeMajor());

    // Initial evaluation
    this.updateIsAnyNomineeMajor();

    this.setupConditionalValidation();
  }

  get nominees(): FormArray {
    return this.nomineeForm.get('nominees') as FormArray;
  }

  ngOnInit(): void {
    
    this.title.setTitle('Add Nominee - Onboarding-DIY-PWA');

    this.meta.updateTag({
      name: 'description',
      content: 'Adding Nominee during the onboarding process journey',
    });
    // this.route.params.subscribe((params) => {
    //   const formNumber = params['formNumber'];
    //   this.setFormVisibility(formNumber);
    // });
      this.getPersonalDataTwo();
    this.clientid = sessionStorage.getItem('clientid') ?? '';
    this.utm_source =
      this.route.snapshot.queryParams['utm_source'] || 'search-engine';
    this.utm_medium =
      this.route.snapshot.queryParams['utm_medium'] || 'organic';
    this.utm_campaign =
      this.route.snapshot.queryParams['utm_campaign'] || 'Onboarding-DIY';

    // this.getPersonalDataTwo();
    this.getNomineeDetails();
    this.getNomineeGuardianDetails();


    const today = new Date();
    // const today = new Date();
    // const yesterday = new Date(today);
    // yesterday.setDate(today.getDate() - 1);
    this.maxDate = today;

    
    console.log("this.nominees",this.nominees);
    this.minDate = new Date(
      today.getFullYear() - 18,
      today.getMonth(),
      today.getDate() + 1
    );
    this.minDateGuardian = new Date(
      today.getFullYear() - 100,
      today.getMonth(),
      today.getDate()
    );

    
  }

  //----------------Nominee Functions----------------
  redirectSignature() {
    this.spinner.show();
    setTimeout(() => {
      const modalBackdrops = document.querySelectorAll('.modal-backdrop');
      modalBackdrops.forEach((backdrop) => {
        if (backdrop instanceof HTMLElement) {
          backdrop.remove();
        }
      });
      // this.router.navigate(['/uploadSignature']);
      this.checkPanNameChangeReverse();
      this.spinner.hide();
    }, 200);
  }
  checkPanNameChangeReverse() {
    //console.log('calling status api');
    var reqData = {
      flag: 'NAMECHANGE',
      formnumber: window.sessionStorage.getItem('FormNumber'),
    };

    this._http
      .postRequest('api/v1/WorkflowDetails/getworkflowdata', reqData)
      .subscribe((resp) => {
        let response: any = resp.body;
        this.spinner.hide();
        if (response.status == true) {
          response = JSON.parse(
            this.aesService.decrypt(response.data, this.clientid, this.clientid)
          );

          if (resp.body.message === 'Data found') {
            // this.selectedIncome = response[0].AnnualIncome;
            //console.log('sdasdasd');
            //console.log(response);
            if (response[0].SupportDoc_req.toUpperCase() == 'YES') {
              this.router.navigate(['/support-document']);

            } else if (response[0].Namechangedoc_req.toUpperCase() == 'YES') {
              this.router.navigate(['/nameChange']);
            }
            else if (
              response[0].Namechangedoc_req.toUpperCase() == 'YES' &&
              response[0].tdw_namechangedoc == 'Y'
            ) {
              this.router.navigate(['/nameChange']);
            } else if (
              response[0].UploadPandoc_req.toUpperCase() == 'YES' &&
              response[0].tdw_Uploadpan == 'Y'
            ) {
              this.router.navigate(['/uploadPan']);
            }
            //incomplete
            else if (
              response[0].IsDigilocker == 0 &&
              response[0].tdw_AadhaarBack == 'Y'
            ) {
              this.router.navigate(['/aadhaar-back']);
            } else {
              this.router.navigate(['/uploadSignature']);
            }
          }
        }
      });
  }
  trimVal(control: AbstractControl | null, key: string): string {
    const raw = control?.get(key)?.value ?? '';
    // Trim and collapse internal whitespace
    return String(raw).trim().replace(/\s+/g, ' ');
  }

  hasName(n: AbstractControl): boolean {
    const first = this.trimVal(n, 'firstName');
    const last  = this.trimVal(n, 'lastName');
    // Show if at least one of them is non-empty
    return !!(first || last);
  }

  fullName(n: AbstractControl): string {
    const first = this.trimVal(n, 'firstName');
    const last  = this.trimVal(n, 'lastName');
    return `${first} ${last}`.trim();
  }



  //Function to add a new Nominee in the list (ALSO CONTAINS THE INIT MODEL FOR NOMINEE, Set up init validations here).
  createNominee(): FormGroup {
    return this.fb.group({
      nomineeAddressType: ['RI', Validators.required],
      firstName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      mobile: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
      email: ['', [Validators.required, Validators.email, Validators.minLength(3), Validators.maxLength(50)]],
      idProofType: ['', Validators.required],
      idProofNo: ['', Validators.required],
      relationship: ['', Validators.required],
      allocation: [100, [Validators.required, Validators.min(0), Validators.max(100)]],
      isMinor: [false],
      dob: [null, Validators.required],
      sameAsApplicantAddress: [true],
      printInStatement: [true, Validators.required],
      address1: ['',],
      address2: [''],
      address3: [''],
      pincode: [''],
      state: ['', ],
      city: [''],
      guardianSameAsApplicantAddress: [true],
      guardianFirstName: [''],
      guardianLastName: [''],
      guardianRelationship: [''],
      guardianAddress1:['',],
      guardianAddress2:['',],
      guardianAddress3:[''],
      guardianPincode:['',],
      guardianState:[''],
      guardianCity:[''],
      guardianMobile:[''],
      guardianEmail:[''],
      guardianidProofType: [''],
      guardianidProofNo: [''],
      NomineeSelect:[''],
      amountPercent:[''],
      amountRupees:[''],
      guardiandob: [null],
    });
  }


  private updateIsAnyNomineeMajor(): void {
    const anyMajor = this.nominees.controls.some(ctrl => ctrl.get('isMinor')?.value === false);
    this.IsAnyNomineeMajor = anyMajor;
    if (this.IsAnyNomineeMajor == false ){
      this.NomineeSelect = null
      this.amountRupees = null
      this.amountPercent = null

    }
    // If you also need to propagate this elsewhere, you can emit to a service (see Option 2).
  }




setupConditionalValidation(): void {
  this.nominees.controls.forEach((control) => {
    const group = control as FormGroup;

    // Minor handling using your helper functions
    group.get('dob')?.valueChanges.subscribe((dobValue: string) => {
      const isMinor = this.computeIsMinor(dobValue);
      this.toggleMinorValidators(group, isMinor);
    });

    // Auto-fill state/city from pincode
    group.get('pincode')?.valueChanges.subscribe((pincode: string) => {
      if (pincode != null && pincode.length === 6) {
        this.GetStateandCity(pincode, group);
      }
    });

    group.get('guardianPincode')?.valueChanges.subscribe((pincode: string) => {
      if (pincode != null && pincode.length === 6) {
        this.GetGuardianStateandCity(pincode, group);
      }
    });

    // Handle sameAsApplicantAddress toggle
    group.get('sameAsApplicantAddress')?.valueChanges.subscribe((same: boolean) => {
      const addressFields = ['address1', 'address2','pincode', 'state', 'city'];
      if (!same) {
        addressFields.forEach(field => {
          group.get(field)?.setValidators([Validators.required]);
        });
      } else {
        addressFields.forEach(field => {
          group.get(field)?.clearValidators();
          group.get(field)?.setValue('');
        });
      }
      addressFields.forEach(field => group.get(field)?.updateValueAndValidity({ emitEvent: false }));
    });

    // Handle guardianSameAsApplicantAddress toggle
    group.get('guardianSameAsApplicantAddress')?.valueChanges.subscribe((same: boolean) => {
      const guardianAddressFields = [
        'guardianAddress1', 'guardianAddress2',
        'guardianPincode', 'guardianState', 'guardianCity'
      ];
      if (!same) {
        guardianAddressFields.forEach(field => {
          group.get(field)?.setValidators([Validators.required]);
        });
      } else {
        guardianAddressFields.forEach(field => {
          group.get(field)?.clearValidators();
          group.get(field)?.setValue('');
        });
      }
      guardianAddressFields.forEach(field => group.get(field)?.updateValueAndValidity({ emitEvent: false }));
    });

    // ===== Mobile validators + hard length cap =====
    const addressTypeCtrl = group.get('nomineeAddressType');
    const mobileCtrl = group.get('mobile');

    if (!addressTypeCtrl || !mobileCtrl) {
      console.warn('Form controls not found: nomineeAddressType or mobile');
      return;
    }

    // Apply validators when type changes and set dynamic minlength/maxlength
    addressTypeCtrl.valueChanges.subscribe((type: 'RI' | 'NRI') => {
      if (type === 'RI') {
        // UI caps
        this.mobileMaxLength = 10;
        this.mobileMinLength = 10;

        // Validators: exactly 10 digits, starting 6–9
        mobileCtrl.setValidators([
          Validators.required,
          Validators.pattern(/^[6-9]\d{9}$/),
          Validators.minLength(10),
          Validators.maxLength(10),
        ]);
      } else if (type === 'NRI') {
        // UI caps
        this.mobileMaxLength = 20;
        this.mobileMinLength = 5;

        // Validators: digits only, 5–20
        mobileCtrl.setValidators([
          Validators.required,
          Validators.pattern(/^\d+$/),
          Validators.minLength(5),
          Validators.maxLength(20),
        ]);
      } else {
        // Unknown type
        this.mobileMaxLength = 20;
        this.mobileMinLength = 5;
        mobileCtrl.clearValidators();
      }

      // Re-validate after changing validators without re-emitting
      mobileCtrl.updateValueAndValidity({ emitEvent: false });

      // Hard trim if current value exceeds the new max
      const val = (mobileCtrl.value ?? '').toString();
      if (val.length > this.mobileMaxLength) {
        mobileCtrl.setValue(val.slice(0, this.mobileMaxLength), { emitEvent: false });
        mobileCtrl.updateValueAndValidity({ emitEvent: false });
      }
    });

    // Also clamp as user types (defensive)
    mobileCtrl.valueChanges.subscribe((val) => {
      const currentType = addressTypeCtrl.value as 'RI' | 'NRI';
      const s = (val ?? '').toString();

      // enforce digits only for both types (UI-side)
      const digitsOnly = s.replace(/\D+/g, '');

      let maxLen = currentType === 'RI' ? 10 : 20;
      const trimmed = digitsOnly.slice(0, maxLen);

      if (trimmed !== s) {
        mobileCtrl.setValue(trimmed, { emitEvent: false });
        mobileCtrl.updateValueAndValidity({ emitEvent: false });
      }
    });

    // Initialize validators and maxlength once
    addressTypeCtrl.setValue(addressTypeCtrl.value, { emitEvent: true });

    // ===== Allocation clamp remains as previously suggested (optional) =====
    const allocationCtrl = group.get('allocation');
    if (allocationCtrl) {
      allocationCtrl.valueChanges.subscribe((val) => {
        const num = typeof val === 'number' ? val : Number(val);
        if (isNaN(num)) return;
        let clamped = num;
        if (num > 100) clamped = 100;
        else if (num < 0) clamped = 0;
        if (clamped !== num) {
          allocationCtrl.setValue(clamped, { emitEvent: false });
          allocationCtrl.updateValueAndValidity({ emitEvent: false });
        }
      });
    } else {
      console.warn('Form control not found: allocation');
    }

    // ===== Identity validators + hard length cap =====

// ===== Identity validators + hard length cap =====
const ProofTypeCtrl = group.get('idProofType');
const ProofNumberCtrl = group.get('idProofNo');

if (!ProofTypeCtrl || !ProofNumberCtrl) {
  console.warn('Form controls not found: idProofType or idProofNo');
  return;
}

// --- Regexes (final rules) ---
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/; // unchanged
const AADHAAR_4DIGITS_REGEX = /^\d{4}$/; // NEW: exactly 4 digits
const DRIVING_LICENSE_REGEX = /^(([A-Z]{2}[0-9]{2})( )|([A-Z]{2}-[0-9]{2}))((19|20)[0-9][0-9])[0-9]{7}$/; // NEW
const PASSPORT_LOOSE_REGEX = /^[A-Za-z0-9](?:[A-Za-z0-9 -]*[A-Za-z0-9])?$/; // NEW

// --- Sanitizers (block invalid typing on the fly) ---
const sanitizePan = (input: string): string => {
  let v = (input ?? '').toString().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
  let out = '';
  for (let i = 0; i < v.length; i++) {
    const ch = v[i];
    if (i <= 4) {                        // first 5 letters
      if (/[A-Z]/.test(ch)) out += ch; else break;
    } else if (i <= 8) {                 // next 4 digits
      if (/\d/.test(ch)) out += ch; else break;
    } else if (i === 9) {                // last letter
      if (/[A-Z]/.test(ch)) out += ch; else break;
    }
  }
  return out;
};

// Aadhaar: allow only digits, cap at 4
const sanitizeAadhaar4 = (input: string): string =>
  (input ?? '').toString().replace(/\D/g, '').slice(0, 4);

// Driving License: uppercase letters, allow digits and hyphen/space only at the exact positions
// We’ll be permissive during typing (A–Z, 0–9, space, hyphen) and rely on regex for final validity.
// Also cap length to a reasonable max (e.g., 20) to avoid runaway input.
const sanitizeDrivingLicense = (input: string): string =>
  (input ?? '').toString().toUpperCase().replace(/[^A-Z0-9 -]/g, '').slice(0, 20);

// Passport (loose): allow A–Z a–z 0–9 space hyphen, auto-uppercase letters if you prefer.
// To preserve case per your regex, we won’t force uppercase; but you can enable it by adding .toUpperCase().
const sanitizePassportLoose = (input: string): string =>
  (input ?? '').toString().replace(/[^A-Za-z0-9 -]/g, '').slice(0, 50);

// --- Type change => set validators + clamp current value ---
ProofTypeCtrl.valueChanges.subscribe((type: string) => {
  const t = (type || '').toUpperCase();

  // Choose validators and hard maxLength (UI cap handled via clamping)
  let validators = [Validators.required];
  let maxLen = 50;

  switch (t) {
    case 'PAN':
      maxLen = 10;
      validators.push(Validators.pattern(PAN_REGEX));
      break;

    case 'AADHAAR':            // Your new rule: exactly 4 digits
      maxLen = 4;
      validators.push(Validators.pattern(AADHAAR_4DIGITS_REGEX));
      break;

    case 'VALID DRIVING LICENSE':
      // Length varies; regex enforces full structure.
      maxLen = 20; // safe UI cap; actual validity enforced by regex
      validators.push(Validators.pattern(DRIVING_LICENSE_REGEX));
      break;

    case 'VALID PASSPORT':
      // The regex allows variable length; keep a generous cap to avoid excessive input.
      maxLen = 50;
      validators.push(Validators.pattern(PASSPORT_LOOSE_REGEX));
      break;

    default:
      // fallback: required only
      maxLen = 50;
      break;
  }

  ProofNumberCtrl.setValidators(validators);
  ProofNumberCtrl.updateValueAndValidity({ emitEvent: false });

  // Clamp current value immediately to allowed characters/length
  const curr = (ProofNumberCtrl.value ?? '').toString();
  const clamped =
    t === 'PAN' ? sanitizePan(curr)
    : t === 'AADHAAR' ? sanitizeAadhaar4(curr)
    : t === 'VALID DRIVING LICENSE' ? sanitizeDrivingLicense(curr)
    : t === 'VALID PASSPORT' ? sanitizePassportLoose(curr)
    : curr;

  if (clamped !== curr) {
    ProofNumberCtrl.setValue(clamped, { emitEvent: false });
    ProofNumberCtrl.updateValueAndValidity({ emitEvent: false });
  }

  // If you bind [attr.maxlength] in the template, you can store per-group if needed.
  // Example: group['idProofMaxLen'] = maxLen; (or maintain a Map<FormGroup, number>)
});

// --- On-field typing clamp (defensive) ---
ProofNumberCtrl.valueChanges.subscribe((val) => {
  const t = (ProofTypeCtrl.value ?? '').toUpperCase();
  const s = (val ?? '').toString();

  const sanitized =
    t === 'PAN' ? sanitizePan(s)
    : t === 'AADHAAR' ? sanitizeAadhaar4(s)
    : t === 'VALID DRIVING LICENSE' ? sanitizeDrivingLicense(s)
    : t === 'VALID PASSPORT' ? sanitizePassportLoose(s)
    : s;

  if (sanitized !== s) {
    ProofNumberCtrl.setValue(sanitized, { emitEvent: false });
    ProofNumberCtrl.updateValueAndValidity({ emitEvent: false });
  }
});

// Initialize once to apply validators/clamp for existing value
ProofTypeCtrl.setValue(ProofTypeCtrl.value, { emitEvent: true });



const IsMinor = group.get('isMinor')?.value;
if (IsMinor==null) {
  console.warn('Form controls not found: isMinor');
  return;
}

const GuarProofTypeCtrl = group.get('guardianidProofType');
const GuarProofNumberCtrl = group.get('guardianidProofNo');

if (!GuarProofTypeCtrl || !GuarProofNumberCtrl) {
  console.warn('Form controls not found: idProofType or idProofNo');
  return;
}

// --- Type change => set validators + clamp current value ---
GuarProofTypeCtrl.valueChanges.subscribe((type: string) => {
  const t = (type || '').toUpperCase();
  if(IsMinor){
  // Choose validators and hard maxLength (UI cap handled via clamping)
  let validators = [Validators.required];
  let maxLen = 50;
  
  switch (t) {
    case 'PAN':
      maxLen = 10;
      validators.push(Validators.pattern(PAN_REGEX));
      break;

    case 'AADHAAR':            // Your new rule: exactly 4 digits
      maxLen = 4;
      validators.push(Validators.pattern(AADHAAR_4DIGITS_REGEX));
      break;

    case 'VALID DRIVING LICENSE':
      // Length varies; regex enforces full structure.
      maxLen = 20; // safe UI cap; actual validity enforced by regex
      validators.push(Validators.pattern(DRIVING_LICENSE_REGEX));
      break;

    case 'VALID PASSPORT':
      // The regex allows variable length; keep a generous cap to avoid excessive input.
      maxLen = 50;
      validators.push(Validators.pattern(PASSPORT_LOOSE_REGEX));
      break;

    default:
      // fallback: required only
      maxLen = 50;
      break;
  }

  GuarProofNumberCtrl.setValidators(validators);
  GuarProofNumberCtrl.updateValueAndValidity({ emitEvent: false });

  // Clamp current value immediately to allowed characters/length
  const curr = (GuarProofNumberCtrl.value ?? '').toString();
  const clamped =
    t === 'PAN' ? sanitizePan(curr)
    : t === 'AADHAAR' ? sanitizeAadhaar4(curr)
    : t === 'VALID DRIVING LICENSE' ? sanitizeDrivingLicense(curr)
    : t === 'VALID PASSPORT' ? sanitizePassportLoose(curr)
    : curr;

  if (clamped !== curr) {
    GuarProofNumberCtrl.setValue(clamped, { emitEvent: false });
    GuarProofNumberCtrl.updateValueAndValidity({ emitEvent: false });
  }
  }
  // If you bind [attr.maxlength] in the template, you can store per-group if needed.
  // Example: group['idProofMaxLen'] = maxLen; (or maintain a Map<FormGroup, number>)
});

// --- On-field typing clamp (defensive) ---
GuarProofNumberCtrl.valueChanges.subscribe((val) => {
  const t = (GuarProofTypeCtrl.value ?? '').toUpperCase();
  const s = (val ?? '').toString();

  const sanitized =
    t === 'PAN' ? sanitizePan(s)
    : t === 'AADHAAR' ? sanitizeAadhaar4(s)
    : t === 'VALID DRIVING LICENSE' ? sanitizeDrivingLicense(s)
    : t === 'VALID PASSPORT' ? sanitizePassportLoose(s)
    : s;

  if (sanitized !== s) {
    GuarProofNumberCtrl.setValue(sanitized, { emitEvent: false });
    GuarProofNumberCtrl.updateValueAndValidity({ emitEvent: false });
  }
});

// Initialize once to apply validators/clamp for existing value
GuarProofTypeCtrl.setValue(GuarProofTypeCtrl.value, { emitEvent: true });




  });
  
}


  setFormVisibility(formNumber: string) {
    this.PersonalFormOne = false;
    this.PersonalFormTwo = false;

    switch (formNumber) {
      case '1':
        this.PersonalFormOne = true;
        break;
      case '2':
        this.PersonalFormTwo = true;
        this.getPersonalDataTwo();
        break;
      default:
        break;
    }
  }

  
onPercentInput() {
  // When percentage is typed, clear rupees
  if (this.amountPercent !== null && this.amountPercent !== undefined && this.amountPercent != null) {
    this.amountRupees = null;
  }
  // Optional: clamp values
  if (typeof this.amountPercent === 'number') {
    if (this.amountPercent < 0) this.amountPercent = 0;
    if (this.amountPercent > 100) this.amountPercent = 100;
  }
}

onRupeesInput() {
  // When rupees is typed, clear percentage
  if (this.amountRupees !== null && this.amountRupees !== undefined && this.amountRupees != null) {
    this.amountPercent = null;
  }
  // Optional: clamp
  if (typeof this.amountRupees === 'number' && this.amountRupees < 0) {
    this.amountRupees = 0;
  }
}



  //Function to get state.
  GetStateandCity(pincode:string, group: FormGroup) {
    this.spinner.show();
      var stateName = '';
      const reqData = {
        Pincode: pincode,
      };

      this._http
        .postRequest('api/v1/personalDetail/getStateCity', reqData)
        .subscribe((resp) => {
          let response: any = resp.body;
          if (response.status === true && response.message === 'Data found') {
            response = JSON.parse(
              this.aesService.decrypt(
                response.data,
                this.clientid,
                this.clientid
              )
            );
            stateName = response.Table[0].STATE_NAME;
            console.log("ss RESPONSE: ",response)

            console.log("STATE RESPONSE1111: ",stateName)
            // return stateName;
            group.get('state')?.patchValue(stateName);
            this.spinner.hide();

          } else {
            this.spinner.hide();

            this.toastr.error(response.message, 'Nominee 1', {
              positionClass: 'toast-bottom-center',
              timeOut: 2000,
            });

          }
          return stateName;
        });

  }
  GetGuardianStateandCity(pincode:string, group: FormGroup) {
    this.spinner.show();
      var stateName = '';
      const reqData = {
        Pincode: pincode,
      };

      this._http
        .postRequest('api/v1/personalDetail/getStateCity', reqData)
        .subscribe((resp) => {
          let response: any = resp.body;
          if (response.status === true && response.message === 'Data found') {
            response = JSON.parse(
              this.aesService.decrypt(
                response.data,
                this.clientid,
                this.clientid
              )
            );
            stateName = response.Table[0].STATE_NAME;
            console.log("ss RESPONSE: ",response)

            console.log("STATE RESPONSE1111: ",stateName)
            // return stateName;
            group.get('guardianState')?.patchValue(stateName);
            this.spinner.hide();

          } else {
            this.spinner.hide();

            this.toastr.error(response.message, 'Nominee 1', {
              positionClass: 'toast-bottom-center',
              timeOut: 2000,
            });

          }
          return stateName;
        });

  }
  //Function for dynamic validations such as Minor validations.


parseDob(dobValue: string | null | undefined): Date | null {
  if (!dobValue) return null;

  const s = dobValue.trim();

  // If it's a full ISO string or starts with YYYY-MM-DD, try native first.
  // Native parsing of ISO is reliable; otherwise we'll fall back.
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  // Try dd/mm/yyyy or dd-mm-yyyy (allow single-digit d/m)

const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (!m) return null;

  const dd = Number(m[1]);
  const mm = Number(m[2]);
  const yyyy = Number(m[3]);

  if (
    !Number.isInteger(dd) || !Number.isInteger(mm) || !Number.isInteger(yyyy) ||
    yyyy < 1000 || mm < 1 || mm > 12 || dd < 1 || dd > 31
  ) {
    return null;
  }

  // Construct using UTC to avoid timezone offsets changing the day
  const d = new Date(Date.UTC(yyyy, mm - 1, dd));
  // Validate that the components round-trip correctly (catches 31/02/2020 etc.)
  if (
    d.getUTCFullYear() !== yyyy ||
    d.getUTCMonth() !== mm - 1 ||
    d.getUTCDate() !== dd
  ) {
    return null;
  }

  return d;
}




computeIsMinor(dobValue: string | null | undefined): boolean {
  const dob = this.parseDob(dobValue);
  if (!dob) return false; // invalid/missing dob => treat as adult (your rule)

  // Use today's date in UTC to avoid timezone edge cases
  const now = new Date();
  const todayUTC = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  ));

  let age = todayUTC.getUTCFullYear() - dob.getUTCFullYear();

  const monthDiff = todayUTC.getUTCMonth() - dob.getUTCMonth();
  const dayDiff = todayUTC.getUTCDate() - dob.getUTCDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--;
  }

  return age < 18;

}

/** Apply/remove validators and enable/disable guardian controls */
 toggleMinorValidators(group: FormGroup, isMinor: boolean) {
  const requiredGuardianFields = [
    'guardianFirstName',
    'guardianLastName',
    'guardianRelationship',
  ];

  const allGuardianFields = [
    ...requiredGuardianFields,
    'guardianAddress1',
    'guardianAddress2',
    'guardianAddress3',
    'guardianPincode',
    'guardianState',
    'guardianCity',
    'guardianMobile',
    'guardianEmail',
    'guardianidProofType',
    'guardianidProofNo',

  ];

  // Update isMinor flag without re-emitting form events
  group.get('isMinor')?.setValue(isMinor, { emitEvent: false });

  if (isMinor) {
    // Enable required fields and set required validator
    requiredGuardianFields.forEach((field) => {
      const ctrl = group.get(field);
      if (!ctrl) return;

      ctrl.enable({ emitEvent: false });
      ctrl.setValidators([Validators.required]);
      ctrl.clearAsyncValidators();
      ctrl.updateValueAndValidity({ onlySelf: true, emitEvent: false });
    });

    // Optional guardian fields: enable, no validators
    allGuardianFields.forEach((field) => {
      if (requiredGuardianFields.includes(field)) return;
      const ctrl = group.get(field);
      if (!ctrl) return;

      ctrl.enable({ emitEvent: false });
      ctrl.clearValidators();
      ctrl.clearAsyncValidators();
      ctrl.setErrors(null);
      ctrl.updateValueAndValidity({ onlySelf: true, emitEvent: false });
    });
  } else {
    // Adult: clear values (to empty string), remove validators, disable all guardian fields
    allGuardianFields.forEach((field) => {
      const ctrl = group.get(field);
      if (!ctrl) return;

      // Remove validators
      ctrl.clearValidators();
      ctrl.clearAsyncValidators();
      ctrl.setErrors(null);

      // Assign empty string (instead of null)
      // If you have non-string controls (e.g., checkbox), you can customize below.
      ctrl.setValue('');

      // Optional: reset UI state
      ctrl.markAsPristine();
      ctrl.markAsUntouched();

      // Disable to exclude from validation and form value
      ctrl.disable({ emitEvent: false });

      // Recompute validity
      ctrl.updateValueAndValidity({ onlySelf: true, emitEvent: false });
    });
  }
}








  //Function to add nominee to the list after running the validations.
  addNominee(): void {
    if (this.nominees.length < 10) {

      const newNominee = this.createNominee();
      this.nominees.push(newNominee);
      this.editingIndex = this.nominees.length - 1;
      this.setupConditionalValidation(); // Apply validation to new nominee
    }
  }

//   addNominee(): void {
//   if (this.nominees.length < 10) {
//     const guardianFields = [
//       'guardianFirstName', 'guardianLastName', 'guardianRelationship'
//     ];
//     const guardianAddressFields = [
//       'guardianAddress1', 'guardianAddress2', 'guardianAddress3',
//       'guardianPincode', 'guardianState', 'guardianCity'
//     ];
//     const addressFields = ['address1', 'address2', 'address3', 'pincode', 'state', 'city'];

//     const newNominee = this.createNominee(); // returns FormGroup
//     this.nominees.push(newNominee);
//     this.editingIndex = this.nominees.length - 1;

//     // ✅ Clear validators for new nominee fields
//     [...addressFields, ...guardianFields, ...guardianAddressFields].forEach(field => {
//       const control = newNominee.get(field);
//       if (control) {
//         control.clearValidators();
//         control.updateValueAndValidity();
//       }
//     });

//     this.setupConditionalValidation(); // Apply other conditional validations if needed
//   }
// }


  //Function to save nominee after running validations, calls onsubmit function. 
//   saveNominee(): void {
//     const nomineeGroup = this.nominees.at(this.editingIndex!);
//     if (nomineeGroup.valid) 
// {
//     console.log("FORM IS VALID!")
//     const totalAllocation = this.nominees.controls.reduce((sum, control) => {
//       const allocation = control.get('allocation')?.value || 0;
//       return sum + Number(allocation);
//     }, 0);
//     console.log("TOTAL ALLOCATION! :",totalAllocation)

//     if (totalAllocation != 100) {
//       alert('Total allocation across all nominees cannot exceed 100%.');
//       return;
//     }


//       this.editingIndex = null;
//       //onsubmit here!
//     } else {
//       nomineeGroup.markAllAsTouched();
//     }
  // }



  //Function to compare Applicant and Nominee.
  compareApplicantandNomineeName(){
    const nomineeGroup = this.nominees.at(this.editingIndex!);
    const applicantName = this.ApplicantName; // You should set this somewhere in your component
    const currentFullName = `${nomineeGroup.get('firstName')?.value} ${nomineeGroup.get('lastName')?.value}`;

    // Compare with applicant name
    if (this.compareFirstAndLastName(currentFullName, applicantName)) {
    // alert('Nominee name cannot be the same as Applicant name.');
    return true;
    }else{
      return false;
    }
  }

  //Unused Function.
  compareAllNames(){
    const nomineeGroup = this.nominees.at(this.editingIndex!);
    const applicantName = this.ApplicantName; // You should set this somewhere in your component
    const currentFullName = `${nomineeGroup.get('firstName')?.value} ${nomineeGroup.get('lastName')?.value}`;
    // Compare with other nominees
    for (let i = 0; i < this.nominees.length; i++) {
      if (i !== this.editingIndex) {
        const other = this.nominees.at(i);
        const otherFullName = `${other.get('firstName')?.value} ${other.get('lastName')?.value}`;
        if (this.compareFirstAndLastName(currentFullName, otherFullName)) {
          // alert(`Nominee ${i + 1} has the same name. Duplicate nominee names are not allowed.`);
        this.toastr.error(`Nominee ${i + 1} has the same name. Duplicate nominee names are not allowed.`, 'Error', {
        positionClass: 'toast-bottom-center',
        timeOut: 2000,
      });
          return true;
        }
      }
    }
    return false
  }

  // saveNominee(): void {
  //   if (!this.nominees || this.nominees.length === 0) return;

  //   let totalAllocation = 0;
  //   const nomineeNames: string[] = [];
  //   const nomineePANS: string[] = [];

  //   const applicantName = this.ApplicantName?.trim().toLowerCase();

  //   for (let i = 0; i < this.nominees.length; i++) {
  //     const nomineeGroup = this.nominees.at(i);

  //     if (!nomineeGroup.valid) {
  //       nomineeGroup.markAllAsTouched();
  //       this.toastr.error(`Nominee ${i + 1} has invalid or incomplete details.`, 'Error', {
  //         positionClass: 'toast-bottom-center',
  //         timeOut: 2000,
  //       });
  //       return;
  //     }

  //     const allocation = Number(nomineeGroup.get('allocation')?.value || 0);
  //     totalAllocation += allocation;

  //     const firstName = nomineeGroup.get('firstName')?.value?.trim().toLowerCase();
  //     const lastName = nomineeGroup.get('lastName')?.value?.trim().toLowerCase();
  //     const fullName = `${firstName} ${lastName}`;
  //     const GuardianFirstName = nomineeGroup.get('guardianFirstName')?.value?.trim().toLowerCase();
  //     const GuardianLastName = nomineeGroup.get('guardianLastName')?.value?.trim().toLowerCase();
  //     const GuardianfullName = `${GuardianFirstName} ${GuardianLastName}`;

  //     // Check against applicant name
  //     if (this.compareFirstAndLastName(fullName, applicantName)) {
  //       this.toastr.error('Applicant Name and Nominee Name cannot be the same.', 'Error', {
  //         positionClass: 'toast-bottom-center',
  //         timeOut: 2000,
  //       });
  //       return;
  //     }
  //           // Check against applicant name
  //     if (this.compareFirstAndLastName(fullName, GuardianfullName)) {
  //       this.toastr.error('Nominee Name and Guardian Name cannot be the same.', 'Error', {
  //         positionClass: 'toast-bottom-center',
  //         timeOut: 2000,
  //       });
  //       return;
  //     }
  //     const NomineeProofType = nomineeGroup.get('idProofType')?.value?.trim().toUpperCase()
  //     const NomineeProofNo = nomineeGroup.get('idProofNo')?.value?.trim().toUpperCase()
  //     if (nomineePANS.includes(NomineeProofNo)){
  //       this.toastr.error(`Duplicate nominee PAN found: ${NomineeProofNo}`, 'Error', {
  //         positionClass: 'toast-bottom-center',
  //         timeOut: 2000,
  //       });
  //       return;
  //     }
  //     if (NomineeProofType=="PAN"){
  //       nomineePANS.push(NomineeProofNo);
  //       if(NomineeProofNo==this.ApplicantPAN){
  //         this.toastr.error('Applicant PAN and Nominee PAN cannot be the same.', 'Error', {
  //           positionClass: 'toast-bottom-center',
  //           timeOut: 2000,
  //         });
  //         return
  //       }
  //     }
  //     // Check for duplicate nominee names
  //     if (nomineeNames.includes(fullName)) {
  //       this.toastr.error(`Duplicate nominee name found: ${firstName} ${lastName}`, 'Error', {
  //         positionClass: 'toast-bottom-center',
  //         timeOut: 2000,
  //       });
  //       return;
  //     }



  //     nomineeNames.push(fullName);
  //     nomineeNames.push(GuardianfullName);
  //   }

  //   // Check total allocation
  //   if (totalAllocation !== 100) {
  //     this.toastr.error('Total allocation across all nominees should be exactly 100%.', 'Error', {
  //       positionClass: 'toast-bottom-center',
  //       timeOut: 2000,
  //     });
  //     return;
  //   }

  //   this.toastr.success('All nominee details are valid.', 'Success', {
  //     positionClass: 'toast-bottom-center',
  //     timeOut: 2000,
  //   });

  //   // Proceed with saving or submission logic here
  // }




  //Function to apply all validations before saving the Nominee.
  saveNominee(): void {
    if (!this.nominees || this.nominees.length === 0) return;

    let totalAllocation = 0;
    const nomineeNames: string[] = [];
    const nomineePANS: string[] = [];
    

    const applicantName = this.ApplicantName?.trim().toLowerCase();

    for (let i = 0; i < this.nominees.length; i++) {

  const nomineeGroup = this.nominees.at(i) as FormGroup;

  if (!nomineeGroup.valid) {
    nomineeGroup.markAllAsTouched();

    //Collect invalid fields
    const invalidFields: string[] = [];
    Object.keys(nomineeGroup.controls).forEach(key => {
      const control = nomineeGroup.get(key);
      if (control && control.invalid) {
        invalidFields.push(key);
      }
    });

    this.toastr.error(
      `Nominee ${i + 1} has invalid or incomplete details: ${invalidFields.join(', ')}`,
      'Error',
      {
        positionClass: 'toast-bottom-center',
        timeOut: 3000,
      }
    );
    
    // this.toastr.error(
    //   `Nominee ${i + 1} has incomplete details.`,
    //   'Error',
    //   {
    //     positionClass: 'toast-bottom-center',
    //     timeOut: 3000,
    //   }
    // );
    return;
  }


      const allocation = Number(nomineeGroup.get('allocation')?.value || 0);
      totalAllocation += allocation;

      const firstName = nomineeGroup.get('firstName')?.value?.trim().toLowerCase();
      const lastName = nomineeGroup.get('lastName')?.value?.trim().toLowerCase();
      const fullName = `${firstName} ${lastName}`;
      const GuardianFirstName = nomineeGroup.get('guardianFirstName')?.value?.trim().toLowerCase();
      const GuardianLastName = nomineeGroup.get('guardianLastName')?.value?.trim().toLowerCase();
      const GuardianfullName = `${GuardianFirstName} ${GuardianLastName}`;

      // Check against applicant name
      if (this.compareFirstAndLastName(fullName, applicantName)) {
        this.toastr.error('Applicant Name and Nominee Name cannot be the same.', 'Error', {
          positionClass: 'toast-bottom-center',
          timeOut: 2000,
        });
        return;
      }

      // Check against guardian name
      if (this.compareFirstAndLastName(fullName, GuardianfullName)) {
        this.toastr.error('Nominee Name and Guardian Name cannot be the same.', 'Error', {
          positionClass: 'toast-bottom-center',
          timeOut: 2000,
        });
        return;
      }

    const isMinor = nomineeGroup.get('isMinor')?.value;
      
    if (isMinor == false){
    if(this.NomineeSelect?.name == null || this.NomineeSelect?.name == ''){
        this.toastr.error(`Please select a Nominee in case of incapacitation`, 'Error', {
          positionClass: 'toast-bottom-center',
          timeOut: 2000,
        });
        return;
    }
        if((this.amountPercent == 0 || this.amountPercent == null) && (this.amountRupees == 0 || this.amountRupees == null)){
        this.toastr.error(`Please enter asset allocation amount.`, 'Error', {
          positionClass: 'toast-bottom-center',
          timeOut: 2000,
        });
        return;
    }
    if(this.amountPercent != null){
      if (this.amountPercent>100){
        this.toastr.error(`Incapactitation allocation percentage should not be more than 100%`, 'Error', {
          positionClass: 'toast-bottom-center',
          timeOut: 2000,
        });
        return;
      }
    }
    if (this.amountRupees != null){
      if (this.amountRupees>200000000){
        this.toastr.error(`Incapactitation allocation amount should be less than 20,00,00,000`, 'Error', {
          positionClass: 'toast-bottom-center',
          timeOut: 2000,
        });
        return;
      }
    }
    }


      const NomineeProofType = nomineeGroup.get('idProofType')?.value?.trim().toUpperCase();
      const NomineeProofNo = nomineeGroup.get('idProofNo')?.value?.trim().toUpperCase();
      
      const GuardianProofType = nomineeGroup.get('guardianidProofType')?.value?.trim().toUpperCase();
      const GuardianProofNo = nomineeGroup.get('guardianidProofNo')?.value?.trim().toUpperCase();

      const isGuardian = nomineeGroup.get('isMinor')?.value;
      if (nomineePANS.includes(NomineeProofNo)) {
        this.toastr.error(`Duplicate nominee PAN found: ${NomineeProofNo}`, 'Error', {
          positionClass: 'toast-bottom-center',
          timeOut: 2000,
        });
        return;
      }

      if (NomineeProofType === 'PAN') {
        nomineePANS.push(NomineeProofNo);
        if (NomineeProofNo === this.ApplicantPAN) {
          this.toastr.error('Applicant PAN and Nominee PAN cannot be the same.', 'Error', {
            positionClass: 'toast-bottom-center',
            timeOut: 2000,
          });
          return;
        }
        if(GuardianProofType === 'PAN'){
          if (NomineeProofNo == GuardianProofNo){
            this.toastr.error('Nominee PAN and Guardian PAN cannot be the same.', 'Error', {
            positionClass: 'toast-bottom-center',
            timeOut: 2000,
          });
          return;
          }
        }

      }
      if(!this.nomineeguaridproofval1(NomineeProofType,NomineeProofNo)){
        this.toastr.error(`Nominee ${i + 1} ${NomineeProofType} invalid.`, 'Error', {
        positionClass: 'toast-bottom-center',
        timeOut: 2000,
        });
        
        return;
      }
      console.log("GuardianProofType",GuardianProofType)
      if(isGuardian && GuardianProofType!=''){
        if(!this.nomineeguaridproofval1(GuardianProofType,GuardianProofNo)){
          this.toastr.error(`Guardian ${i + 1} ${GuardianProofType} invalid.`, 'Error', {
          positionClass: 'toast-bottom-center',
          timeOut: 2000,
          });
          return;
        }
      }


      // Check for duplicate nominee names
      if (nomineeNames.includes(fullName)) {
        this.toastr.error(`Duplicate nominee name found: ${firstName} ${lastName}`, 'Error', {
          positionClass: 'toast-bottom-center',
          timeOut: 2000,
        });
        return;
      }
      const GuardianMobileNumber = nomineeGroup.get('guardianMobile')?.value?.trim();
      const NomineeAddressType = nomineeGroup.get('nomineeAddressType')?.value?.trim().toUpperCase();
      console.log("GuardianMobileNumber",GuardianMobileNumber)
      if (GuardianMobileNumber!=''){
        if (NomineeAddressType=='RI' && GuardianMobileNumber.length!=10){
        this.toastr.error(`Guardian ${i + 1} Mobile Invalid or Incomplete`, 'Error', {
          positionClass: 'toast-bottom-center',
          timeOut: 2000,
        });
        return;
        }
        if (NomineeAddressType=='NRI' && !(GuardianMobileNumber.length>=5 && GuardianMobileNumber.length<=20)){
        this.toastr.error(`Guardian ${i + 1} Mobile Invalid or Incomplete`, 'Error', {
          positionClass: 'toast-bottom-center',
          timeOut: 2000,
        });
        return;
        }
      }
      const GuardianEmail = nomineeGroup.get('guardianEmail')?.value?.trim();
      if (GuardianEmail!=''){


        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (GuardianEmail && emailPattern.test(GuardianEmail)) {
          //console.log('Valid email');
        } else {
        this.toastr.error(`Guardian ${i + 1} Email Invalid or Incomplete`, 'Error', {
          positionClass: 'toast-bottom-center',
          timeOut: 2000,
        });
        return;
        }

      }
      // const GuardianAddress1 = nomineeGroup.get('guardianAddress1')?.value?.trim();
      // const GuardianAddress2 = nomineeGroup.get('guardianAddress2')?.value?.trim();
      // const GuardianPincode = nomineeGroup.get('guardianPincode')?.value?.trim();
      // const GuardianState = nomineeGroup.get('guardianState')?.value?.trim();
      // const GuardianCity = nomineeGroup.get('guardianState')?.value?.trim();
      // console.log("Guardian Address:",GuardianAddress1,GuardianAddress2,GuardianPincode,GuardianState,GuardianCity)
      // if (GuardianAddress1!='' || GuardianAddress2!='' || GuardianPincode!=''
      //   || GuardianState!=''||GuardianCity!=''
      // ){
      //   this.toastr.error(`Guardian ${i + 1} Address Invalid or Incomplete`, 'Error', {
      //     positionClass: 'toast-bottom-center',
      //     timeOut: 2000,
      //   });
      //   return;
      // }

      nomineeNames.push(fullName);
      // nomineeNames.push(GuardianfullName);
    }

    // Check total allocation
    if (totalAllocation !== 100) {
      this.toastr.error('Total allocation across all nominees should be exactly 100%.', 'Error', {
        positionClass: 'toast-bottom-center',
        timeOut: 2000,
      });
      return;
    }




    // this.toastr.success('All nominee details are valid.', 'Success', {
    //   positionClass: 'toast-bottom-center',
    //   timeOut: 2000,
    // });



    // Proceed with saving or submission logic here
    //SAVE FUNCTION HERE
    this.onSubmit();
  }

  //Function to validate Proof numbers.
  nomineeguaridproofval1(prooftype:string,proofno:string) {
    // const nomineproofregex1 = this.NomineeOneProofResponse[0].Regex_Validation;
    // const nomineproofregex2 = this.NomineeOneProofResponse[1].Regex_Validation;
    // const nomineproofregex3 = this.NomineeOneProofResponse[2].Regex_Validation;
    //PAN TEST
    const nomineproofregex1 = /^[A-Za-z]{5}[0-9]{4}[A-Za-z]$/;
    
    //Valid Driving License
    const nomineproofregex2 =
      /^(([A-Z]{2}[0-9]{2})( )|([A-Z]{2}-[0-9]{2}))((19|20)[0-9][0-9])[0-9]{7}$/;
    
    //AADHAAR
    const nomineproofregex3 = /^[0-9]{4}$/;

    //Valid Passport
    const nomineproofregex4 = /^[A-Za-z0-9](?:[A-Za-z0-9 -]*[A-Za-z0-9])?$/;

    // console.log('voter id'+  typeof pattern +' test '+ typeof this.NomineeOneProofResponse[0].Regex_Validation)

    // if (this.nomineeDetails.nomineeGuardianProofType) {
    //   this.NomineeGuar1Prooftype = false;
    // } else {
    //   this.NomineeGuar1Prooftype = true;
    // }
    console.log("PROOFTYPE --> ",prooftype)
    if (prooftype == 'PAN') {
      // this.NomineeGuar1adharmsg = false;
      if (
        !nomineproofregex1.test(proofno)
      ) {
        // this.NomineeGuar1ProofIdNo = true;
        //pan error message here
      } else {
        // this.NomineeGuar1ProofIdNo = false;
        return true;
      }
    }

    if (
      prooftype == 'VALID DRIVING LICENSE'
    ) {
      // this.NomineeGuar1adharmsg = false;

      if (
        !nomineproofregex2.test(proofno)
      ) {
        // this.NomineeGuar1ProofIdNo = true;
        //driver license error message here
      } else {
        // this.NomineeGuar1ProofIdNo = false;
        return true;
      }
    }

    // //AADHAAR
    if (prooftype == 'AADHAAR') {
      // this.Nominee1adharmsg = true
      // this.NomineeGuar1ProofIdNo = false;
      if (
        !nomineproofregex3.test(proofno)
      ) {
        // this.Nominee1ProofIdNo = true
        // this.NomineeGuar1adharmsg = true;
        // error message here
      } else {
        // this.NomineeGuar1adharmsg = false;
        return true;
      }
    }
    if (prooftype == 'VALID PASSPORT') {
      // this.Nominee1adharmsg = true
      // this.NomineeGuar1adharmsg = false;
      if (
        !nomineproofregex4.test(prooftype)
      ) {
        // this.Nominee1ProofIdNo = true
        // this.NomineeGuar1ProofIdNo = true;
        //error message here
      } else {
        // this.NomineeGuar1ProofIdNo = false;
        return true;
      }
    }
    return false;
  }

  //Function to cancel edit mode(unused).
  cancelEdit(): void {
    const isNew = this.editingIndex === this.nominees.length - 1 &&
                  this.nominees.at(this.editingIndex!)?.pristine;

    if (isNew) {
      this.nominees.removeAt(this.editingIndex!);
    }

    this.editingIndex = null;
  }
  
  //Function to remove Nominee from the existing list.
  removeNominee(index: number): void {
    this.nominees.removeAt(index);
    if (this.editingIndex === index) {
      this.editingIndex = null;
    }
  }

clearAllNominees(): void {
  this.nominees.clear(); // Removes all FormGroup controls from the FormArray
  this.editingIndex = null; // Reset editing index if needed
}

  //Function to edit Nominee (Unused).
  editNominee(index: number): void {
    this.editingIndex = index;
  }

  //Function to go back to list (Unused).
  backToList(): void {
    this.editingIndex = null;
  }

  //Final Onsubmit function.
  onSubmit(): void {
    let reqData: { 
      FormNumber:any,
      nomineeAddressType: any; 
      firstName: any; 
      lastName: any; 
      mobile: any; 
      email: any; 
      idProofType: any; 
      idProofNo: any; 
      relationship: any; 
      allocation: any; 
      isMinor: any; 
      dob: any; 
      sameAsApplicantAddress: any; 
      printInStatement: any; 
      address1: any; 
      address2: any; 
      address3: any; 
      pincode: any; 
      state: any; 
      city: any; 
      guardianSameAsApplicantAddress: any,
      guardianFirstName: any; 
      guardianLastName: any; 
      guardianRelationship: any; 
      guardianAddress1:any,
      guardianAddress2:any,
      guardianAddress3:any,
      guardianPincode:any,
      guardianState:any,
      guardianCity:any,
      guardianMobile:any,
      guardianEmail:any,
      guardianidProofType: any,
      guardianidProofNo: any,
      NomineeSelect: any,
      NomineeSelectID: any,
      amountPercent: any,
      amountRupees: any,
      guardiandob: any
    }[] = [];
      
    let count = 0;

    const nominees = this.nomineeForm.value.nominees; // Assuming nominees is a FormArray
    console.log("this.NomineeSelect", this.NomineeSelect)
    if (nominees && nominees.length > 0) {
      count = nominees.length;

      nominees.forEach((nominee: any) => {
        reqData.push({
          FormNumber: window.sessionStorage.getItem('FormNumber'),
          nomineeAddressType: nominee.nomineeAddressType,
          firstName: nominee.firstName,
          lastName: nominee.lastName,
          mobile: nominee.mobile,
          email: nominee.email,
          idProofType: nominee.idProofType,
          idProofNo: nominee.idProofNo,
          relationship: nominee.relationship,
          allocation: nominee.allocation,
          isMinor: nominee.isMinor,
          dob: nominee.dob,
          sameAsApplicantAddress: nominee.sameAsApplicantAddress,
          printInStatement: nominee.printInStatement,
          address1: nominee.address1,
          address2: nominee.address2,
          address3: nominee.address3,
          pincode: nominee.pincode,
          state: nominee.state,
          city: nominee.city,
          guardianSameAsApplicantAddress: nominee.guardianSameAsApplicantAddress,
          guardianFirstName: nominee.guardianFirstName,
          guardianLastName: nominee.guardianLastName,
          guardianRelationship: nominee.guardianRelationship,
          guardianAddress1:nominee.guardianAddress1,
          guardianAddress2:nominee.guardianAddress2,
          guardianAddress3:nominee.guardianAddress3,
          guardianPincode:nominee.guardianPincode,
          guardianState:nominee.guardianState,
          guardianCity:nominee.guardianCity,
          guardianMobile:nominee.guardianMobile,
          guardianEmail:nominee.guardianEmail,
          guardianidProofType: nominee.guardianidProofType,
          guardianidProofNo: nominee.guardianidProofNo,
          NomineeSelect: this.NomineeSelect?.name ?? '',
          NomineeSelectID: this.NomineeSelect?.id ?? '', 
          amountPercent: this.amountPercent,
          amountRupees: this.amountRupees,
          guardiandob: nominee.guardiandob
        });
      });

console.log("reqData",reqData)
          // Continue with your existing HTTP request and response handling...
    this.spinner.show();

    this._http
      .postRequest('api/v1/personalDetail/nomineesave', reqData)
      .subscribe((resp) => {
        let response: any = resp.body;
        this.spinner.hide();
        if (response.status == true) {
          response = JSON.parse(
            this.aesService.decrypt(response.data, this.clientid, this.clientid)
          );
          if (response[0].Msg === 'Data Save Sucessfully') {
            // this.toastr.success('Data Saved Successfully', 'Nominees', {
            //   positionClass: 'toast-bottom-center',
            //   timeOut: 2000,
            // });

            this.MoengageService.trackEvent('Nominee Submission', {
              product_id: window.sessionStorage.getItem('FormNumber') ?? '',
              Noof_NomineeAdded: count,
              product_name: 'Onboarding DIY',
              category: 'Nominee',
            });

            setTimeout(() => {
              this.router.navigate(['/esign']);
              this.spinner.hide();
            }, 200);
          } else if (
            response[0].Msg ===
            'Oops! Total percentage of share cannot be more or less than 100%. Please check the share of nominee and continue or optout from nomination'
          ) {
            this.MoengageService.trackEvent('Nominee Submission Error', {
              product_id: window.sessionStorage.getItem('FormNumber') ?? '',
              Noof_NomineeAdded: count,
              ErrorMsg: response[0].Msg,
              product_name: 'Onboarding DIY',
              category: 'Nominee',
            });

            this.toastr.success(response[0].Msg, 'Nominees', {
              positionClass: 'toast-bottom-center',
              timeOut: 4000,
            });

            //this.router.navigate(['/esign']);

            this.spinner.hide();
          } else {
            this.MoengageService.trackEvent('Nominee Submission Error', {
              product_id: window.sessionStorage.getItem('FormNumber') ?? '',
              Noof_NomineeAdded: count,
              ErrorMsg: response.message,
              product_name: 'Onboarding DIY',
              category: 'Nominee',
            });

            this.toastr.error('Something went wrong...', 'Nominees', {
              positionClass: 'toast-bottom-center',
              timeOut: 4000,
            });

            this.spinner.hide();

            return;
          }
        } else {
          if (
            response.message ===
            'Oops! Total percentage of share cannot be more or less than 100%. Please check the share of nominee and continue or optout from nomination'
          ) {
            this.MoengageService.trackEvent('Nominee Submission Error', {
              product_id: window.sessionStorage.getItem('FormNumber') ?? '',
              Noof_NomineeAdded: count,
              ErrorMsg: response.message,
              product_name: 'Onboarding DIY',
              category: 'Nominee',
            });

            this.toastr.success(response.message, 'Nominees', {
              positionClass: 'toast-bottom-center',
              timeOut: 4000,
            });

            //this.router.navigate(['/esign']);

            this.spinner.hide();
          } else {
            this.MoengageService.trackEvent('Nominee Submission Error', {
              product_id: window.sessionStorage.getItem('FormNumber') ?? '',
              Noof_NomineeAdded: count,
              ErrorMsg: response.message,
              product_name: 'Onboarding DIY',
              category: 'Nominee',
            });

            this.toastr.error(response.message, 'Nominees', {
              positionClass: 'toast-bottom-center',
              timeOut: 4000,
            });
          }
        }
      });
    }


  }
  getPersonalDataTwo() {
    this.spinner.show();
    var reqData = {
      flag: 'nominee',
      formnumber: window.sessionStorage.getItem('FormNumber'),
    };

    this._http
      .postRequest('api/v1/WorkflowDetails/getworkflowdata', reqData)
      .subscribe((resp) => {
        let response: any = resp.body;
        this.spinner.hide();
        if (response.status == true) {
          response = JSON.parse(
            this.aesService.decrypt(response.data, this.clientid, this.clientid)
          );

          if (resp.body.message === 'Data found') {
            console.log('response',response,response.length)
            var soh;

            if (response[0].IsNomineeSOH == 'True') {
              soh = true;
            } else {
              soh = false;
            }
            if (response && response.length>=1){
            // this.nominees.clear()
            this.removeNominee(0)
            for (let i = 0; i<response.length; i++) {
              console.log("for loop iter: ",i)
            const NewNom = this.createNominee();
            NewNom.patchValue({
              
            nomineeAddressType: response[i]?.nomineeAddressType ?? 'RI',
            firstName: response[i]?.NomTrdNameFir ?? '',
            lastName: response[i]?.NomTrdNameLas ?? '',
            mobile: response[i]?.NomTrdMobile ?? '',
            email: response[i]?.NomEmailID ?? '',
            idProofType: response[i]?.nomineeprooftype ?? '',
            idProofNo: response[i]?.nomineeproofnumber ?? '',
            relationship: response[i]?.NomTrdRelation ?? '',
            allocation: response[i]?.nomineepercentage??0,
            dob: response[i]?.NomtrdDOB,
            // dob: this.parseToDate(response[i]?.NomtrdDOB),

            sameAsApplicantAddress: response[i]?.sameAsApplicantNominee??false,
            printInStatement: soh,
            address1: response[i]?.NomTrdHousFlat,
            address2: response[i]?.NomtrdBuilStr,
            address3: response[i]?.NomTrdPosttown,
            pincode: response[i]?.NomTrdPincode,
            state: response[i]?.NomTrdState,
            city: response[i]?.NomTrdDistCity,
            guardianSameAsApplicantAddress: response[i]?.sameAsGuardianAddress??false,
            guardianFirstName: response[i]?.NomtrdNameGurFir,
            guardianLastName: response[i]?.NomtrdNameGurLas,
            guardianRelationship: response[i]?.NomTrdGurRelation,
            guardianAddress1:response[i]?.NomTrdGurHousFlat,
            guardianAddress2:response[i]?.NomtrdGurBuilStr,
            guardianAddress3:response[i]?.NomTrdGurPosttown,
            guardianPincode:response[i]?.NomTrdGurPincode,
            guardianState:response[i]?.NomTrdGurState,
            guardianCity:response[i]?.NomTrdGurDistCity,
            guardianMobile:response[i]?.NomTrdGurMobile,
            guardianEmail:response[i]?.NomTrdGurEmail,
            guardianidProofType: response[i]?.gurnomineeprooftype,
            guardianidProofNo: response[i]?.gurnomineeproofnumber,
            isMinor:response[i]?.isMinor,
            guardiandob:response[i]?.nomineeGuardiandob
            })
            this.NomineeSelect = { name: '', id: 0 };
            this.NomineeSelect.name = response[i]?.NomineeSelect
            this.NomineeSelect.id = response[i]?.NomineeSelectID
            this.amountPercent = response[i]?.AmountPercent
            this.amountRupees = response[i]?.AmountRupees

            this.nominees.push(NewNom);
            this.editingIndex = this.nominees.length - 1;
            this.setupConditionalValidation(); // Apply validation to new nominee
            // i = i+1
            }
            }

          }      
        }
      });
      console.log("NomineeSelect get",this.NomineeSelect)
      this.setupConditionalValidation();

  }


  parseToDate(input: string | Date): Date {
    const date = typeof input === 'string' ? new Date(input) : input;
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date input for p-calendar');
    }
    return date;
  }

  formatISOToDDMMYYYY(input: string | Date): string {
    if (!input) return '';
  
    // If it's already a Date object, format in UTC to avoid local timezone shifts
    if (input instanceof Date) {
      const y = input.getUTCFullYear();
      const m = String(input.getUTCMonth() + 1).padStart(2, '0');
      const d = String(input.getUTCDate()).padStart(2, '0');
      return `${d}/${m}/${y}`;
    }
  
    // If it's an ISO string like '2025-11-26T18:30:00.000Z'
    const iso = String(input);
    const datePart = iso.includes('T') ? iso.split('T')[0] : iso; // '2025-11-26'
    const [year, month, day] = datePart.split('-');               // ['2025','11','26']
    if (!year || !month || !day) return '';                       // basic guard
    return `${day}/${month}/${year}`;
  }
  

  //Function to redirect user to Nominee details page.
  redirectToTwo() {
    this.spinner.show();
    setTimeout(() => {
      this.PersonalFormOne = false;
      this.PersonalFormTwo = true;
      this.router.navigate(['/addNominee', 2]);
      this.editNominee(0);
      this.spinner.hide();
    }, 200);
  }

  //Function to redirect back to Nominee Main Page.
  BackToOne() {
    this.spinner.show();

    setTimeout(() => {
      this.PersonalFormOne = true;
      this.PersonalFormTwo = false;

      this.router.navigate(['/addNominee', 1]);

      this.spinner.hide();
    }, 200);
  }

  //Function to redirect to FAQ Page.
  faqHelpBtn(stageName: string) {
    const encodedStageName = btoa(stageName);
    window.location.href = `faq?stageName=${encodeURIComponent(
      encodedStageName
    )}`;
  }

  //Function to block unwanted characters.
  onKeyPress(event: KeyboardEvent) {
    const char = event.key;
    const regExp = /^[A-Za-z\s]$/;
    const emojiRegExp = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u;

    if (!regExp.test(char) || emojiRegExp.test(char)) {
      event.preventDefault();
    }
  }

  //Function to block unwanted characters including spaces.
  onKeyPressNS(event: KeyboardEvent) {
    
  if (event.key === ' ') {
    event.preventDefault(); // Block any space
  }

    const char = event.key;
    const regExp = /^[A-Za-z\s]$/;
    const emojiRegExp = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u;

    if (!regExp.test(char) || emojiRegExp.test(char)) {
      event.preventDefault();
    }
  }
  
  //Function to block unwanted characters.
  checkInput(event: any): void {
    let value = event.target.value;
    if (/^\s/.test(value)) {
      value = value.trimStart();
    }
    value = value.replace(/\s{2,}/g, ' ');
    // Remove any digits or special characters
    value = value.replace(/[^a-zA-Z\s]/g, '');
    event.target.value = value;
    //console.log('checkInput event value', value);
    // this.nomineeDetails.nomineefname = value;
  }

  //Function to Compare only First and Last Names.
  compareFirstAndLastName(name1: string, name2: string): boolean {
  const parts1 = name1.trim().split(/\s+/);
  const parts2 = name2.trim().split(/\s+/);

  if (parts1.length < 2 || parts2.length < 2) return false;

  const first1 = parts1[0].toLowerCase();
  const last1 = parts1[parts1.length - 1].toLowerCase();

  const first2 = parts2[0].toLowerCase();
  const last2 = parts2[parts2.length - 1].toLowerCase();

  return first1 === first2 && last1 === last2;
  }
  
  //Function to get Nominee Proof and Nominee Relation Lists.
  getNomineeGuardianDetails() {
    var reqData = {
      flag: 'all',
      rmloginid: '10882',
    };
    this._http.postRequest('api/v1/masters/get', reqData).subscribe((resp) => {
      let response: any = resp.body;
      if (response.status == true) {
        response = JSON.parse(
          this.aesService.decrypt(response.data, this.clientid, this.clientid)
        );
      }
      this.PersonalResponse = response;
      this.guardianListResponse = this.PersonalResponse.data3;
      this.NomineeOneResponse = this.PersonalResponse.data5;
      this.NomineeOneProofResponse = this.PersonalResponse.data4;

      // console.log('check nominee regex' + this.NomineeOneProofResponse[0].Regex_Validation)

      // this.CityStateResponse = this.PersonalResponse.data18;

      // this.NomineeTwoResponse = this.PersonalResponse.data3;
      // this.NomineeThreeResponse = this.PersonalResponse.data3;
    });
  }

  //Function to call Nominee Opt Out service(IDFY API)
  getNomineeIdfyURL() {
    this.spinner.show();
    var reqData = {
      formnumber: window.sessionStorage.getItem('FormNumber'),
      source: "DIY"

    };
    this._http.postRequestNominee('NomineeGetIdfy', reqData).subscribe((resp) => {
      let response: any = resp.body;
      if (response.status == true) {
        response = JSON.parse(
          this.aesService.decrypt(response.data, this.clientid, this.clientid)
        );
              // console.log("getNomineeIdfyURL: ", response.redirection_url)
          let redirectUrl = response.redirection_url;
          if (redirectUrl) {
            window.location.href = redirectUrl;
            setTimeout(() => {
              this.removeModal();
              // this.dismissSuccessModal();
              // this.clearDetails();
              this.spinner.hide();
            }, 2000);
          } else {
            this.toastr.warning("Something went wrong.", 'Warning', {
              positionClass: 'toast-bottom-center',
              timeOut: 2000,
            });
            this.removeModal();
            this.clearMobileOTPFields();
            this.clearTimer() 
            // this.dismissSuccessModal();
            // this.openAggregatorFailModal();
            // this.clearDetails();
            this.spinner.hide();
          }
    this.spinner.hide();

      }
      else{
            this.toastr.warning("Something went wrong.", 'Warning', {
              positionClass: 'toast-bottom-center',
              timeOut: 2000,
            });
            this.removeModal();
            this.clearMobileOTPFields();
            this.clearTimer();
            // this.dismissSuccessModal();
            // this.openAggregatorFailModal();
            // this.clearDetails();
            this.spinner.hide();
      }
      // console.log('check nominee regex' + this.NomineeOneProofResponse[0].Regex_Validation)

      // this.CityStateResponse = this.PersonalResponse.data18;

      // this.NomineeTwoResponse = this.PersonalResponse.data3;
      // this.NomineeThreeResponse = this.PersonalResponse.data3;
    this.spinner.hide();

    });
  }

  //Function to get Applicant Details such as Name and PAN.
  getNomineeDetails() {
      var reqData = {
        flag: 'GetNomineeDetails',
        FormNumber: window.sessionStorage.getItem('FormNumber'),
      };
      this._http
        .postRequest('api/v1/masters/get', reqData)
        .subscribe((resp) => {
          let response: any = resp.body;
          if (response.status == true) {
            response = JSON.parse(
              this.aesService.decrypt(
                response.data,
                this.clientid,
                this.clientid
              )
            );
            // console.log("Nominee Details", response.data[0].MobileNumber, response.data[0].ApplicantName, response.data[0].PAN)
            this.ApplicantName = response.data[0].ApplicantName;
            this.ApplicantMobile = response.data[0].MobileNumber;
            this.ApplicantPAN = response.data[0].PAN;

          }
        });

  }


  //Function to get datetime stamp.
  getNumericTimestamp(): string {
    const now = new Date();
    return (
      now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0') +
      now.getHours().toString().padStart(2, '0') +
      now.getMinutes().toString().padStart(2, '0') +
      now.getSeconds().toString().padStart(2, '0') +
      now.getMilliseconds().toString().padStart(3, '0')
    );
  }

  //Function to close modal.
  dismissTrackApplicationModal2() {
    const completeTrackApplication = document.getElementById('tracktimeline2');
    if (completeTrackApplication) {
      // completeTrackApplication.classList.remove('show');
      $('#tracktimeline2').modal('hide');
    }
    this.clearMobileOTPFields();
  }

  //Function to remove modal.
  removeModal() {
    const modalBackdrops = document.querySelectorAll('.modal-backdrop');
    modalBackdrops.forEach((backdrop) => {
      if (backdrop instanceof HTMLElement) {
        backdrop.remove();
        $('#mobileotp').modal('hide');
        // $('#emailotp').modal('hide');
        $('#email2faotp').modal('hide');
        $('#termsandcond').modal('hide');
        $('#tracktimeline2').modal('hide');
      }
    });
  }
  //Function to start OTP Timer
  startTimerMobile() {
    // this.clearTimer();
    let minute = 1;
    let seconds: number = minute * 30;
    let textSec: any = '0';
    let statSec: number = 30;
    this.displayMobile = `00:30`;
    const prefix = minute < 10 ? '0' : '';

    this.interval = setInterval(() => {
      seconds--;
      if (statSec != 0) statSec--;
      else statSec = 29;
      if (statSec < 10) {
        textSec = '0' + statSec;
      } else textSec = statSec;

      this.displayMobile = `${prefix}${Math.floor(seconds / 30)}:${textSec}`;

      if (seconds == 0) {
        this.timeroff = false;
        this.clearTimer();
      }
    }, 1000);
  }

  //Function to generate Mobile OTP.
  getMobileOtp(isRetry: boolean) {
    // window.localStorage.clear();
    // window.sessionStorage.clear();
    // this.clientid = "";
    this.clearMobileOTPFields();
    this.clearTimer();
    this.sendOtp.mobile = this.ApplicantMobile;
    this.sendOtp.fullname = this.ApplicantName
    if (this.sendOtp.mobile.length == 0) {
      this.mobileReq = true;
      return;
    } else if (this.sendOtp.mobile == null || this.sendOtp.mobile == '') {
      this.mobileDigitReq = false;
      this.mobileReq = true;
      return;
    } else if (this.sendOtp.mobile.length < 10) {
      this.mobileDigitReq = true;
      this.mobileReq = false;
      return;
    } else {
      this.mobileReq = false;
    }
    const reqData = {
      Flag: 'InsertOtpMobile',
      name_submitted: this.sendOtp.fullname,
      mobileno: this.sendOtp.mobile,
      emailid: this.sendOtp.email,
      isRetry: isRetry,
      utm_source: this.utm_source,
      utm_medium: this.utm_medium,
      utm_campaign: this.utm_campaign,
      formnumber: window.sessionStorage.getItem('FormNumber'),
    };

    // this.MoengageService.MoeInit();

    // window.sessionStorage.setItem('mobile', reqData.mobileno);
    // window.sessionStorage.setItem('NameSubmitted', reqData.name_submitted);
    this.spinner.show();
    this._http
      .postRequest('api/v1/personalDetail/nomineeoptout/otp/send', reqData)
      .subscribe((resp) => {
        let response: any = resp.body;
        if (response.status == true) {
          response = JSON.parse(
            this.aesService.decrypt(response.data, this.clientid, this.clientid)
          );
        }
        this.spinner.hide();
        this.mobileOTPResponse = response;
        this.startTimerMobile();
        this.timeroff = true;
        if (resp.body.status == true) {
          // var myModal = new bootstrap.Modal(
          //   document.getElementById('mobileotp')!
          // );
          // myModal.show();
          $('#mobileotp').modal('show');

          this.mobileReq = false;
          this.mobileDigitReq = false;
          // this.mainContent = false;
        } else if (resp.body.status == false) {
          if (response.message == 'Internal server error') {
            this.toastr.error(response.message, 'Error', {
              positionClass: 'toast-bottom-center',
              timeOut: 2000,
            });
            $('#mobileotp').modal('hide');
            this.spinner.hide();
          } else if (
            response.message ===
            'Your Mobile OTP request limit is exhausted, please retry to log in after 15 minutes'
          ) {
            $('#mobileotp').modal('hide');
            this.toastr.warning(response.message, 'Warning', {
              positionClass: 'toast-bottom-center',
              timeOut: 5000,
            });
            this.spinner.hide();
          } else {
            $('#mobileotp').modal('hide');
            this.toastr.warning(response.message, 'Warning', {
              positionClass: 'toast-bottom-center',
              timeOut: 5000,
            });
            this.clearMobileOTPFields();
          }
        }
      });
  }

  //Function to verify Mobile OTP.
  getMobileOtpVerify(isRetry: boolean) {
    this.spinner.show();
    let Fullname = sessionStorage.getItem('NameSubmitted');

    let otpFieldMobile = this.otpFieldMobile;

    if (otpFieldMobile == '') {
      this.toastr.info('Please enter the OTP', 'Info', {
        positionClass: 'toast-bottom-center',
        timeOut: 2000,
      });
      this.isMobileVerifyBtn = true;
      return;
    }
    this.isWrongOTP = false;
    this.isRightOTP = false;
    this.isMobileVerifyBtn = false;

    const reqData = {
      Flag: 'VerifyOTPMobile',
      mobileno: this.sendOtp.mobile,
      emailid: this.sendOtp.email,
      name_submitted: Fullname,
      isRetry: isRetry,
      otp: otpFieldMobile,
      utm_source: this.utm_source,
      utm_medium: this.utm_medium,
      utm_campaign: this.utm_campaign,
      formnumber: window.sessionStorage.getItem('FormNumber'),
    };
    this._http
      .postRequest('api/v1/personalDetail/nomineeoptout/otp/verify', reqData)
      .subscribe((resp) => {
        let response: any = resp.body;
        //console.log('response', response);

        this.spinner.hide();

        if (response.status == true) {
          response = JSON.parse(
            this.aesService.decrypt(response.data, this.clientid, this.clientid)
          );
        } else {
          response = JSON.parse(
            this.aesService.decrypt(response.data, this.clientid, this.clientid)
          );
        }


        if (
          resp.body.message == 'OTP Verify successfully' &&
          resp.body.status == true
        ) {

          var ts = this.getNumericTimestamp();

          console.log(this.sendOtp.mobile + ts);

          const mobileOtpModal = document.getElementById('mobileotp');
          if (mobileOtpModal) {
          this.isRightOTP = true;
          this.clearTimer();
          $('#mobileotp').modal('hide');
          this.clearMobileOTPFields();

          this.removeModal();

          this.router.navigate(['/nominee-optout',1]);
          // this.getNomineeIdfyURL()

          this.dismissTrackApplicationModal2();
          }
        } else {
          if (response.Table[0].Msg == 'Internal server error') {
            this.toastr.error(response.Table[0].statusText, 'Error', {
              positionClass: 'toast-bottom-center',
              timeOut: 2000,
            });
          } else if (response.Table[0].Msg == 'OTP Limit Exceeded') {
            this.toastr.warning(response.Table[0].Msg, 'Warning', {
              positionClass: 'toast-bottom-center',
              timeOut: 2000,
            });
          } else if (response.Table[0].Msg == 'Wrong Otp') {
            this.isWrongOTP = true;
            this.isRightOTP = false;
          } else {
            this.clearMobileOTPFields();
            this.toastr.info(response.Table[0].Msg, 'Info', {
              positionClass: 'toast-bottom-center',
              timeOut: 2000,
            });
            this.isWrongOTP = false;
            this.isRightOTP = false;
          }
        }

      });
  }

  //Function to Clear Mobile OTP Fields.
  clearMobileOTPFields() {
    // this.mainContent = false;
    if (this.otpFieldMobile) {
      this.otpMobileInput.setValue('');
      this.otpFieldMobile = '';
      this.isRightOTP = false;
      this.isWrongOTP = false;
    }
    this.clearTimer();
  }

  //Function to Reset Timer.
  clearTimer() {
    // this.mainContent = true;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.timeLeft = 30;
  }

  //Function to control OTP OnInput.
  onOtpChangeMobile(otpMobile: string) {
    this.zone.run(() => {
      this.otpFieldMobile = otpMobile;
      this.checkIfAllOTPMobileFilled();
      this.cdr.detectChanges();
    });
  }

  checkIfAllOTPMobileFilled() {
    const isComplete = this.otpFieldMobile?.length === 6;
    this.isMobileVerifyBtn = !isComplete;

    if (isComplete) {
      this.isWrongOTP = false;
      this.isRightOTP = false;
    } else {
      this.isWrongOTP = false;
      this.isRightOTP = false;
    }
  }


}


  //----------------BIN----------------

// saveNominee(): void {
//   const nomineeGroup = this.nominees.at(this.editingIndex!);
//   if (nomineeGroup.valid) {
//     this.editingIndex = null;
//   } else {
//     nomineeGroup.markAllAsTouched();
//   }
// }

// cancelEdit(): void {
//   const isNew = this.editingIndex === this.nominees.length - 1 &&
//                 this.nominees.at(this.editingIndex!)?.pristine;

//   if (isNew) {
//     this.nominees.removeAt(this.editingIndex!);
//   }

//   this.editingIndex = null;
// }


//Function for dynamic validations such as Minor validations (old).
//   setupConditionalValidation1(): void {

// this.nominees.controls.forEach((control, index) => {
//   const group = control as FormGroup;

//   group.get('isMinor')?.valueChanges.subscribe((isMinor: boolean) => {
//     const dob = group.get('dob');
//     const guardianFields = [
//       'guardianFirstName', 'guardianLastName', 'guardianMobile', 'guardianEmail',
//       'guardianIdProofType', 'guardianIdProofNo', 'guardianRelationship'
//     ];

//     if (isMinor) {
//       dob?.setValidators([Validators.required]);
//       guardianFields.forEach(field => {
//         group.get(field)?.setValidators([Validators.required]);
//       });
//     } else {
//       dob?.clearValidators();
//       guardianFields.forEach(field => {
//         group.get(field)?.clearValidators();
//       });
//     }

//     dob?.updateValueAndValidity();
//     guardianFields.forEach(field => group.get(field)?.updateValueAndValidity());
//   });

//   group.get('sameAsApplicantAddress')?.valueChanges.subscribe((same: boolean) => {
//     const addressFields = ['address1', 'address2', 'address3', 'pincode', 'state', 'city'];
//     if (!same) {
//       addressFields.forEach(field => {
//         group.get(field)?.setValidators([Validators.required]);
//       });
//     } else {
//       addressFields.forEach(field => {
//         group.get(field)?.clearValidators();
//       });
//     }
//     addressFields.forEach(field => group.get(field)?.updateValueAndValidity());
//   });

//   group.get('guardianSameAsApplicantAddress')?.valueChanges.subscribe((same: boolean) => {
//     const guardianAddressFields = [
//       'guardianAddress1', 'guardianAddress2', 'guardianAddress3',
//       'guardianPincode', 'guardianState', 'guardianCity'
//     ];
//     if (!same) {
//       guardianAddressFields.forEach(field => {
//         group.get(field)?.setValidators([Validators.required]);
//       });
//     } else {
//       guardianAddressFields.forEach(field => {
//         group.get(field)?.clearValidators();
//       });
//     }
//     guardianAddressFields.forEach(field => group.get(field)?.updateValueAndValidity());
//   });
// });

//   }
  //Function to validate Nominee Proof (Incomplete).
  // NomineeProofValidator() {
  //   // const nomineproofregex1 = this.NomineeOneProofResponse[0].Regex_Validation;
  //   // const nomineproofregex2 = this.NomineeOneProofResponse[1].Regex_Validation;
  //   // const nomineproofregex3 = this.NomineeOneProofResponse[2].Regex_Validation;

  //   const nomineproofregex1 = /^[A-Za-z]{5}[0-9]{4}[A-Za-z]$/;
  //   // const nomineproofregex2 = /^[A-Za-z]{2}[0-9A-Za-z]{8}$/;
  //   const nomineproofregex2 =
  //     /^(([A-Z]{2}[0-9]{2})( )|([A-Z]{2}-[0-9]{2}))((19|20)[0-9][0-9])[0-9]{7}$/;
  //   const nomineproofregex3 = /^[0-9]{4}$/;
  //   const nomineproofregex4 = /^[A-Za-z0-9](?:[A-Za-z0-9 -]*[A-Za-z0-9])?$/;

  //   // console.log('voter id'+  typeof pattern +' test '+ typeof this.NomineeOneProofResponse[0].Regex_Validation)

  //   if (this.nomineeDetails3.nomineeprooftype) {
  //     this.Nominee3Prooftype = false;
  //   } else {
  //     this.Nominee3Prooftype = true;
  //   }

  //   if (this.nomineeDetails3.nomineeprooftype == 'Pan') {
  //     this.Nominee3adharmsg = false;
  //     if (!nomineproofregex1.test(this.nomineeDetails3.nomineeproofnumber)) {
  //       this.Nominee3ProofIdNo = true;
  //     } else {
  //       this.Nominee3ProofIdNo = false;
  //       return true;
  //     }
  //   }

  //   if (this.nomineeDetails3.nomineeprooftype == 'Valid Driving License') {
  //     this.Nominee3adharmsg = false;
  //     if (!nomineproofregex2.test(this.nomineeDetails3.nomineeproofnumber)) {
  //       this.Nominee3ProofIdNo = true;
  //     } else {
  //       this.Nominee3ProofIdNo = false;
  //       return true;
  //     }
  //   }

  //   if (this.nomineeDetails3.nomineeprooftype == 'Aadhaar') {
  //     // this.Nominee3adharmsg = true
  //     this.Nominee3ProofIdNo = false;

  //     if (!nomineproofregex3.test(this.nomineeDetails3.nomineeproofnumber)) {
  //       // this.Nominee3ProofIdNo = true
  //       this.Nominee3adharmsg = true;
  //     } else {
  //       this.Nominee3adharmsg = false;
  //       return true;
  //     }
  //   }
  //   if (this.nomineeDetails3.nomineeprooftype == 'Valid Passport') {
  //     // this.Nominee1adharmsg = true
  //     this.Nominee3adharmsg = false;

  //     if (!nomineproofregex4.test(this.nomineeDetails3.nomineeproofnumber)) {
  //       // this.Nominee1ProofIdNo = true
  //       this.Nominee3ProofIdNo = true;
  //     } else {
  //       this.Nominee3ProofIdNo = false;
  //       return true;
  //     }
  //   }

  //   return false;
  // }

  //----------------Nominee Opt Out Functions----------------

  //Function to Call Create Mobile OTP API and to open Mobile OTP Modal.   
  // getMobileOtp(isRetry: boolean) {
  //   window.localStorage.clear();
  //   window.sessionStorage.clear();
  //   this.clientid = "";

  //   this.clearTimer();
  //   this.clearMobileOTPFields();
  //   if (this.sendOtp.mobile.length == 0) {
  //     this.mobileReq = true;
  //     return;
  //   } else if (this.sendOtp.mobile == null || this.sendOtp.mobile == '') {
  //     this.mobileDigitReq = false;
  //     this.mobileReq = true;
  //     return;
  //   } else if (this.sendOtp.mobile.length < 10) {
  //     this.mobileDigitReq = true;
  //     this.mobileReq = false;
  //     return;
  //   } else {
  //     this.mobileReq = false;
  //   }
  //   const reqData = {
  //     Flag: 'InsertOtpMobile',
  //     name_submitted: this.sendOtp.fullname,
  //     mobileno: this.sendOtp.mobile,
  //     emailid: this.sendOtp.email,
  //     isRetry: isRetry,
  //     utm_source: this.utm_source,
  //     utm_medium: this.utm_medium,
  //     utm_campaign: this.utm_campaign,
  //   };

  //   this.MoengageService.MoeInit();

  //   window.sessionStorage.setItem('mobile', reqData.mobileno);
  //   window.sessionStorage.setItem('NameSubmitted', reqData.name_submitted);
  //   this.spinner.show();
  //   this._http
  //     .postRequest('api/v1/oauth/service/otp/send', reqData)
  //     .subscribe((resp) => {
  //       let response: any = resp.body;
  //       if (response.status == true) {
  //         response = JSON.parse(
  //           this.aesService.decrypt(response.data, this.clientid, this.clientid)
  //         );
  //       }
  //       this.spinner.hide();
  //       this.mobileOTPResponse = response;
  //       this.startTimerMobile();
  //       this.timeroff = true;
  //       if (resp.body.status == true) {
  //         // var myModal = new bootstrap.Modal(
  //         //   document.getElementById('mobileotp')!
  //         // );
  //         // myModal.show();
  //         $('#mobileotp').modal('show');

  //         this.mobileReq = false;
  //         this.mobileDigitReq = false;
  //         // this.mainContent = false;
  //       } else if (resp.body.status == false) {
  //         if (response.message == 'Internal server error') {
  //           this.toastr.error(response.message, 'Error', {
  //             positionClass: 'toast-bottom-center',
  //             timeOut: 2000,
  //           });
  //           $('#mobileotp').modal('hide');
  //           this.spinner.hide();
  //         } else if (
  //           response.message ===
  //           'Your Mobile OTP request limit is exhausted, please retry to log in after 15 minutes'
  //         ) {
  //           $('#mobileotp').modal('hide');
  //           this.toastr.warning(response.message, 'Warning', {
  //             positionClass: 'toast-bottom-center',
  //             timeOut: 5000,
  //           });
  //           this.spinner.hide();
  //         } else {
  //           $('#mobileotp').modal('hide');
  //           this.toastr.warning(response.message, 'Warning', {
  //             positionClass: 'toast-bottom-center',
  //             timeOut: 5000,
  //           });
  //           this.clearMobileOTPFields();
  //         }
  //       }
  //     });
  // }

  //   setupConditionalValidation(): void {
  //   // var stateName = '';
  //   //Function for dynamic validations such as Minor validations. 
  //   this.nominees.controls.forEach((control, index) => {
  //     const group = control as FormGroup;

  //   // group.get('dob')?.valueChanges.subscribe((dobValue: string) => {
  //   //   console.log("dobValue", dobValue)
  //   //   const dob = new Date(dobValue);
  //   //   const today = new Date();
      
  //   //   // const age = today.getFullYear() - dob.getFullYear();
      
  //   //   let age = today.getFullYear() - dob.getFullYear();
  //   //   const monthDiff = today.getMonth() - dob.getMonth();
  //   //   const dayDiff = today.getDate() - dob.getDate();

  //   //   // Adjust age if birthday hasn't occurred yet this year
  //   //   if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
  //   //     age--;
  //   //   }

  //   //   // console.log("AGE: ",age)
  //   //   const guardianFields = [
  //   //     'guardianFirstName', 'guardianLastName', 'guardianRelationship'
  //   //     ];
  //   //     console.log("age", age)
  //   //   if (age < 18) {
  //   //     // this.isMinor=true;
  //   //     group.get('isMinor')?.setValue(true);
  //   //     guardianFields.forEach(field => {
  //   //       group.get(field)?.setValidators([Validators.required]);
  //   //     });
  //   //   } else {
  //   //     // this.isMinor=false;
  //   //     const guardianClearFields = [
  //   //     'guardianFirstName', 'guardianLastName', 'guardianRelationship','guardianAddress1','guardianAddress2','guardianAddress3','guardianPincode','guardianState',
  //   //     'guardianCity','guardianMobile','guardianEmail','guardianidProofType','guardianidProofNo','guardianSameAsApplicantAddress'
  //   //     ];

  //   //     group.get('isMinor')?.setValue(false);
  //   //     guardianFields.forEach(field => {
  //   //       group.get(field)?.clearValidators();
  //   //       group.get(field)?.setValue('');
  //   //     });
  //   //     guardianClearFields.forEach(field => {
  //   //       group.get(field)?.clearValidators();
  //   //       group.get(field)?.setValue('');
  //   //     });
  //   //   }

  //   //   guardianFields.forEach(field => group.get(field)?.updateValueAndValidity());
  //   // });

    
  //   group.get('dob')?.valueChanges.subscribe((dobValue: string) => {
  //     const isMinor = this.computeIsMinor(dobValue);
  //     this.toggleMinorValidators(group, isMinor);
  //   });

  //   group.get('pincode')?.valueChanges.subscribe((pincode: string) => {
  //     console.log("PINCODE values: ",pincode)
  //   if (pincode!=null){
  //     if (pincode.length== 6){
  //       // group.get('state')?.setValue(this.GetStateandCity(pincode));
  //       // group.get('state')?.updateValueAndValidity()
  //       let stateName =  this.GetStateandCity(pincode,group);
  //       // console.log("stateName",stateName)
  //       // group.get('state')?.reset()
  //       // group.get('state')?.patchValue({
  //       //   state: stateName,

  //       // });

        
  //     }
  //   }

    


  //   });
  //   group.get('guardianPincode')?.valueChanges.subscribe((pincode: string) => {
  //     console.log("PINCODE values: ",pincode)
  //   if(pincode!=null){
  //     if (pincode.length== 6){
  //       // group.get('state')?.setValue(this.GetStateandCity(pincode));
  //       // group.get('state')?.updateValueAndValidity()
  //       let stateName =  this.GetGuardianStateandCity(pincode,group);
  //       // console.log("stateName",stateName)
  //       // group.get('state')?.reset()
  //       // group.get('state')?.patchValue({
  //       //   state: stateName,

  //       // });

        
  //     }
  //   }

    


  //   });
    


  //   // Handle sameAsApplicantAddress toggle
  //   group.get('sameAsApplicantAddress')?.valueChanges.subscribe((same: boolean) => {
  //     const addressFields = ['address1', 'address2', 'address3', 'pincode', 'state', 'city'];
  //     if (!same) {
  //       addressFields.forEach(field => {
  //         group.get(field)?.setValidators([Validators.required]);
  //       });
  //       // , Validators.min(3),Validators.max(55)
  //     } else {
  //       addressFields.forEach(field => {
  //         group.get(field)?.clearValidators();
  //         group.get(field)?.setValue('');
  //       });
  //     }
  //     addressFields.forEach(field => group.get(field)?.updateValueAndValidity());
  //   });

  //   group.get('guardianSameAsApplicantAddress')?.valueChanges.subscribe((same: boolean) => {
  //     const guardianAddressFields = [
  //       'guardianAddress1', 'guardianAddress2', 'guardianAddress3',
  //       'guardianPincode', 'guardianState', 'guardianCity'
  //     ];
  //     if (!same) {
  //       guardianAddressFields.forEach(field => {
  //         group.get(field)?.setValidators([Validators.required]);
  //       });
  //     } else {
  //       guardianAddressFields.forEach(field => {
  //         group.get(field)?.clearValidators();
  //         group.get(field)?.setValue('');
  //       });
  //     }
  //     guardianAddressFields.forEach(field => group.get(field)?.updateValueAndValidity());
  //   });


  //   //Handle Mobile Number Validation based on Nominee Resident Type
  // group.get('nomineeAddressType')?.valueChanges.subscribe((type: string) => {
  //   const mobileControl = group.get('mobile');
  //   // const guardianMobileControl = group.get('guardianMobile');

  //   if (type === 'RI') {
  //     const validators1 = [
  //       Validators.required,
  //       Validators.pattern(/^[6-9]\d{9}$/)
  //     ];
  //   //   const validators2 = [
  //   //  this.conditionalRequired(),
  //   //     Validators.pattern(/^[6-9]\d{9}$/)
  //   //   ];
  //     mobileControl?.setValidators(validators1);
  //     // guardianMobileControl?.setValidators(validators2);
  //   } else if (type === 'NRI') {
  //     const validators1 = [
  //       Validators.required,
  //       Validators.pattern(/^\d{5,20}$/)
  //     ];
  //   //   const validators2 = [
  //   // this.conditionalRequired(),
  //   //     Validators.pattern(/^\d{6,20}$/)
  //   //   ];
  //     mobileControl?.setValidators(validators1);
  //     // guardianMobileControl?.setValidators(validators2);
  //   }

  //   mobileControl?.updateValueAndValidity();
  //   // guardianMobileControl?.updateValueAndValidity();
  // });



  //   });
  // }
  



//slslslsls
//   setupConditionalValidation(): void {

  
//   // Function for dynamic validations such as Minor validations.
//   this.nominees.controls.forEach((control) => {
//     const group = control as FormGroup;

//     const allocationCtrl = group.get('allocation');
//     if (allocationCtrl) {
//       allocationCtrl.valueChanges.subscribe((val) => {
//         // Convert to number safely
//         const num = typeof val === 'number' ? val : Number(val);

//         // If not a number (empty or invalid string), do nothing—validators will handle it
//         if (isNaN(num)) {
//           return;
//         }

//         let clamped = num;
//         if (num > 100) clamped = 100;
//         else if (num < 0) clamped = 0;

//         // Only set if we actually changed it (prevents cursor jump loops)
//         if (clamped !== num) {
//           allocationCtrl.setValue(clamped, { emitEvent: false });
//           allocationCtrl.updateValueAndValidity({ emitEvent: false });
//         }
//       });
//     } else {
//       console.warn('Form control not found: allocation');
//     }

//     // Minor handling using your helper functions
//     group.get('dob')?.valueChanges.subscribe((dobValue: string) => {
//       const isMinor = this.computeIsMinor(dobValue);
//       this.toggleMinorValidators(group, isMinor);
//     });

//     // Auto-fill state/city from pincode
//     group.get('pincode')?.valueChanges.subscribe((pincode: string) => {
//       if (pincode != null && pincode.length === 6) {
//         this.GetStateandCity(pincode, group);
//       }
//     });

//     group.get('guardianPincode')?.valueChanges.subscribe((pincode: string) => {
//       if (pincode != null && pincode.length === 6) {
//         this.GetGuardianStateandCity(pincode, group);
//       }
//     });

//     // Handle sameAsApplicantAddress toggle
//     group.get('sameAsApplicantAddress')?.valueChanges.subscribe((same: boolean) => {
//       const addressFields = ['address1', 'address2', 'address3', 'pincode', 'state', 'city'];
//       if (!same) {
//         addressFields.forEach(field => {
//           group.get(field)?.setValidators([Validators.required]);
//         });
//       } else {
//         addressFields.forEach(field => {
//           group.get(field)?.clearValidators();
//           group.get(field)?.setValue('');
//         });
//       }
//       addressFields.forEach(field => group.get(field)?.updateValueAndValidity({ emitEvent: false }));
//     });

//     // Handle guardianSameAsApplicantAddress toggle
//     group.get('guardianSameAsApplicantAddress')?.valueChanges.subscribe((same: boolean) => {
//       const guardianAddressFields = [
//         'guardianAddress1', 'guardianAddress2', 'guardianAddress3',
//         'guardianPincode', 'guardianState', 'guardianCity'
//       ];
//       if (!same) {
//         guardianAddressFields.forEach(field => {
//           group.get(field)?.setValidators([Validators.required]);
//         });
//       } else {
//         guardianAddressFields.forEach(field => {
//           group.get(field)?.clearValidators();
//           group.get(field)?.setValue('');
//         });
//       }
//       guardianAddressFields.forEach(field => group.get(field)?.updateValueAndValidity({ emitEvent: false }));
//     });

//     // Handle Mobile Number Validation based on Nominee Resident Type
//     const addressTypeCtrl = group.get('nomineeAddressType');
//     const mobileCtrl = group.get('mobile');
//     // const guardianMobileCtrl = group.get('guardianMobile'); // if needed later

//     if (!addressTypeCtrl || !mobileCtrl) {
//       console.warn('Form controls not found: nomineeAddressType or mobile');
//       return;
//     }

//     addressTypeCtrl.valueChanges.subscribe((type: string) => {
//       if (type === 'RI') {
//         // RI: Indian mobile - required, exactly 10 digits, start 6–9
//         mobileCtrl.setValidators([
//           Validators.required,
//           Validators.pattern(/^[6-9]\d{9}$/),
//           Validators.minLength(10),
//           Validators.maxLength(10),
//         ]);

//         // If you need guardian mobile with conditional required for RI
//         // guardianMobileCtrl?.setValidators([
//         //   this.conditionalRequired(),
//         //   Validators.pattern(/^[6-9]\d{9}$/),
//         //   Validators.minLength(10),
//         //   Validators.maxLength(10),
//         // ]);

//       } else if (type === 'NRI') {
//         // NRI: required, digits only, 5–20 length
//         mobileCtrl.setValidators([
//           Validators.required,
//           Validators.pattern(/^\d+$/),
//           Validators.minLength(5),
//           Validators.maxLength(20),
//         ]);

//         // If you need guardian mobile with conditional required for NRI
//         // guardianMobileCtrl?.setValidators([
//         //   this.conditionalRequired(),
//         //   Validators.pattern(/^\d+$/),
//         //   Validators.minLength(6),
//         //   Validators.maxLength(20),
//         // ]);
//       } else {
//         // Unknown type: clear validators to avoid false errors
//         mobileCtrl.clearValidators();
//         // guardianMobileCtrl?.clearValidators();
//       }

//       // Re-validate after changing validators without re-emitting valueChanges
//       mobileCtrl.updateValueAndValidity({ emitEvent: false });
//       // guardianMobileCtrl?.updateValueAndValidity({ emitEvent: false });
//     });

//     // Initialize validators based on the current type once
//     const currentType = addressTypeCtrl.value as 'RI' | 'NRI';
//     addressTypeCtrl.setValue(currentType, { emitEvent: true });
//   });
// }