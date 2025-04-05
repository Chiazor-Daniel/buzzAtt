declare module 'react-native-zeroconf' {
  class Zeroconf {
    on(event: string, callback: (service: any) => void): void;
    removeAllListeners(event: string): void;
    scan(serviceType: string): void;
    stop(): void;
    publishService(protocol: string, type: string, domain: string, name: string, port: number, txt?: Record<string, string>): void;
    unpublishService(): void;
  }
  export default Zeroconf;
} 