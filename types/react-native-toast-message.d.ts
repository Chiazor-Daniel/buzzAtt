declare module 'react-native-toast-message' {
  const Toast: {
    show: (options: {
      type: string;
      text1: string;
      text2?: string;
    }) => void;
  };
  export default Toast;
} 