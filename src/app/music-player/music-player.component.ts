import { Component, Input, OnChanges } from "@angular/core";
import {
  faPlay,
  faForward,
  faRandom,
  faBackward,
  faRedo,
  faPause,
  faHeart as faSolidHeart
} from "@fortawesome/free-solid-svg-icons";
import { faHeart } from "@fortawesome/free-regular-svg-icons";
import { Song, MusicController, DbService } from "../db.service";
import { Subscription, interval } from "rxjs";
@Component({
  selector: "app-music-player",
  templateUrl: "./music-player.component.html",
  styleUrls: ["./music-player.component.css"]
})
export class MusicPlayerComponent implements OnChanges {
  @Input() controller: MusicController;
  @Input() song: Song;
  faPlay = faPlay;
  faForward = faForward;
  faRandom = faRandom;
  faBackward = faBackward;
  faRedo = faRedo;
  faPause = faPause;
  faSolidHeart = faSolidHeart;
  faHeart = faHeart;
  curTime = 0;
  percentOfSong = 0;
  interval = 0;
  tickDurationMS = 100;
  timerSub: Subscription;
  constructor(private db: DbService) {}
  startTimer() {}

  ngOnChanges() {
    if (
      this.controller &&
      this.controller.startTime &&
      this.controller.duration
    ) {
      const now = Date.now();
      if (this.controller.pauseTime != -1 && this.controller.resumeTime != -1) {
        this.curTime =
          now -
          this.controller.resumeTime +
          this.controller.pauseTime -
          this.controller.startTime;
      } else if (this.controller.pauseTime != -1) {
        this.curTime = this.controller.pauseTime - this.controller.startTime;
      } else {
        this.curTime = now - this.controller.startTime;
      }
      this.percentOfSong =
        (this.curTime / 1000 / this.controller.duration) * 100;
      // get how many percent the bar moves in a tickDurationMS
      // divide by tickDurationMS -> convert to 100MS units
      // divide by 100 -> get MS per percent
      this.interval = 100 / this.controller.duration / 10;
      console.log(this.interval);
      if (this.timerSub) {
        this.timerSub.unsubscribe();
      }
      if (this.controller.pauseState) {
        return;
      }
      const timer$ = interval(this.tickDurationMS);
      this.timerSub = timer$.subscribe(() => {
        const now = Date.now();
        if (
          this.controller.pauseTime != -1 &&
          this.controller.resumeTime != -1
        ) {
          this.curTime =
            now -
            this.controller.resumeTime +
            this.controller.pauseTime -
            this.controller.startTime;
        } else if (this.controller.pauseTime != -1) {
          this.curTime = this.controller.pauseTime - this.controller.startTime;
        } else {
          this.curTime = now - this.controller.startTime;
        }
        this.percentOfSong =
          (this.curTime / 1000 / this.controller.duration) * 100;
        if (this.percentOfSong + this.interval > 100) {
          this.percentOfSong = 100;
          this.timerSub.unsubscribe();
        }
      });
    }
  }

  async updateTimePercent() {}

  toggleFavorite(song: Song) {
    this.db.toggleFavorite(song);
  }

  isFavorite(id: string): boolean {
    return this.db.isFavorite(id);
  }

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
    this.db.skipCurrent();
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
