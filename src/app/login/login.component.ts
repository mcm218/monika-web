import { Component, OnInit, DebugElement } from "@angular/core";
import { faDiscord } from "@fortawesome/free-brands-svg-icons";
import { AuthService } from "../auth.service";
import { environment } from "src/environments/environment";
import { IpcRenderer } from 'electron';

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.css"]
})
export class LoginComponent implements OnInit {
  faDiscord = faDiscord;
  private ipc: IpcRenderer
  private id: number;
  discordUrl;
  constructor(private auth: AuthService) {
    if ((<any>window).require) {
      try {
        this.ipc = (<any>window).require('electron').ipcRenderer;
      } catch (e) {
        throw e;
      }
    } else {
      console.log('App not running inside Electron!');
    }
    var url = window.location.href.split("?")[0];
    if (url.search("file://") != -1) {
      this.id = Date.now();
      // Running from Electron
      this.discordUrl =
        "https://discordapp.com/api/oauth2/authorize?client_id=" +
        environment.discordData.client_id +
        "&redirect_uri=" +
        "https://monika-music.web.app/auth" +
        "&state=" +
        this.id +
        "&response_type=code&scope=identify%20guilds";
    } else {
      // Running from web
      this.discordUrl =
        "https://discordapp.com/api/oauth2/authorize?client_id=" +
        environment.discordData.client_id +
        "&redirect_uri=" +
        url +
        "&response_type=code&scope=identify%20guilds";
    }
  }

  ngOnInit() { }

  authDiscord() {
    if (this.ipc) {
      // Save Auth Type (Discord) to users/id
      this.auth.desktopAuthorize(this.id.toString(), "discord");
      this.ipc.send("openAuthWindow", this.discordUrl);
    } else {
      window.open(this.discordUrl, "_self");
    }
  }
}
