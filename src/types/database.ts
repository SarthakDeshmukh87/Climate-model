export type RiskLevel = 'Safe' | 'Low' | 'Moderate' | 'High' | 'Extreme' | 'Emergency';

export type UserRole = 'user' | 'admin';

export interface WeatherStation {
  Station_ID: number;
  Station_Code: string;
  Station_Name: string;
  Latitude: number;
  Longitude: number;
  Status: 'Active' | 'Maintenance' | 'Inactive';
  isCustom?: boolean;
  createdBy?: string;
}

export interface StationLocation {
  Station_ID: number;
  Location: string;
}

export interface WeatherObservation {
  Obs_ID: number;
  Station_ID: number;
  Recorded_At: string;
  Temperature: number;
  Humidity: number;
  Rainfall: number;
  Wind_Speed: number;
  // Joins / Joined Data
  Weather_Station?: WeatherStation;
  Station_Location?: StationLocation[];
}

export interface ReportAnalysis {
  R_ID: number;
  Obs_ID: number;
  Report_Type: string;
  Criteria: string;
  Description: string;
  Generated_At: string;
  Weather_Observation?: WeatherObservation;
}

export interface HeatwavePrediction {
  Pre_ID: number;
  Station_ID: number;
  Pre_Temp: number;
  Target_Data: string;
  Risk_level: RiskLevel;
  Confidence_Percent: number;
  Weather_Station?: WeatherStation;
}

export interface Alert {
  Alert_ID: number;
  Pre_ID: number | null;
  Obs_ID: number | null;
  Alert_msg: string;
  Severity_level: RiskLevel;
  Status: 'Active' | 'Resolved' | 'Dismissed';
  Heatwave_Prediction?: HeatwavePrediction;
  Weather_Observation?: WeatherObservation;
}

export interface User {
  User_ID: string;
  User_Name: string;
  Email: string;
  Phone_no: string | null;
  DOB: string | null;
  Role: UserRole;
}

export interface UserFeedback {
  F_ID: number;
  User_ID: string;
  F_Type: string;
  Comments: string;
  Rating: number;
  Submitted_at: string;
  User?: User;
}

export interface WeatherAPIResponse {
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    precipitation: number;
    wind_speed_10m: number;
    weather_code: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    precipitation: number[];
    wind_speed_10m: number[];
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    wind_speed_10m_max: number[];
  };
}
