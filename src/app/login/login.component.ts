import { Component, OnInit } from "@angular/core";
import { faDiscord } from "@fortawesome/free-brands-svg-icons";
import { AuthService } from "../auth.service";
import { environment } from "src/environments/environment";
@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.css"]
})
export class LoginComponent implements OnInit {
  faDiscord = faDiscord;
  discordUrl;
  constructor(private auth: AuthService) {}

  ngOnInit() {
    var url = window.location.href.split("?")[0];
    this.discordUrl =
      "https://discordapp.com/api/oauth2/authorize?client_id=" +
      environment.discordData.client_id +
      "&redirect_uri=" +
      url +
      "&response_type=code&scope=identify%20guilds";
  }
}
