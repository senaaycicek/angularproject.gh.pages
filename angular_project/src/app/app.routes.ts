import { Routes } from '@angular/router';
import { TaskListComponent } from './task-list/task-list.component';     // liste sayfası
import { TaskDetailComponent } from './task-detail/task-detail.component'; // detay sayfası

export const routes: Routes = [
  { path: '', redirectTo: 'tasks', pathMatch: 'full' },   // boş adrese gelirse /tasks’e yönlendir
  { path: 'tasks', component: TaskListComponent },         // liste sayfası
  { path: 'tasks/:id', component: TaskDetailComponent },   // detay sayfası (dinamik :id)
  { path: '**', redirectTo: 'tasks' }                      // yanlış adres → listeye dön
];
