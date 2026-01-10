'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { isToday, isTomorrow, isPast, parseISO, isWithinInterval, addHours } from 'date-fns';

export function useUpcomingReminders() {
    const { user } = useAuthStore();

    // Fetch tasks
    const { data: tasks = [] } = useQuery({
        queryKey: ['tasks'],
        queryFn: apiClient.tasks.list,
        enabled: !!user,
    });

    // Fetch follow-ups
    const { data: followUps = [] } = useQuery({
        queryKey: ['followUps'],
        queryFn: apiClient.followUps.list,
        enabled: !!user,
    });

    // Fetch appointments
    const { data: appointments = [] } = useQuery({
        queryKey: ['appointments'],
        queryFn: apiClient.appointments.list,
        enabled: !!user,
    });

    useEffect(() => {
        if (!user) return;

        // Check for overdue and upcoming tasks
        const myTasks = tasks.filter((task: any) =>
            task.assigned_to === user.id && task.status !== 'Done'
        );

        const overdueTasks = myTasks.filter((task: any) => {
            if (!task.due_date) return false;
            return isPast(parseISO(task.due_date)) && !isToday(parseISO(task.due_date));
        });

        const todayTasks = myTasks.filter((task: any) => {
            if (!task.due_date) return false;
            return isToday(parseISO(task.due_date));
        });

        // Check for pending and upcoming follow-ups
        const myFollowUps = followUps.filter((f: any) =>
            f.assignedTo === user.id && f.status === 'Pending'
        );

        const overdueFollowUps = myFollowUps.filter((f: any) => {
            return isPast(parseISO(f.scheduledFor)) && !isToday(parseISO(f.scheduledFor));
        });

        const todayFollowUps = myFollowUps.filter((f: any) => {
            return isToday(parseISO(f.scheduledFor));
        });

        const tomorrowFollowUps = myFollowUps.filter((f: any) => {
            return isTomorrow(parseISO(f.scheduledFor));
        });

        // Check for upcoming within next 2 hours
        const upcomingSoonFollowUps = myFollowUps.filter((f: any) => {
            const scheduledTime = parseISO(f.scheduledFor);
            const now = new Date();
            const twoHoursFromNow = addHours(now, 2);
            return isWithinInterval(scheduledTime, { start: now, end: twoHoursFromNow });
        });

        // Check for today's appointments
        const myAppointments = appointments.filter((appt: any) =>
            appt.assigned_to === user.id && appt.status !== 'Cancelled'
        );

        const todayAppointments = myAppointments.filter((appt: any) => {
            return isToday(parseISO(appt.scheduled_time));
        });

        const upcomingSoonAppointments = myAppointments.filter((appt: any) => {
            const scheduledTime = parseISO(appt.scheduled_time);
            const now = new Date();
            const twoHoursFromNow = addHours(now, 2);
            return isWithinInterval(scheduledTime, { start: now, end: twoHoursFromNow });
        });

        // Show toast notifications (only once per session using sessionStorage)
        const notificationKey = `notifications-shown-${user.id}-${new Date().toDateString()}`;
        const alreadyShown = sessionStorage.getItem(notificationKey);

        if (!alreadyShown) {
            let hasNotifications = false;

            // Overdue tasks
            if (overdueTasks.length > 0) {
                toast.error(`⚠️ You have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}!`, {
                    duration: 5000,
                    icon: '📋',
                });
                hasNotifications = true;
            }

            // Today's tasks
            if (todayTasks.length > 0) {
                toast(`📋 ${todayTasks.length} task${todayTasks.length > 1 ? 's' : ''} due today!`, {
                    duration: 4000,
                    icon: '⏰',
                });
                hasNotifications = true;
            }

            // Overdue follow-ups
            if (overdueFollowUps.length > 0) {
                toast.error(`🔔 ${overdueFollowUps.length} overdue follow-up${overdueFollowUps.length > 1 ? 's' : ''}!`, {
                    duration: 5000,
                });
                hasNotifications = true;
            }

            // Upcoming soon follow-ups
            if (upcomingSoonFollowUps.length > 0) {
                upcomingSoonFollowUps.forEach((f: any) => {
                    toast.success(`📞 Follow-up with ${f.studentName} coming up soon!`, {
                        duration: 6000,
                        icon: '⏰',
                    });
                });
                hasNotifications = true;
            }

            // Today's follow-ups
            if (todayFollowUps.length > 0 && upcomingSoonFollowUps.length === 0) {
                toast(`🔔 You have ${todayFollowUps.length} follow-up${todayFollowUps.length > 1 ? 's' : ''} scheduled today!`, {
                    duration: 4000,
                });
                hasNotifications = true;
            }

            // Tomorrow's follow-ups
            if (tomorrowFollowUps.length > 0) {
                toast(`📅 ${tomorrowFollowUps.length} follow-up${tomorrowFollowUps.length > 1 ? 's' : ''} scheduled for tomorrow`, {
                    duration: 3000,
                    icon: 'ℹ️',
                });
                hasNotifications = true;
            }

            // Upcoming appointments
            if (upcomingSoonAppointments.length > 0) {
                upcomingSoonAppointments.forEach((appt: any) => {
                    toast.success(`📅 Appointment coming up soon!`, {
                        duration: 6000,
                        icon: '⏰',
                    });
                });
                hasNotifications = true;
            }

            // Today's appointments
            if (todayAppointments.length > 0 && upcomingSoonAppointments.length === 0) {
                toast(`📅 ${todayAppointments.length} appointment${todayAppointments.length > 1 ? 's' : ''} scheduled today!`, {
                    duration: 4000,
                });
                hasNotifications = true;
            }

            // Mark as shown for today
            if (hasNotifications) {
                sessionStorage.setItem(notificationKey, 'true');
            }
        }
    }, [user, tasks, followUps, appointments]);

    return {
        pendingTasksCount: tasks.filter((t: any) => t.assigned_to === user?.id && t.status !== 'Done').length,
        pendingFollowUpsCount: followUps.filter((f: any) => f.assignedTo === user?.id && f.status === 'Pending').length,
        todayAppointmentsCount: appointments.filter((a: any) =>
            a.assigned_to === user?.id && isToday(parseISO(a.scheduled_time))
        ).length,
    };
}
