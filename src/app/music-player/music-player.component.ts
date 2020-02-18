import { Component, OnInit, Input } from "@angular/core";
import {
  faPlay,
  faForward,
  faRandom,
  faBackward,
  faRedo,
  faPause
} from "@fortawesome/free-solid-svg-icons";
import { Song } from "../db.service";
@Component({
  selector: "app-music-player",
  templateUrl: "./music-player.component.html",
  styleUrls: ["./music-player.component.css"]
})
export class MusicPlayerComponent implements OnInit {
  @Input() song: Song;
  faPlay = faPlay;
  faForward = faForward;
  faRandom = faRandom;
  faBackward = faBackward;
  faRedo = faRedo;
  faPause = faPause;

  constructor() {}

  ngOnInit() {}
}
