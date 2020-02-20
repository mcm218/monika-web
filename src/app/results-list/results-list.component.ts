import { Component, OnInit, Input } from "@angular/core";
import { DbService, Song } from "../db.service";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { MatSnackBar } from "@angular/material/snack-bar";

@Component({
  selector: "app-results-list",
  templateUrl: "./results-list.component.html",
  styleUrls: ["./results-list.component.css"]
})
export class ResultsListComponent implements OnInit {
  faTimes = faTimes;
  results: any[];
  constructor(private db: DbService, private _snackBar: MatSnackBar) {
    this.db.results.subscribe(results => (this.results = results));
  }

  ngOnInit() {}

  addToQueue(result: any) {
    this.openSnackBar(result);
    this.db.addToQueue(result);
  }

  back() {
    this.db.clearResults();
  }

  openSnackBar(song: Song) {
    this._snackBar.open(song.title + " added to queue!", "", {
      duration: 2000
    });
  }
}
