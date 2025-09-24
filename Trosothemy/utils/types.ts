export interface Reminder {
  note: string;
  location: {
    latitude: number;
    longitude: number;
  };
  timestamp: number;
}
