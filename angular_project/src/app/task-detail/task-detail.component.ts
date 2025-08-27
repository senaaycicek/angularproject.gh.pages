import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TaskService, Todo } from '../services/task.service';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './task-detail.component.html',
  styleUrls: ['./task-detail.component.css']
})
export class TaskDetailComponent implements OnInit {
  protected id: number | null = null;
  protected errorMessage: string | null = null;
  protected task: Todo | null = null;
  protected isFallback = false;

  constructor(
    private route: ActivatedRoute,
    private taskService: TaskService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.id = idParam ? Number(idParam) : null;
    
    if (this.id !== null && !isNaN(this.id)) {
      this.taskService.getTaskById(this.id).subscribe({
        next: (data: Todo) => {
          this.task = data;
          if (data.title && data.title.includes('fallback')) {
            this.isFallback = true;
          }
          console.log('Task detail loaded:', data);
        },
        error: (err: unknown) => {
          console.error('Error loading task detail:', err);
          const e = err as Error;
          this.errorMessage = e.message || 'Task details could not be loaded.';
        }
      });
    }
  }
}
