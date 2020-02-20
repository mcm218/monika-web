import { Component, OnInit, Input } from "@angular/core";
import { Playlist, DbService, Song } from "../db.service";
import {
  faHeart as faSolidHeart,
  faPlus,
  faTimes
} from "@fortawesome/free-solid-svg-icons";
import { faHeart } from "@fortawesome/free-regular-svg-icons";
import { MatSnackBar } from "@angular/material/snack-bar";

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

  constructor(private db: DbService, private snackBar: MatSnackBar) {}

  ngOnInit() {}

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
    this.openSnackBar(song);
    this.db.addToQueue(song);
  }

  openSnackBar(song: Song) {
    console.log("Opening snackbar?");
    this.snackBar.open(song.title + " added to queue!", "", {
      duration: 2000
    });
  }
}
