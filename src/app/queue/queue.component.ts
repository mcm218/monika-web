import { Component, OnInit, Input } from "@angular/core";
import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
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

  drop(event: CdkDragDrop<Song[]>): void {
    moveItemInArray(this.queue, event.previousIndex, event.currentIndex);
    this.db.updateQueue(this.queue);
  }
}
