export interface Step {
    id: number;
    type: 'image' | 'title' | 'audio';
    prompt: string;
    options?: string[];
    content?: string;
  }
  
  export interface AudioResponse {
    success: boolean;
    message?: string;
  }