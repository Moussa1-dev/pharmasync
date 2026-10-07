import { AuthService } from '../auth.service';
import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AppNotification, NotificationService } from '../notification.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit, OnDestroy {
  notifications: AppNotification[] = [];
  unreadCount = 0;
  private sub?: Subscription;

  constructor(
    private notificationService: NotificationService,
    private router: Router,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    this.sub = this.notificationService.items$.subscribe((items) => {
      this.notifications = items;
      this.unreadCount = items.filter(item => !item.readFlag).length;
    });

    this.notificationService.refresh();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  openNotification(notification: AppNotification): void {
    if (!notification.readFlag) {
      this.notificationService.markRead(notification.id);
    }

    if (notification.link) {
      this.router.navigateByUrl(notification.link);
    }
  }

  markAllRead(): void {
    this.notificationService.markAllRead();
  }

  trackByNotification(index: number, item: AppNotification): number {
    return item.id ?? index;
  }
}
