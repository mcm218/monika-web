import { Component, OnInit, Input } from "@angular/core";
import { Song, DbService } from "../db.service";
import {
  faTimes,
  faHeart as faSolidHeart
} from "@fortawesome/free-solid-svg-icons";
import { faHeart } from "@fortawesome/free-regular-svg-icons";

@Component({
  selector: "app-song",
  templateUrl: "./song.component.html",
  styleUrls: ["./song.component.css"]
})
export class SongComponent implements OnInit {
  @Input() song: Song;
  faTimes = faTimes;
  faSolidHeart = faSolidHeart;
  faHeart = faHeart;

  constructor(private db: DbService) {}

  ngOnInit() {}

  removeFromQueue(): void {
    this.db.removeFromQueue(this.song);
  }

  toggleFavorite(song: Song) {
    this.db.toggleFavorite(song);
  }

  isFavorite(id: string): boolean {
    return this.db.isFavorite(id);
  }
}
