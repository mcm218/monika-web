import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { HomeComponent } from "./home/home.component";
import { DesktopAuthComponent } from './desktop-auth/desktop-auth.component';

const routes: Routes = [{ path: "", component: HomeComponent }, { path: "auth", component: DesktopAuthComponent }];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
