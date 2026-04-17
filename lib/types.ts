export interface TimeSlot {
  courtId: string;
  courtName: string;
  clubId: string;
  clubName: string;
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:MM
  endTime: string;    // HH:MM
  duration: number;   // minutes
  price?: string;     // np. "60.00 PLN"
  bookingUrl?: string;
  courtType?: 'indoor' | 'outdoor';
}
