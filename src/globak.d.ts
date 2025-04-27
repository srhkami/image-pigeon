export {};

declare global {
  interface Window {
    pywebview: {
      api: {
        save_data(data: any): Promise<any>;
      };
    };
  }
}