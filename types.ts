// types.ts
export type StudentRecord = {
    id: string;
    ip: string;
    timestamp: string;
  };
  
  export type Session = {
    id: string;
    socket: any;
    port: number;
    broadcastInterval?: NodeJS.Timeout;
  };
  
  export type HeaderProps = {
    title: string;
    subtitle?: string;
  };