// types/index.ts
export interface User {
    id: string;
    name: string;
    email: string;
    type: 'student' | 'lecturer';
  }
  
  export interface StudentRecord {
    id: string;
    ip: string;
    timestamp: string;
  }
  
  export type UserType = 'student' | 'lecturer';