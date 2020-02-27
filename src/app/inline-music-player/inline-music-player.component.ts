import { Component, OnInit, Input } from "@angular/core";
import {
  faPlay,
  faForward,
  faRandom,
  faBackward,
  faRedo,
  faPause
} from "@fortawesome/free-solid-svg-icons";
import { MusicController, Song, DbService } from "../db.service";

@Component({
  selector: "app-inline-music-player",
  templateUrl: "./inline-music-player.component.html",
  styleUrls: ["./inline-music-player.component.css"]
})
export class InlineMusicPlayerComponent implements OnInit {
  @Input() controller: MusicController;
  @Input() song: Song;

  faPlay = faPlay;
  faForward = faForward;
  faRandom = faRandom;
  faBackward = faBackward;
  faRedo = faRedo;
  faPause = faPause;
  constructor(private db: DbService) {}

  ngOnInit() {}

  // Reorder queue, update
  shuffle(): void {
    this.db.shuffle();
  }

  // Reset stream to beginning of song
  prevSong(): void {
    this.db.previousSong();
  }

  // If playing, pause; else play
  togglePlay(): void {
    this.controller.pauseState = !this.controller.pauseState;
    this.db.updateController(this.controller);
  }

  //
  nextSong(): void {
    if (this.song) {
      this.db.skipCurrent();
    }
  }

  toggleLoop(): void {
    this.controller.loop++;
    if (this.controller.loop > 2) {
      this.controller.loop = 0;
    }
    this.db.updateController(this.controller);
  }

  changeVolume(event: any): void {
    this.controller.volume = event.target.value;
    this.db.updateController(this.controller);
  }
}
