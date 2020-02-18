import { Component, OnInit } from "@angular/core";
import { faYoutube, faSpotify } from "@fortawesome/free-brands-svg-icons";
@Component({
  selector: "app-settings",
  templateUrl: "./settings.component.html",
  styleUrls: ["./settings.component.css"]
})
export class SettingsComponent implements OnInit {
  faYoutube = faYoutube;
  faSpotify = faSpotify;
  constructor() {}

  ngOnInit() {}

  authYoutube(): void {}
  authSpotify(): void {}
}
