import { Component, OnInit } from "@angular/core";
import {
  faPlay,
  faForward,
  faRandom,
  faBackward,
  faRedo,
  faPause
} from "@fortawesome/free-solid-svg-icons";

@Component({
  selector: "app-inline-music-player",
  templateUrl: "./inline-music-player.component.html",
  styleUrls: ["./inline-music-player.component.css"]
})
export class InlineMusicPlayerComponent implements OnInit {
  faPlay = faPlay;
  faForward = faForward;
  faRandom = faRandom;
  faBackward = faBackward;
  faRedo = faRedo;
  faPause = faPause;
  constructor() {}

  ngOnInit() {}
}
