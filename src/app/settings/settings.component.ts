import { Component, OnInit } from "@angular/core";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { faYoutube, faSpotify } from "@fortawesome/free-brands-svg-icons";
import { environment } from "src/environments/environment";
import { DbService } from "../db.service";
import { IpcRenderer } from 'electron';
import { AuthService } from '../auth.service';

@Component({
  selector: "app-settings",
  templateUrl: "./settings.component.html",
  styleUrls: ["./settings.component.css"]
})
export class SettingsComponent implements OnInit {
  faYoutube = faYoutube;
  faSpotify = faSpotify;
  faTimes = faTimes;

  private ipc: IpcRenderer
  private id: number;

  spotifyPath = "https://accounts.spotify.com/authorize";
  spotifyUrl: string;
  youtubePath = "https://accounts.google.com/o/oauth2/v2/auth";
  youtubeUrl: string;
  constructor(private db: DbService, private auth: AuthService) {
    if ((<any>window).require) {
      console.log("Setting up IPC...");
      try {
        this.ipc = (<any>window).require('electron').ipcRenderer;
      } catch (e) {
        throw e;
      }
    } else {
      console.log('App not running inside Electron!');
    }
    const url = window.location.href.split("?")[0];
    if (url.search("file://") != -1) {
      console.log("Getting URLs for electron...");
      // Running from Electron
      this.id = Date.now();
      var spotifyRequestPath = (this.spotifyPath +=
        "?client_id=" + environment.spotifyData.client_id);
      spotifyRequestPath += "&response_type=code&access_type=offline";
      spotifyRequestPath += "&redirect_uri=" + "https://monika-music.web.app/auth"
      spotifyRequestPath += "&state=" + this.id;
      spotifyRequestPath += "&scope=" + environment.spotifyData.scope;
      this.spotifyUrl = spotifyRequestPath;

      var youtubeRequestPath = (this.youtubePath +=
        "?client_id=" + environment.youtubeData.client_id);
      youtubeRequestPath += "&redirect_uri=" + "https://monika-music.web.app/auth";
      youtubeRequestPath += "&state=" + this.id;
      youtubeRequestPath += "&response_type=code&access_type=offline";
      youtubeRequestPath +=
        "&scope=https%3A//www.googleapis.com/auth/youtube.readonly";
      this.youtubeUrl = youtubeRequestPath;
    } else {
      // Running from web
      var spotifyRequestPath = (this.spotifyPath +=
        "?client_id=" + environment.spotifyData.client_id);
      spotifyRequestPath += "&response_type=code&access_type=offline";
      spotifyRequestPath += "&redirect_uri=" + url;
      spotifyRequestPath += "&scope=" + environment.spotifyData.scope;
      this.spotifyUrl = spotifyRequestPath;

      var youtubeRequestPath = (this.youtubePath +=
        "?client_id=" + environment.youtubeData.client_id);
      youtubeRequestPath += "&redirect_uri=" + url;
      youtubeRequestPath += "&response_type=code&access_type=offline";
      youtubeRequestPath +=
        "&scope=https%3A//www.googleapis.com/auth/youtube.readonly";
      this.youtubeUrl = youtubeRequestPath;
    }

  }

  ngOnInit() { }

  authSpotify() {
    if (this.ipc) {
      console.log("Opening new window");
      this.auth.desktopAuthorize(this.id.toString(), "spotify");
      this.ipc.send("openAuthWindow", this.spotifyUrl);
    } else {
      window.open(this.spotifyUrl, "_self");
    }
  }

  authYoutube() {
    if (this.ipc) {
      this.auth.desktopAuthorize(this.id.toString(), "youtube");
      this.ipc.send("openAuthWindow", this.youtubeUrl);
    } else {
      window.open(this.youtubeUrl, "_self");
    }
  }

  back() {
    this.db.toggleSettings();
  }
}
