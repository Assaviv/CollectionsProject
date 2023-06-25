import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { LoginService } from './login.service';
import { Router } from '@angular/router';

@Component({
  selector: 'collections-ui-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  validationMap: Map<string, string> = new Map();
  
  constructor(private fb: FormBuilder, private loginService: LoginService, private router: Router) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(10)]],
      password: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(10)]]
    });
  }

  ngOnInit(): void {
    this.validationMap.set("required", " is required.");
    this.validationMap.set("minlength", " is too short.");
    this.validationMap.set("maxlength", " is too long.");
  }
  
  
  private get username() : string {
    return this.loginForm.get('username')?.value;
  }
  
  
  private get password() : string {
    return this.loginForm.get('password')?.value;
  }
  
  
  login() {
    if (this.loginService.validate(this.username, this.password)) {
      console.log("Success");
      this.router.navigateByUrl('/home');
    } else {
      console.log(this.username, this.password);
      
    }
  }

  signUp() {
    this.loginService.addUser(this.username, this.password)
  }
  
  isFieldValid(fieldName: string): string {
    const field = this.loginForm.get(fieldName)    
    let error = "";
    
    this.validationMap.forEach((errorMessage: string, validator: string) => {
      if (field?.hasError(validator) && field?.touched || false) {  
        error = fieldName + errorMessage;
        
        return;
      }

    })

    return error;
  }
}
