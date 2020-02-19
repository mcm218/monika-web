import { Component, OnInit } from "@angular/core";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { faYoutube, faSpotify } from "@fortawesome/free-brands-svg-icons";
import { environment } from "src/environments/environment";
import { DbService } from "../db.service";
@Component({
  selector: "app-settings",
  templateUrl: "./settings.component.html",
  styleUrls: ["./settings.component.css"]
})
export class SettingsComponent implements OnInit {
  faYoutube = faYoutube;
  faSpotify = faSpotify;
  faTimes = faTimes;

  spotifyPath = "https://accounts.spotify.com/authorize";
  spotifyUrl: string;
  youtubePath = "https://accounts.google.com/o/oauth2/v2/auth";
  youtubeUrl: string;
  constructor(private db: DbService) {
    const url = window.location.href.split("?")[0];
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

  ngOnInit() {}

  back() {
    this.db.toggleSettings();
  }
}
