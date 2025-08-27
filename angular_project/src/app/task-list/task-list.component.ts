import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TaskService, Todo } from '../services/task.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, HttpClientModule, ReactiveFormsModule, RouterModule],
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.css']
})
export class TaskListComponent implements OnInit {
  protected tasks: Todo[] = [];
  protected errorMessage: string | null = null;
  protected localTasks: Todo[] = []; // Store locally added tasks
  protected deletedTaskIds: number[] = []; // Store IDs of deleted tasks

  protected form: import('@angular/forms').FormGroup; // Form burada tanımlandı, constructor içinde doldurulacak

  constructor(
    private taskService: TaskService,
    private fb: FormBuilder
  ) {
    // ✅ Formu burada başlatıyoruz
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      completed: [false],
    });
  }

  ngOnInit(): void {
    // Load local tasks and deleted tasks from localStorage
    const storedTasks = localStorage.getItem('localTasks');
    if (storedTasks) {
      this.localTasks = JSON.parse(storedTasks);
    }
    
    const storedDeletedIds = localStorage.getItem('deletedTaskIds');
    if (storedDeletedIds) {
      this.deletedTaskIds = JSON.parse(storedDeletedIds);
    }
    
    this.loadTasks();
  }

  // Load tasks from server and merge with local changes
  private loadTasks(): void {
    console.log('Starting to load tasks from API...');
    
    // Load local tasks from localStorage
    const savedLocalTasks = localStorage.getItem('localTasks');
    if (savedLocalTasks) {
      this.localTasks = JSON.parse(savedLocalTasks);
    }
    
    const savedDeletedIds = localStorage.getItem('deletedTaskIds');
    const deletedIds: number[] = savedDeletedIds ? JSON.parse(savedDeletedIds) : [];

    this.taskService.getTasks().subscribe({
      next: (data: Todo[]) => {
        console.log('SUCCESS: Raw data received:', data.length, 'tasks');
        
        // Filter out deleted tasks
        let filteredTasks = data.filter(task => !deletedIds.includes(task.id));
        
        // Add local tasks
        const allTasks = [...this.localTasks, ...filteredTasks];
        
        // Sort by id ascending (1, 2, 3... 200, 201, 202...)
        this.tasks = allTasks.sort((a, b) => a.id - b.id);
        
        this.errorMessage = null;
        console.log('Final task count:', this.tasks.length);
      },
      error: (error) => {
        console.error('ERROR loading tasks:', error);
        this.errorMessage = 'Failed to load tasks. Check network connection.';
        // Show only local tasks if API fails
        this.tasks = [...this.localTasks];
      }
    });
  }

  // Add new task (POST)
  protected onSubmit(): void {
    if (this.form.invalid) return;

    const payload = {
      title: this.form.value.title!,
      completed: !!this.form.value.completed,
    };

    console.log('Submitting new task:', payload);

    // Create optimistic UI task with proper ID (start from 201)
    const maxId = Math.max(...this.tasks.map(t => t.id));
    const optimisticId = maxId >= 200 ? maxId + 1 : 201;
    const optimisticTask: Todo = {
      id: optimisticId,
      title: payload.title,
      completed: payload.completed
    };

    // Add to tasks array and sort by ID ascending
    this.tasks = [...this.tasks, optimisticTask].sort((a, b) => a.id - b.id);
    
    // Save to localStorage
    this.localTasks.push(optimisticTask);
    localStorage.setItem('localTasks', JSON.stringify(this.localTasks));
    
    this.form.reset({ title: '', completed: false });

    // Try to persist to server (will only work with json-server)
    this.taskService.createTask(payload).subscribe({
      next: (created) => {
        console.log('Task successfully created on server:', created);
      },
      error: (err) => {
        console.log('Server create failed (expected for demo), keeping local task');
      }
    });
  }

  // Delete task (optimistic for demo data)
  protected onDelete(id: number): void {
    if (!confirm('Are you sure you want to delete this task?')) return;

    // Optimistic delete: remove from list immediately
    const backup = [...this.tasks];
    this.tasks = this.tasks.filter((t) => t.id !== id);

    // Check if this is a locally added task (ID >= 201)
    if (id >= 201) {
      // Remove from localStorage localTasks
      this.localTasks = this.localTasks.filter(t => t.id !== id);
      localStorage.setItem('localTasks', JSON.stringify(this.localTasks));
      console.log('Local task removed from localStorage:', id);
    } else {
      // For demo tasks (ID 1-200), add to deleted list
      this.deletedTaskIds.push(id);
      localStorage.setItem('deletedTaskIds', JSON.stringify(this.deletedTaskIds));
      console.log('Demo task marked as deleted:', id);
    }

    // Try to delete from server (will only work for local json-server tasks)
    this.taskService.deleteTask(id).subscribe({
      next: () => {
        console.log('Task deleted successfully from server');
      },
      error: (err) => {
        console.log('Server delete failed (expected for demo data), keeping optimistic delete');
        // Don't restore - for demo purposes, keep the optimistic delete
        // this.tasks = backup;
      },
    });
  }

  // trackBy fonksiyonu ngFor performansı için
  protected trackById(index: number, item: Todo): number {
    return item.id;
  }
}
