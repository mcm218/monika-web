import { Component, OnInit } from "@angular/core";
import { Song } from "../db.service";

@Component({
  selector: "app-queue",
  templateUrl: "./queue.component.html",
  styleUrls: ["./queue.component.css"]
})
export class QueueComponent implements OnInit {
  queue: Song[];
  constructor() {}

  ngOnInit() {
    this.queue = [];
    this.queue.push({
      id: "",
      thumbnail: "",
      title: "Come in",
      url: "youtube.com",
      artist: "Weatherday",
      user: "Me"
    });
    this.queue.push({
      id: "",
      thumbnail: "",
      title: "pretty cvnt",
      url: "youtube.com",
      artist: "Sewerslvt"
    });
    this.queue.push({
      id: "",
      thumbnail: "",
      title: "Youtube Video",
      url: "youtube.com"
    });
  }
}
