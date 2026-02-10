/**
 * Calendar service for exporting trip activities to device calendar.
 * Uses expo-calendar for native calendar integration.
 */

import * as Calendar from 'expo-calendar';
import { Platform, Alert } from 'react-native';
import { Activity, Itinerary } from './api-service';

export class CalendarService {
    /**
     * Request calendar permissions from the user.
     */
    async requestPermissions(): Promise<boolean> {
        try {
            const { status } = await Calendar.requestCalendarPermissionsAsync();
            return status === 'granted';
        } catch (error) {
            console.error('[Calendar] Permission request failed:', error);
            return false;
        }
    }

    /**
     * Get the default calendar ID for the device.
     */
    async getDefaultCalendarId(): Promise<string | null> {
        try {
            const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

            // Filter for calendars that allow modifications
            const editableCalendars = calendars.filter(cal => cal.allowsModifications);

            if (editableCalendars.length === 0) {
                console.error('[Calendar] No editable calendars found');
                return null;
            }

            // Find default calendar among editable ones: prefer primary, then the first available editable one
            const defaultCalendar = editableCalendars.find(cal => cal.isPrimary) || editableCalendars[0];

            console.log('[Calendar] Using editable calendar:', defaultCalendar.title, `(${defaultCalendar.id})`);
            return defaultCalendar.id;
        } catch (error) {
            console.error('[Calendar] Failed to get calendars:', error);
            return null;
        }
    }

    /**
     * Calculate the actual date/time for an activity.
     */
    private calculateActivityDateTime(
        tripStartDate: string,
        dayNumber: number,
        startTime: string
    ): { startDate: Date; endDate: Date; duration: number } {
        // Parse trip start date
        const baseDate = new Date(tripStartDate);

        // Add days offset (day 1 = 0 offset, day 2 = 1 offset, etc.)
        const activityDate = new Date(baseDate);
        activityDate.setDate(baseDate.getDate() + (dayNumber - 1));

        // Parse start time (HH:MM format)
        const [hours, minutes] = startTime.split(':').map(Number);
        activityDate.setHours(hours, minutes, 0, 0);

        return {
            startDate: activityDate,
            endDate: activityDate,
            duration: 0, // Will be set by caller
        };
    }

    /**
     * Add a single activity to the calendar.
     */
    async addActivityToCalendar(
        activity: Activity,
        tripStartDate: string,
        dayNumber: number
    ): Promise<string | null> {
        try {
            // Request permissions
            const hasPermission = await this.requestPermissions();
            if (!hasPermission) {
                Alert.alert(
                    'Permission Required',
                    'Please grant calendar access to add events.'
                );
                return null;
            }

            // Get default calendar
            const calendarId = await this.getDefaultCalendarId();
            if (!calendarId) {
                Alert.alert('Error', 'No calendar found on device.');
                return null;
            }

            // Calculate date/time
            const { startDate } = this.calculateActivityDateTime(
                tripStartDate,
                dayNumber,
                activity.start_time
            );

            // Calculate end time
            const endDate = new Date(startDate);
            endDate.setMinutes(endDate.getMinutes() + activity.duration_minutes);

            // Create event
            const eventId = await Calendar.createEventAsync(calendarId, {
                title: activity.name,
                startDate,
                endDate,
                location: activity.location_name,
                notes: activity.description,
                alarms: [{ relativeOffset: -60 }], // 1 hour before
            });

            console.log('[Calendar] Created event:', eventId);
            return eventId;
        } catch (error) {
            console.error('[Calendar] Failed to create event:', error);
            Alert.alert('Error', 'Failed to add activity to calendar.');
            return null;
        }
    }

    /**
     * Export all activities from an itinerary to the calendar.
     */
    async exportAllActivities(itinerary: Itinerary): Promise<number> {
        try {
            // Request permissions
            const hasPermission = await this.requestPermissions();
            if (!hasPermission) {
                Alert.alert(
                    'Permission Required',
                    'Please grant calendar access to export activities.'
                );
                return 0;
            }

            // Get default calendar
            const calendarId = await this.getDefaultCalendarId();
            if (!calendarId) {
                Alert.alert('Error', 'No calendar found on device.');
                return 0;
            }

            if (!itinerary.start_date) {
                Alert.alert('Error', 'Trip start date is missing.');
                return 0;
            }

            let successCount = 0;

            // Iterate through all days and activities
            for (const day of itinerary.days) {
                for (const activity of day.activities) {
                    try {
                        const { startDate } = this.calculateActivityDateTime(
                            itinerary.start_date,
                            day.day_number,
                            activity.start_time
                        );

                        const endDate = new Date(startDate);
                        endDate.setMinutes(endDate.getMinutes() + activity.duration_minutes);

                        await Calendar.createEventAsync(calendarId, {
                            title: `${itinerary.trip_title} - ${activity.name}`,
                            startDate,
                            endDate,
                            location: activity.location_name,
                            notes: activity.description,
                            alarms: [{ relativeOffset: -60 }], // 1 hour before
                        });

                        successCount++;
                    } catch (error) {
                        console.error('[Calendar] Failed to create event for activity:', activity.name, error);
                    }
                }
            }

            if (successCount > 0) {
                Alert.alert(
                    'Success',
                    `Added ${successCount} ${successCount === 1 ? 'activity' : 'activities'} to your calendar!`
                );
            } else {
                Alert.alert('Error', 'Failed to add activities to calendar.');
            }

            return successCount;
        } catch (error) {
            console.error('[Calendar] Failed to export activities:', error);
            Alert.alert('Error', 'Failed to export activities to calendar.');
            return 0;
        }
    }
}

// Default singleton instance
export const calendarService = new CalendarService();
