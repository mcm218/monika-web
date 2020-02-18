import { Component, OnInit, Input } from "@angular/core";
import { Song, DbService } from "../db.service";

@Component({
  selector: "app-queue",
  templateUrl: "./queue.component.html",
  styleUrls: ["./queue.component.css"]
})
export class QueueComponent implements OnInit {
  @Input() queue: Song[];
  constructor(private db: DbService) {}

  ngOnInit() {}
}
