import { Component, OnInit, Input, NgZone } from "@angular/core";
import { Playlist, DbService, Song } from "../db.service";
import {
  faHeart as faSolidHeart,
  faPlus,
  faTimes
} from "@fortawesome/free-solid-svg-icons";
import { faHeart } from "@fortawesome/free-regular-svg-icons";
import { ToastrService } from "ngx-toastr";

@Component({
  selector: "app-list",
  templateUrl: "./list.component.html",
  styleUrls: ["./list.component.css"]
})
export class ListComponent implements OnInit {
  @Input() playlist: Playlist;

  faHeart = faHeart;
  faPlus = faPlus;
  faTimes = faTimes;
  faSolidHeart = faSolidHeart;

  constructor(private db: DbService, private toastr: ToastrService) {
  }

  ngOnInit() {
    if(this.playlist && this.playlist.songs){
      this.playlist.songs.reverse();
    }
  }

  deselectList() {
    this.db.deselectList();
  }

  isFavorite(id: string): boolean {
    return this.db.isFavorite(id);
  }
  toggleFavorite(song: Song) {
    this.db.toggleFavorite(song);
  }

  addToQueue(song: Song) {
    this.toastr.show(this.db.fixStringFormatting(song.title) + " was added to the queue!", "");
    this.db.addToQueue(song);
  }
}
