import { Component, OnInit } from "@angular/core";
import { faDiscord } from "@fortawesome/free-brands-svg-icons";
import { AuthService } from '../auth.service';
@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.css"]
})
export class LoginComponent implements OnInit {
  faDiscord = faDiscord;
  constructor(private auth: AuthService) {}

  ngOnInit() {}

  authenticate(){
    this.auth.authenticate();
  }
}
