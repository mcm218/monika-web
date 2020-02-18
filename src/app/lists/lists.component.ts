import { Component, OnInit, Input } from "@angular/core";
import { Playlist, DbService } from "../db.service";
import { faYoutube, faSpotify } from "@fortawesome/free-brands-svg-icons";
import { faCloud } from "@fortawesome/free-solid-svg-icons";

@Component({
  selector: "app-lists",
  templateUrl: "./lists.component.html",
  styleUrls: ["./lists.component.css"]
})
export class ListsComponent implements OnInit {
  @Input() playlists: Playlist[];
  faYoutube = faYoutube;
  faSpotify = faSpotify;
  faCloud = faCloud;

  constructor(private db: DbService) {}

  ngOnInit() {}

  selectList(playlist: Playlist) {
    this.db.selectList(playlist);
  }
}
